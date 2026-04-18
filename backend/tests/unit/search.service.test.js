jest.mock('../../src/shared/config/database');
jest.mock('../../src/shared/config/redis');

const prisma = require('../../src/shared/config/database');
const redis = require('../../src/shared/config/redis');
const { search } = require('../../src/modules/search/search.service');

const mockSong = {
  id: 's1',
  title: 'Test Song',
  duration: 200,
  coverUrl: null,
  playCount: 100,
  status: 'published',
  artist: { id: 'a1', user: { displayName: 'Artist One', avatarUrl: null } },
  album: { id: 'al1', title: 'Album One' },
  genre: { id: 'g1', name: 'Pop' },
};

const mockArtist = {
  id: 'a1',
  bio: 'Great artist',
  user: { displayName: 'Artist One', avatarUrl: null },
  _count: { followers: 500 },
};

const mockAlbum = {
  id: 'al1',
  title: 'Album One',
  coverUrl: null,
  year: 2024,
  artist: { id: 'a1', user: { displayName: 'Artist One' } },
};

beforeEach(() => {
  jest.clearAllMocks();
  redis.get.mockResolvedValue(null);
  redis.set.mockResolvedValue('OK');
});

describe('search()', () => {
  test('returns empty results for blank query', async () => {
    const result = await search({ q: '' });
    expect(result).toEqual({ songs: [], artists: [], albums: [] });
    expect(prisma.song.findMany).not.toHaveBeenCalled();
  });

  test('returns empty results for whitespace-only query', async () => {
    const result = await search({ q: '   ' });
    expect(result).toEqual({ songs: [], artists: [], albums: [] });
  });

  test('searches all categories by default (type=all)', async () => {
    prisma.song.findMany.mockResolvedValue([mockSong]);
    prisma.artist.findMany.mockResolvedValue([mockArtist]);
    prisma.album.findMany.mockResolvedValue([mockAlbum]);

    const result = await search({ q: 'test' });

    expect(prisma.song.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'published' }) })
    );
    expect(prisma.artist.findMany).toHaveBeenCalled();
    expect(prisma.album.findMany).toHaveBeenCalled();

    expect(result.songs).toHaveLength(1);
    expect(result.songs[0].id).toBe('s1');
    expect(result.artists).toHaveLength(1);
    expect(result.artists[0].followerCount).toBe(500);
    expect(result.albums).toHaveLength(1);
    expect(result.albums[0].title).toBe('Album One');
  });

  test('only searches songs when type=songs', async () => {
    prisma.song.findMany.mockResolvedValue([mockSong]);

    const result = await search({ q: 'test', type: 'songs' });

    expect(prisma.song.findMany).toHaveBeenCalled();
    expect(prisma.artist.findMany).not.toHaveBeenCalled();
    expect(prisma.album.findMany).not.toHaveBeenCalled();
    expect(result.songs).toHaveLength(1);
    expect(result.artists).toHaveLength(0);
  });

  test('only searches artists when type=artists', async () => {
    prisma.artist.findMany.mockResolvedValue([mockArtist]);

    const result = await search({ q: 'artist', type: 'artists' });

    expect(prisma.song.findMany).not.toHaveBeenCalled();
    expect(prisma.artist.findMany).toHaveBeenCalled();
    expect(result.artists[0].displayName).toBe('Artist One');
  });

  test('only searches albums when type=albums', async () => {
    prisma.album.findMany.mockResolvedValue([mockAlbum]);

    const result = await search({ q: 'album', type: 'albums' });

    expect(prisma.song.findMany).not.toHaveBeenCalled();
    expect(prisma.album.findMany).toHaveBeenCalled();
    expect(result.albums[0].id).toBe('al1');
  });

  test('returns cached result without hitting DB', async () => {
    const cached = { songs: [], artists: [], albums: [] };
    redis.get.mockResolvedValue(JSON.stringify(cached));

    const result = await search({ q: 'cached' });

    expect(result).toEqual(cached);
    expect(prisma.song.findMany).not.toHaveBeenCalled();
  });

  test('caches results after DB query', async () => {
    prisma.song.findMany.mockResolvedValue([]);
    prisma.artist.findMany.mockResolvedValue([]);
    prisma.album.findMany.mockResolvedValue([]);

    await search({ q: 'nocache' });

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('search:'),
      expect.any(String),
      'EX',
      1800
    );
  });

  test('cap limit at 50', async () => {
    prisma.song.findMany.mockResolvedValue([]);
    prisma.artist.findMany.mockResolvedValue([]);
    prisma.album.findMany.mockResolvedValue([]);

    await search({ q: 'limit', limit: 999 });

    expect(prisma.song.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });
});
