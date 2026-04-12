/**
 * Unit tests for auth.service.js
 * All external deps (prisma, redis, email) are mocked.
 */
jest.mock('../../src/shared/config/database');
jest.mock('../../src/shared/config/redis');
jest.mock('../../src/shared/utils/email.helper');

const prisma = require('../../src/shared/config/database');
const redis = require('../../src/shared/config/redis');
const { sendVerificationEmail } = require('../../src/shared/utils/email.helper');
const authService = require('../../src/modules/auth/auth.service');
const bcrypt = require('bcryptjs');
const { signRefreshToken } = require('../../src/shared/utils/jwt.helper');

// Minimal user fixture
const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  passwordHash: bcrypt.hashSync('password123', 10),
  displayName: 'Test User',
  role: 'user',
  isVerified: true,
  isActive: true,
  avatarUrl: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  redis.set = jest.fn().mockResolvedValue('OK');
  redis.get = jest.fn().mockResolvedValue(null);
  redis.del = jest.fn().mockResolvedValue(1);
  sendVerificationEmail.mockResolvedValue();
});

// ─── Password hashing ────────────────────────────────────────────────────────

describe('password hashing', () => {
  test('bcrypt hash differs from plaintext', async () => {
    const hash = await bcrypt.hash('mypassword', 12);
    expect(hash).not.toBe('mypassword');
    expect(await bcrypt.compare('mypassword', hash)).toBe(true);
  });

  test('wrong password does not match', async () => {
    const hash = await bcrypt.hash('correct', 12);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});

// ─── JWT generation/validation ───────────────────────────────────────────────

describe('JWT helpers', () => {
  const { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } = require('../../src/shared/utils/jwt.helper');

  test('signAccessToken produces a verifiable token', () => {
    const token = signAccessToken({ id: 'x', email: 'a@b.com', role: 'user' });
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe('x');
    expect(decoded.role).toBe('user');
  });

  test('signRefreshToken produces a verifiable token', () => {
    const token = signRefreshToken({ id: 'x', email: 'a@b.com', role: 'user' });
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe('x');
  });

  test('verifyAccessToken throws on tampered token', () => {
    expect(() => verifyAccessToken('bad.token.here')).toThrow();
  });
});

// ─── register ────────────────────────────────────────────────────────────────

describe('authService.register', () => {
  test('creates user and sends verification email', async () => {
    prisma.user = {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ ...mockUser, isVerified: false }),
    };

    const result = await authService.register({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
      role: 'user',
    });

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledTimes(1);
    expect(sendVerificationEmail).toHaveBeenCalledWith('new@example.com', expect.stringContaining('token='));
    expect(result.message).toBe('Verification email sent');
    expect(result.userId).toBeDefined();
  });

  test('throws EMAIL_TAKEN if email exists', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue(mockUser) };

    await expect(
      authService.register({ email: 'test@example.com', password: 'pass1234', displayName: 'X', role: 'user' })
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });

  test('creates Artist record when role is artist', async () => {
    prisma.user = {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ ...mockUser, role: 'artist', isVerified: false }),
    };
    prisma.artist = { create: jest.fn().mockResolvedValue({}) };

    await authService.register({
      email: 'artist@example.com',
      password: 'password123',
      displayName: 'Artist',
      role: 'artist',
    });

    expect(prisma.artist.create).toHaveBeenCalledWith({ data: { userId: mockUser.id } });
  });
});

// ─── verifyEmail ─────────────────────────────────────────────────────────────

describe('authService.verifyEmail', () => {
  test('marks user verified and deletes token', async () => {
    redis.get = jest.fn().mockResolvedValue('user-uuid-1');
    prisma.user = { update: jest.fn().mockResolvedValue({ ...mockUser, isVerified: true }) };

    const result = await authService.verifyEmail({ token: 'valid-token' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-uuid-1' },
      data: { isVerified: true },
    });
    expect(redis.del).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('Email verified successfully');
  });

  test('throws INVALID_TOKEN for unknown token', async () => {
    redis.get = jest.fn().mockResolvedValue(null);

    await expect(authService.verifyEmail({ token: 'bad-token' })).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  test('returns tokens and user on valid credentials', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue(mockUser) };
    prisma.userPreference = { count: jest.fn().mockResolvedValue(0) };

    const result = await authService.login({ email: mockUser.email, password: 'password123' });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe(mockUser.email);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  test('isOnboarded is true when user has preferences', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue(mockUser) };
    prisma.userPreference = { count: jest.fn().mockResolvedValue(3) };

    const result = await authService.login({ email: mockUser.email, password: 'password123' });

    expect(result.user.isOnboarded).toBe(true);
  });

  test('isOnboarded is false when user has no preferences', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue(mockUser) };
    prisma.userPreference = { count: jest.fn().mockResolvedValue(0) };

    const result = await authService.login({ email: mockUser.email, password: 'password123' });

    expect(result.user.isOnboarded).toBe(false);
  });

  test('throws INVALID_CREDENTIALS for wrong password', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue(mockUser) };

    await expect(authService.login({ email: mockUser.email, password: 'wrong' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  test('throws EMAIL_NOT_VERIFIED if not verified', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue({ ...mockUser, isVerified: false }) };

    await expect(authService.login({ email: mockUser.email, password: 'password123' })).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
    });
  });

  test('throws ACCOUNT_LOCKED if inactive', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue({ ...mockUser, isActive: false }) };

    await expect(authService.login({ email: mockUser.email, password: 'password123' })).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
    });
  });
});
