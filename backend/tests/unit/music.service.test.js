jest.mock('../../src/shared/config/database');
jest.mock('../../src/shared/config/redis');

const prisma = require('../../src/shared/config/database');
const redis = require('../../src/shared/config/redis');
const musicService = require('../../src/modules/music/music.service');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockSong = {
  id: 'song-1',
  title: 'Test Song',
  duration: 240,
  bpm: 120,
  mood: 'happy',
  key: 'C major',
  year: 2024,
  coverUrl: 'https://s3.example.com/cover.jpg',
  playCount: 100,
  status: 'published',
  artist: { id: 'artist-1', user: { displayName: 'Artist One', avatarUrl: null } },
  album: { id: 'album-1', title: 'Album One', coverUrl: null },
  genre: { id: 'genre-1', name: 'V-Pop', slug: 'v-pop' },
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  redis.get.mockResolvedValue(null);
  redis.set.mockResolvedValue('OK');
});

// ─── getSongById ──────────────────────────────────────────────────────────────

describe('getSongById', () => {
  it('returns formatted song from DB and caches it', async () => {
    prisma.song.findFirst.mockResolvedValue(mockSong);

    const result = await musicService.getSongById('song-1');

    expect(result.id).toBe('song-1');
    expect(result.artist).toEqual({ id: 'artist-1', displayName: 'Artist One', avatarUrl: null });
    expect(redis.set).toHaveBeenCalledWith('song:song-1', expect.any(String), 'EX', 3600);
  });

  it('returns cached song without DB call', async () => {
    redis.get.mockResolvedValue(JSON.stringify({ id: 'song-1', title: 'Cached' }));

    const result = await musicService.getSongById('song-1');

    expect(result.title).toBe('Cached');
    expect(prisma.song.findFirst).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when song does not exist', async () => {
    prisma.song.findFirst.mockResolvedValue(null);

    await expect(musicService.getSongById('nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});

// ─── getSongs ─────────────────────────────────────────────────────────────────

describe('getSongs', () => {
  it('returns paginated songs with default params', async () => {
    prisma.song.findMany.mockResolvedValue([mockSong]);
    prisma.song.count.mockResolvedValue(1);

    const result = await musicService.getSongs();

    expect(result.songs).toHaveLength(1);
    expect(result.pagination).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('filters by genreId', async () => {
    prisma.song.findMany.mockResolvedValue([]);
    prisma.song.count.mockResolvedValue(0);

    await musicService.getSongs({ genreId: 'genre-1' });

    expect(prisma.song.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ genreId: 'genre-1' }) })
    );
  });

  it('caps limit at 50', async () => {
    prisma.song.findMany.mockResolvedValue([]);
    prisma.song.count.mockResolvedValue(0);

    await musicService.getSongs({ limit: 200 });

    expect(prisma.song.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });
});

// ─── getAlbumById ─────────────────────────────────────────────────────────────

describe('getAlbumById', () => {
  const mockAlbum = {
    id: 'album-1',
    title: 'Album One',
    coverUrl: null,
    year: 2024,
    artist: { id: 'artist-1', user: { displayName: 'Artist One', avatarUrl: null } },
    songs: [mockSong],
  };

  it('returns formatted album from DB', async () => {
    prisma.album.findUnique.mockResolvedValue(mockAlbum);

    const result = await musicService.getAlbumById('album-1');

    expect(result.id).toBe('album-1');
    expect(result.artist.displayName).toBe('Artist One');
    expect(result.songs).toHaveLength(1);
    expect(redis.set).toHaveBeenCalledWith('album:album-1', expect.any(String), 'EX', 3600);
  });

  it('throws NOT_FOUND for missing album', async () => {
    prisma.album.findUnique.mockResolvedValue(null);

    await expect(musicService.getAlbumById('nonexistent')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns cached album without DB call', async () => {
    redis.get.mockResolvedValue(JSON.stringify({ id: 'album-1' }));

    await musicService.getAlbumById('album-1');

    expect(prisma.album.findUnique).not.toHaveBeenCalled();
  });
});

// ─── getArtistById ────────────────────────────────────────────────────────────

describe('getArtistById', () => {
  const mockArtist = {
    id: 'artist-1',
    bio: 'A cool artist',
    user: { displayName: 'Artist One', avatarUrl: null },
    _count: { followers: 42 },
    songs: [{ ...mockSong, playCount: 500 }, { ...mockSong, id: 'song-2', playCount: 300 }],
    albums: [{ id: 'album-1', title: 'Album One', coverUrl: null, year: 2024 }],
  };

  it('returns artist with totalPlayCount from aggregate query', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.aggregate.mockResolvedValue({ _sum: { playCount: 1200 } });

    const result = await musicService.getArtistById('artist-1');

    expect(result.totalPlayCount).toBe(1200);
    expect(result.followerCount).toBe(42);
    expect(result.songs).toHaveLength(2);
    expect(prisma.song.aggregate).toHaveBeenCalledWith({
      where: { artistId: 'artist-1', status: 'published' },
      _sum: { playCount: true },
    });
    expect(redis.set).toHaveBeenCalledWith('artist:artist-1', expect.any(String), 'EX', 3600);
  });

  it('returns 0 totalPlayCount when aggregate is null', async () => {
    prisma.artist.findUnique.mockResolvedValue(mockArtist);
    prisma.song.aggregate.mockResolvedValue({ _sum: { playCount: null } });

    const result = await musicService.getArtistById('artist-1');

    expect(result.totalPlayCount).toBe(0);
  });

  it('throws NOT_FOUND for missing artist', async () => {
    prisma.artist.findUnique.mockResolvedValue(null);
    prisma.song.aggregate.mockResolvedValue({ _sum: { playCount: 0 } });

    await expect(musicService.getArtistById('nonexistent')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
