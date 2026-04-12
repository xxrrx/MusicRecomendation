jest.mock('../../src/shared/config/database');

const prisma = require('../../src/shared/config/database');
const userService = require('../../src/modules/user/user.service');

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user',
  avatarUrl: null,
  isVerified: true,
  createdAt: new Date('2026-01-01'),
};

beforeEach(() => jest.clearAllMocks());

// ─── getMe ───────────────────────────────────────────────────────────────────

describe('userService.getMe', () => {
  test('returns formatted user', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue(mockUser) };

    const result = await userService.getMe('user-1');

    expect(result.id).toBe('user-1');
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.createdAt).toBeDefined();
  });

  test('throws NOT_FOUND if user missing', async () => {
    prisma.user = { findUnique: jest.fn().mockResolvedValue(null) };

    await expect(userService.getMe('bad-id')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ─── patchMe ─────────────────────────────────────────────────────────────────

describe('userService.patchMe', () => {
  test('updates displayName', async () => {
    const updated = { ...mockUser, displayName: 'New Name' };
    prisma.user = { update: jest.fn().mockResolvedValue(updated) };

    const result = await userService.patchMe('user-1', { displayName: 'New Name' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { displayName: 'New Name' },
    });
    expect(result.displayName).toBe('New Name');
  });

  test('updates artist bio when role is artist', async () => {
    const artistUser = { ...mockUser, role: 'artist' };
    prisma.user = { update: jest.fn().mockResolvedValue(artistUser) };
    prisma.artist = { update: jest.fn().mockResolvedValue({}) };

    await userService.patchMe('user-1', { bio: 'My bio' });

    expect(prisma.artist.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { bio: 'My bio' },
    });
  });

  test('does not touch artist table for regular user', async () => {
    prisma.user = { update: jest.fn().mockResolvedValue(mockUser) };
    prisma.artist = { update: jest.fn() };

    await userService.patchMe('user-1', { bio: 'ignored' });

    expect(prisma.artist.update).not.toHaveBeenCalled();
  });
});

// ─── saveOnboarding ──────────────────────────────────────────────────────────

describe('userService.saveOnboarding', () => {
  const genreIds = ['genre-1', 'genre-2'];

  test('saves genre preferences', async () => {
    prisma.genre = {
      findMany: jest.fn().mockResolvedValue([{ id: 'genre-1' }, { id: 'genre-2' }]),
    };
    prisma.userPreference = {
      deleteMany: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    };
    prisma.$transaction = jest.fn().mockResolvedValue([]);

    const result = await userService.saveOnboarding('user-1', genreIds);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('Preferences saved');
  });

  test('throws VALIDATION_ERROR for unknown genreId', async () => {
    prisma.genre = { findMany: jest.fn().mockResolvedValue([{ id: 'genre-1' }]) }; // only 1 returned

    await expect(userService.saveOnboarding('user-1', genreIds)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});
