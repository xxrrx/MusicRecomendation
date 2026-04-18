jest.mock('../../src/shared/config/database');
jest.mock('../../src/shared/utils/s3.helper', () => ({
  uploadToS3: jest.fn().mockResolvedValue('audio/test.mp3'),
  deleteFromS3: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/shared/utils/email.helper', () => ({
  sendSongPendingEmail: jest.fn().mockResolvedValue(undefined),
}));

const prisma = require('../../src/shared/config/database');
const artistService = require('../../src/modules/artist/artist.service');

const USER_ID = 'user-1';
const ARTIST_ID = 'artist-1';
const SONG_ID = 'song-1';

const mockArtist = { id: ARTIST_ID };

beforeEach(() => jest.clearAllMocks());

// ─── getMyDashboard ───────────────────────────────────────────────────────────

describe('getMyDashboard', () => {
  it('returns dashboard stats for artist', async () => {
    prisma.artist.findUnique.mockResolvedValue({
      id: ARTIST_ID,
      bio: 'bio',
      totalEarnings: '500.00',
      user: { displayName: 'Test Artist', avatarUrl: null, email: 'a@test.com' },
      _count: { followers: 10, songs: 5 },
    });
    prisma.song.aggregate.mockResolvedValue({ _sum: { playCount: 1000 } });
    prisma.song.groupBy.mockResolvedValue([
      { status: 'published', _count: { id: 3 } },
      { status: 'pending', _count: { id: 2 } },
    ]);

    const result = await artistService.getMyDashboard(USER_ID);

    expect(result.id).toBe(ARTIST_ID);
    expect(result.totalPlayCount).toBe(1000);
    expect(result.followerCount).toBe(10);
    expect(result.songsByStatus.published).toBe(3);
    expect(result.songsByStatus.pending).toBe(2);
    expect(result.songsByStatus.rejected).toBe(0);
  });

  it('throws 404 when artist profile not found', async () => {
    prisma.artist.findUnique.mockResolvedValue(null);
    await expect(artistService.getMyDashboard(USER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getMySongs ───────────────────────────────────────────────────────────────

describe('getMySongs', () => {
  it('returns paginated songs for the artist', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.findMany.mockResolvedValue([{ id: SONG_ID, title: 'My Song', status: 'pending' }]);
    prisma.song.count.mockResolvedValue(1);

    const result = await artistService.getMySongs(USER_ID);

    expect(result.songs).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('throws 404 when artist not found', async () => {
    prisma.artist.findUnique.mockResolvedValue(null);
    await expect(artistService.getMySongs(USER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getMySongById ────────────────────────────────────────────────────────────

describe('getMySongById', () => {
  it('returns song when artist owns it', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.findUnique.mockResolvedValue({ id: SONG_ID, title: 'My Song', artistId: ARTIST_ID });

    const result = await artistService.getMySongById(USER_ID, SONG_ID);
    expect(result.id).toBe(SONG_ID);
  });

  it('throws 403 when song belongs to another artist', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.findUnique.mockResolvedValue({ id: SONG_ID, artistId: 'other-artist' });

    await expect(artistService.getMySongById(USER_ID, SONG_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 404 when song not found', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.findUnique.mockResolvedValue(null);

    await expect(artistService.getMySongById(USER_ID, SONG_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── createSong ───────────────────────────────────────────────────────────────

describe('createSong', () => {
  it('creates a song with pending status', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.create.mockResolvedValue({ id: SONG_ID, title: 'New Song', status: 'pending' });
    // Suppress admin notification queries
    prisma.user.findMany.mockResolvedValue([]);

    const files = { audio: { buffer: Buffer.from('audio'), mimetype: 'audio/mpeg', originalname: 'song.mp3' } };
    const result = await artistService.createSong(USER_ID, { title: 'New Song', duration: 180 }, files);

    expect(prisma.song.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'pending', artistId: ARTIST_ID }) })
    );
    expect(result.status).toBe('pending');
  });

  it('throws 400 when no audio file provided', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    await expect(artistService.createSong(USER_ID, { title: 'Song', duration: 180 }, {})).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ─── updateSong ───────────────────────────────────────────────────────────────

describe('updateSong', () => {
  it('updates allowed fields', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.findUnique.mockResolvedValue({ artistId: ARTIST_ID });
    prisma.song.update.mockResolvedValue({ id: SONG_ID, title: 'Updated' });

    await artistService.updateSong(USER_ID, SONG_ID, { title: 'Updated' });
    expect(prisma.song.update).toHaveBeenCalled();
  });

  it('throws 403 when artist does not own song', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.findUnique.mockResolvedValue({ artistId: 'other' });

    await expect(artistService.updateSong(USER_ID, SONG_ID, {})).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── deleteSong ───────────────────────────────────────────────────────────────

describe('deleteSong', () => {
  it('deletes a pending song', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.findUnique.mockResolvedValue({ artistId: ARTIST_ID, status: 'pending', fileUrl: 'audio/x.mp3', coverUrl: null });
    prisma.song.delete.mockResolvedValue({});

    await artistService.deleteSong(USER_ID, SONG_ID);
    expect(prisma.song.delete).toHaveBeenCalledWith({ where: { id: SONG_ID } });
  });

  it('throws 400 when trying to delete a published song', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.findUnique.mockResolvedValue({ artistId: ARTIST_ID, status: 'published', fileUrl: null, coverUrl: null });

    await expect(artistService.deleteSong(USER_ID, SONG_ID)).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── createAlbum ──────────────────────────────────────────────────────────────

describe('createAlbum', () => {
  it('creates album without cover', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.album.create.mockResolvedValue({ id: 'album-1', title: 'My Album', coverUrl: null, year: 2024 });

    const result = await artistService.createAlbum(USER_ID, { title: 'My Album', year: 2024 }, null);
    expect(prisma.album.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'My Album', artistId: ARTIST_ID }) })
    );
    expect(result.title).toBe('My Album');
  });
});
