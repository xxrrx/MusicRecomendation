jest.mock('../../src/shared/config/database');
jest.mock('../../src/shared/config/redis');
jest.mock('../../src/shared/utils/s3.helper');
jest.mock('../../src/shared/utils/bull-queue');

const prisma = require('../../src/shared/config/database');
const { getPresignedUrl } = require('../../src/shared/utils/s3.helper');
const { playCountQueue } = require('../../src/shared/utils/bull-queue');
const playerService = require('../../src/modules/player/player.service');

const SONG_ID = 'song-uuid-1';
const USER_ID = 'user-uuid-1';

// ─── getStreamUrl ─────────────────────────────────────────────────────────────

describe('getStreamUrl', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns presigned URL for a published song', async () => {
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID, title: 'Test Song', fileUrl: 'audio/test.mp3' });
    getPresignedUrl.mockResolvedValue('https://s3.example.com/audio/test.mp3?X-Amz-Signature=abc');

    const result = await playerService.getStreamUrl(SONG_ID);

    expect(result.songId).toBe(SONG_ID);
    expect(result.url).toContain('s3.example.com');
    expect(getPresignedUrl).toHaveBeenCalledWith('audio/test.mp3');
  });

  it('throws 404 when song does not exist', async () => {
    prisma.song.findFirst.mockResolvedValue(null);

    await expect(playerService.getStreamUrl('nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws 404 when song has no audioUrl', async () => {
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID, title: 'No Audio', fileUrl: null });

    await expect(playerService.getStreamUrl(SONG_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'AUDIO_NOT_FOUND',
    });
  });
});

// ─── logPlay ──────────────────────────────────────────────────────────────────

describe('logPlay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates play_history record and enqueues play_count job', async () => {
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID });
    prisma.playHistory.create.mockResolvedValue({});

    await playerService.logPlay(USER_ID, { songId: SONG_ID, durationPlayed: 120, completionRate: 0.8 });

    expect(prisma.playHistory.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, songId: SONG_ID, durationPlayed: 120, completionRate: 0.8 },
    });
    expect(playCountQueue.add).toHaveBeenCalledWith({ songId: SONG_ID });
  });

  it('clamps completionRate to [0, 1]', async () => {
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID });
    prisma.playHistory.create.mockResolvedValue({});

    await playerService.logPlay(USER_ID, { songId: SONG_ID, durationPlayed: 200, completionRate: 1.5 });

    expect(prisma.playHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ completionRate: 1 }) })
    );
  });

  it('throws 404 for unknown song', async () => {
    prisma.song.findFirst.mockResolvedValue(null);

    await expect(
      playerService.logPlay(USER_ID, { songId: 'bad-id', durationPlayed: 10, completionRate: 0.1 })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── logBehavior ──────────────────────────────────────────────────────────────

describe('logBehavior', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['like', 'dislike', 'skip'])('saves "%s" behavior via upsert', async (action) => {
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID });
    prisma.userBehavior.upsert.mockResolvedValue({});

    await playerService.logBehavior(USER_ID, { songId: SONG_ID, action });

    expect(prisma.userBehavior.upsert).toHaveBeenCalledWith({
      where: { userId_songId: { userId: USER_ID, songId: SONG_ID } },
      update: { action },
      create: { userId: USER_ID, songId: SONG_ID, action },
    });
  });

  it('throws 422 for invalid action', async () => {
    await expect(
      playerService.logBehavior(USER_ID, { songId: SONG_ID, action: 'invalid' })
    ).rejects.toMatchObject({ statusCode: 422, code: 'VALIDATION_ERROR' });
  });

  it('throws 404 for unknown song', async () => {
    prisma.song.findFirst.mockResolvedValue(null);

    await expect(
      playerService.logBehavior(USER_ID, { songId: 'bad-id', action: 'like' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
