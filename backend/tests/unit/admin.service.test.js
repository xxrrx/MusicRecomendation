jest.mock('../../src/shared/config/database');
jest.mock('../../src/shared/utils/email.helper', () => ({
  sendSongReviewEmail: jest.fn().mockResolvedValue(undefined),
}));

const prisma = require('../../src/shared/config/database');
const adminService = require('../../src/modules/admin/admin.service');

const ADMIN_ID = 'admin-1';
const SONG_ID = 'song-1';
const USER_ID = 'user-1';

const mockPendingSong = {
  id: SONG_ID,
  title: 'Test Song',
  status: 'pending',
  artist: { user: { email: 'artist@test.com' } },
};

beforeEach(() => jest.clearAllMocks());

// ─── getPendingSongs ──────────────────────────────────────────────────────────

describe('getPendingSongs', () => {
  it('returns paginated pending songs', async () => {
    prisma.song.findMany.mockResolvedValue([{ id: SONG_ID, title: 'Test Song', status: 'pending' }]);
    prisma.song.count.mockResolvedValue(1);

    const result = await adminService.getPendingSongs();

    expect(result.songs).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});

// ─── reviewSong ───────────────────────────────────────────────────────────────

describe('reviewSong', () => {
  it('approves a pending song', async () => {
    prisma.song.findUnique.mockResolvedValue(mockPendingSong);
    prisma.$transaction.mockResolvedValue([
      { id: SONG_ID, title: 'Test Song', status: 'published', publishedAt: new Date(), rejectionReason: null },
    ]);

    const result = await adminService.reviewSong(ADMIN_ID, SONG_ID, { action: 'approved' });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.status).toBe('published');
  });

  it('rejects a pending song with reason', async () => {
    prisma.song.findUnique.mockResolvedValue(mockPendingSong);
    prisma.$transaction.mockResolvedValue([
      { id: SONG_ID, title: 'Test Song', status: 'rejected', publishedAt: null, rejectionReason: 'Low quality' },
    ]);

    const result = await adminService.reviewSong(ADMIN_ID, SONG_ID, { action: 'rejected', reason: 'Low quality' });

    expect(result.status).toBe('rejected');
  });

  it('throws 400 when rejecting without reason', async () => {
    prisma.song.findUnique.mockResolvedValue(mockPendingSong);

    await expect(adminService.reviewSong(ADMIN_ID, SONG_ID, { action: 'rejected' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 400 when song is not pending', async () => {
    prisma.song.findUnique.mockResolvedValue({ ...mockPendingSong, status: 'published' });

    await expect(adminService.reviewSong(ADMIN_ID, SONG_ID, { action: 'approved' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 404 when song not found', async () => {
    prisma.song.findUnique.mockResolvedValue(null);

    await expect(adminService.reviewSong(ADMIN_ID, SONG_ID, { action: 'approved' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 400 for invalid action', async () => {
    await expect(adminService.reviewSong(ADMIN_ID, SONG_ID, { action: 'maybe' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ─── updateUserStatus ─────────────────────────────────────────────────────────

describe('updateUserStatus', () => {
  it('bans a user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID, role: 'user' });
    prisma.user.update.mockResolvedValue({ id: USER_ID, isActive: false });

    const result = await adminService.updateUserStatus(USER_ID, { isActive: false });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
    expect(result.isActive).toBe(false);
  });

  it('unbans a user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID, role: 'user' });
    prisma.user.update.mockResolvedValue({ id: USER_ID, isActive: true });

    const result = await adminService.updateUserStatus(USER_ID, { isActive: true });
    expect(result.isActive).toBe(true);
  });

  it('throws 400 when trying to ban an admin', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: USER_ID, role: 'admin' });

    await expect(adminService.updateUserStatus(USER_ID, { isActive: false })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 404 when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(adminService.updateUserStatus(USER_ID, { isActive: false })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── deleteSong ───────────────────────────────────────────────────────────────

describe('deleteSong (admin)', () => {
  it('deletes song and approval logs', async () => {
    prisma.song.findUnique.mockResolvedValue({ id: SONG_ID });
    prisma.$transaction.mockResolvedValue([]);

    await adminService.deleteSong(SONG_ID);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('throws 404 when song not found', async () => {
    prisma.song.findUnique.mockResolvedValue(null);
    await expect(adminService.deleteSong(SONG_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getStats ─────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('returns platform statistics', async () => {
    prisma.user.count.mockResolvedValue(100);
    prisma.song.count
      .mockResolvedValueOnce(50)  // published
      .mockResolvedValueOnce(5);  // pending
    prisma.artist.count.mockResolvedValue(20);

    const result = await adminService.getStats();

    expect(result.userCount).toBe(100);
    expect(result.songCount).toBe(50);
    expect(result.pendingCount).toBe(5);
    expect(result.artistCount).toBe(20);
  });
});
