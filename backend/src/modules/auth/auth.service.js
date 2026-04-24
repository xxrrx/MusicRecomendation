const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../../shared/config/database');
const redis = require('../../shared/config/redis');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../shared/utils/jwt.helper');
const { sendVerificationEmail } = require('../../shared/utils/email.helper');
const { createError } = require('../../shared/utils/response.helper');

const VERIFY_TOKEN_TTL = 60 * 60 * 24; // 24 hours
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

// Redis key helpers
const verifyKey = (token) => `email_verify:${token}`;
const refreshKey = (token) => `refresh:${token}`;
const blacklistKey = (token) => `blacklist:${token}`;

async function register({ email, password, displayName, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError('Email already registered', 409, 'EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName, role },
  });

  // If artist role, create Artist record
  if (role === 'artist') {
    await prisma.artist.create({ data: { userId: user.id } });
  }

  // Generate and store email verification token
  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(verifyKey(token), user.id, 'EX', VERIFY_TOKEN_TTL);

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  await sendVerificationEmail(email, verifyUrl);

  return { message: 'Verification email sent', userId: user.id };
}

async function resendVerification({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw createError('Email not found', 404, 'NOT_FOUND');
  if (user.isVerified) throw createError('Email already verified', 400, 'ALREADY_VERIFIED');

  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(verifyKey(token), user.id, 'EX', VERIFY_TOKEN_TTL);

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  await sendVerificationEmail(email, verifyUrl);

  return { message: 'Verification email resent' };
}

async function verifyEmail({ token }) {
  const userId = await redis.get(verifyKey(token));
  if (!userId) throw createError('Token expired or invalid', 400, 'INVALID_TOKEN');

  await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
  await redis.del(verifyKey(token));

  return { message: 'Email verified successfully' };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  if (!user.isActive) throw createError('Account is deactivated', 403, 'ACCOUNT_LOCKED');
  if (!user.isVerified) throw createError('Email not yet confirmed', 403, 'EMAIL_NOT_VERIFIED');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store refresh token in Redis for rotation/blacklist support
  await redis.set(refreshKey(refreshToken), user.id, 'EX', REFRESH_TOKEN_TTL);

  const prefCount = await prisma.userPreference.count({ where: { userId: user.id } });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isOnboarded: prefCount > 0,
    },
  };
}

async function logout(refreshToken) {
  if (!refreshToken) return { message: 'Logged out successfully' };

  // Remove from valid tokens and blacklist it
  await redis.del(refreshKey(refreshToken));
  await redis.set(blacklistKey(refreshToken), '1', 'EX', REFRESH_TOKEN_TTL);

  return { message: 'Logged out successfully' };
}

async function refreshAccessToken({ refreshToken }) {
  // Check blacklist
  const blacklisted = await redis.get(blacklistKey(refreshToken));
  if (blacklisted) throw createError('Refresh token invalid or expired', 401, 'INVALID_TOKEN');

  // Check it's a known token
  const storedUserId = await redis.get(refreshKey(refreshToken));
  if (!storedUserId) throw createError('Refresh token invalid or expired', 401, 'INVALID_TOKEN');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw createError('Refresh token invalid or expired', 401, 'INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || !user.isActive) throw createError('Refresh token invalid or expired', 401, 'INVALID_TOKEN');

  // Rotate: blacklist old, issue new
  await redis.del(refreshKey(refreshToken));
  await redis.set(blacklistKey(refreshToken), '1', 'EX', REFRESH_TOKEN_TTL);

  const payload = { id: user.id, email: user.email, role: user.role };
  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);
  await redis.set(refreshKey(newRefreshToken), user.id, 'EX', REFRESH_TOKEN_TTL);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

module.exports = { register, verifyEmail, login, logout, refreshAccessToken };
