jest.mock('../../src/shared/config/database');
jest.mock('../../src/shared/config/redis');

const prisma = require('../../src/shared/config/database');
const redis = require('../../src/shared/config/redis');
const { getChart, computeAndCacheChart } = require('../../src/modules/charts/charts.service');

const mockSong = {
  id: 's1',
  title: 'Top Song',
  duration: 200,
  coverUrl: null,
  playCount: 500,
  artist: { id: 'a1', user: { displayName: 'Artist One', avatarUrl: null } },
  album: { id: 'al1', title: 'Album One' },
  genre: { id: 'g1', name: 'Pop' },
};

beforeEach(() => {
  jest.clearAllMocks();
  redis.get.mockResolvedValue(null);
  redis.set.mockResolvedValue('OK');
});

describe('getChart()', () => {
  test('throws 400 for invalid chart type', async () => {
    await expect(getChart('invalid')).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_CHART_TYPE',
    });
  });

  test('returns cached result without hitting DB', async () => {
    const cached = { type: 'daily', title: 'Daily Top 50', songs: [], computedAt: '' };
    redis.get.mockResolvedValue(JSON.stringify(cached));

    const result = await getChart('daily');
    expect(result).toEqual(cached);
    expect(prisma.playHistory.groupBy).not.toHaveBeenCalled();
  });

  test('computes daily chart from play_history', async () => {
    prisma.playHistory.groupBy.mockResolvedValue([{ songId: 's1', _count: { songId: 10 } }]);
    prisma.song.findMany.mockResolvedValue([mockSong]);
    prisma.playlist.findFirst.mockResolvedValue(null);
    prisma.playlist.create.mockResolvedValue({ id: 'pl1' });
    prisma.playlistSong.deleteMany.mockResolvedValue({});
    prisma.playlistSong.createMany.mockResolvedValue({});

    const result = await getChart('daily');

    expect(result.type).toBe('daily');
    expect(result.title).toBe('Daily Top 50');
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0].id).toBe('s1');
    expect(result.computedAt).toBeDefined();
  });

  test('falls back to overall playCount when < 10 plays in period', async () => {
    prisma.playHistory.groupBy.mockResolvedValue([]); // no recent plays
    prisma.song.findMany
      .mockResolvedValueOnce([{ id: 's1' }]) // fallback id query
      .mockResolvedValueOnce([mockSong]); // full song detail query
    prisma.playlist.findFirst.mockResolvedValue(null);
    prisma.playlist.create.mockResolvedValue({ id: 'pl1' });
    prisma.playlistSong.deleteMany.mockResolvedValue({});
    prisma.playlistSong.createMany.mockResolvedValue({});

    const result = await getChart('weekly');

    expect(result.songs).toHaveLength(1);
    // second findMany should be called with orderBy playCount
    const calls = prisma.song.findMany.mock.calls;
    expect(calls[0][0]).toMatchObject({ orderBy: { playCount: 'desc' } });
  });

  test('caches chart result for 1 hour', async () => {
    prisma.playHistory.groupBy.mockResolvedValue([{ songId: 's1', _count: { songId: 5 } }]);
    prisma.song.findMany.mockResolvedValue([mockSong]);
    prisma.playlist.findFirst.mockResolvedValue({ id: 'pl1' });
    prisma.playlistSong.deleteMany.mockResolvedValue({});
    prisma.playlistSong.createMany.mockResolvedValue({});

    await getChart('monthly');

    expect(redis.set).toHaveBeenCalledWith(
      'chart:monthly',
      expect.any(String),
      'EX',
      3600
    );
  });

  test('upserts existing system playlist', async () => {
    prisma.playHistory.groupBy.mockResolvedValue([{ songId: 's1', _count: { songId: 5 } }]);
    prisma.song.findMany.mockResolvedValue([mockSong]);
    prisma.playlist.findFirst.mockResolvedValue({ id: 'pl-existing' });
    prisma.playlistSong.deleteMany.mockResolvedValue({});
    prisma.playlistSong.createMany.mockResolvedValue({});

    await computeAndCacheChart('daily');

    expect(prisma.playlist.create).not.toHaveBeenCalled();
    expect(prisma.playlistSong.deleteMany).toHaveBeenCalledWith({
      where: { playlistId: 'pl-existing' },
    });
  });

  test('creates system playlist if none exists', async () => {
    prisma.playHistory.groupBy.mockResolvedValue([]);
    prisma.song.findMany.mockResolvedValue([mockSong]);
    prisma.playlist.findFirst.mockResolvedValue(null);
    prisma.playlist.create.mockResolvedValue({ id: 'pl-new' });
    prisma.playlistSong.deleteMany.mockResolvedValue({});
    prisma.playlistSong.createMany.mockResolvedValue({});

    await computeAndCacheChart('weekly');

    expect(prisma.playlist.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isSystem: true }) })
    );
  });
});
