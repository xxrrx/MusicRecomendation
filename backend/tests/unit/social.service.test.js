jest.mock('../../src/shared/config/database');

const prisma = require('../../src/shared/config/database');
const socialService = require('../../src/modules/social/social.service');

const USER_ID = 'user-1';
const ARTIST_ID = 'artist-1';

const mockArtist = {
  id: ARTIST_ID,
  bio: 'Test bio',
  user: { displayName: 'Test Artist', avatarUrl: null },
  _count: { followers: 5 },
};

beforeEach(() => jest.clearAllMocks());

// ─── followArtist ─────────────────────────────────────────────────────────────

describe('followArtist', () => {
  it('follows an artist', async () => {
    prisma.artist.findUnique.mockResolvedValue({ id: ARTIST_ID });
    prisma.followArtist.findUnique.mockResolvedValue(null);
    prisma.followArtist.create.mockResolvedValue({});

    await socialService.followArtist(USER_ID, ARTIST_ID);

    expect(prisma.followArtist.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, artistId: ARTIST_ID },
    });
  });

  it('throws 404 when artist not found', async () => {
    prisma.artist.findUnique.mockResolvedValue(null);

    await expect(socialService.followArtist(USER_ID, ARTIST_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 409 when already following', async () => {
    prisma.artist.findUnique.mockResolvedValue({ id: ARTIST_ID });
    prisma.followArtist.findUnique.mockResolvedValue({ userId: USER_ID, artistId: ARTIST_ID });

    await expect(socialService.followArtist(USER_ID, ARTIST_ID)).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ─── unfollowArtist ───────────────────────────────────────────────────────────

describe('unfollowArtist', () => {
  it('unfollows an artist', async () => {
    prisma.followArtist.findUnique.mockResolvedValue({ userId: USER_ID, artistId: ARTIST_ID });
    prisma.followArtist.delete.mockResolvedValue({});

    await socialService.unfollowArtist(USER_ID, ARTIST_ID);

    expect(prisma.followArtist.delete).toHaveBeenCalledWith({
      where: { userId_artistId: { userId: USER_ID, artistId: ARTIST_ID } },
    });
  });

  it('throws 404 when not following', async () => {
    prisma.followArtist.findUnique.mockResolvedValue(null);

    await expect(socialService.unfollowArtist(USER_ID, ARTIST_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── isFollowing ──────────────────────────────────────────────────────────────

describe('isFollowing', () => {
  it('returns true when following', async () => {
    prisma.followArtist.findUnique.mockResolvedValue({ userId: USER_ID });
    const result = await socialService.isFollowing(USER_ID, ARTIST_ID);
    expect(result.following).toBe(true);
  });

  it('returns false when not following', async () => {
    prisma.followArtist.findUnique.mockResolvedValue(null);
    const result = await socialService.isFollowing(USER_ID, ARTIST_ID);
    expect(result.following).toBe(false);
  });
});

// ─── getFollowing ─────────────────────────────────────────────────────────────

describe('getFollowing', () => {
  it('returns paginated following list', async () => {
    prisma.followArtist.findMany.mockResolvedValue([
      { createdAt: new Date(), artist: mockArtist },
    ]);
    prisma.followArtist.count.mockResolvedValue(1);

    const result = await socialService.getFollowing(USER_ID);

    expect(result.artists).toHaveLength(1);
    expect(result.artists[0].id).toBe(ARTIST_ID);
    expect(result.artists[0].followerCount).toBe(5);
    expect(result.pagination.total).toBe(1);
  });

  it('returns empty list when not following anyone', async () => {
    prisma.followArtist.findMany.mockResolvedValue([]);
    prisma.followArtist.count.mockResolvedValue(0);

    const result = await socialService.getFollowing(USER_ID);

    expect(result.artists).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });
});
