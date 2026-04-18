jest.mock('../../src/shared/config/database');

const prisma = require('../../src/shared/config/database');
const playlistService = require('../../src/modules/playlist/playlist.service');

const USER_ID = 'user-1';
const PLAYLIST_ID = 'playlist-1';
const SONG_ID = 'song-1';

const mockSong = {
  id: SONG_ID,
  title: 'Test Song',
  duration: 200,
  coverUrl: null,
  playCount: 10,
  artist: { id: 'artist-1', user: { displayName: 'Artist', avatarUrl: null } },
  album: null,
  genre: null,
};

const mockPlaylist = {
  id: PLAYLIST_ID,
  title: 'My Playlist',
  coverUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { songs: 0 },
};

beforeEach(() => jest.clearAllMocks());

// ─── getUserPlaylists ──────────────────────────────────────────────────────────

describe('getUserPlaylists', () => {
  it('returns formatted playlists', async () => {
    prisma.playlist.findMany.mockResolvedValue([mockPlaylist]);

    const result = await playlistService.getUserPlaylists(USER_ID);

    expect(prisma.playlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, isSystem: false } })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(PLAYLIST_ID);
    expect(result[0].songCount).toBe(0);
  });
});

// ─── getPlaylistById ──────────────────────────────────────────────────────────

describe('getPlaylistById', () => {
  it('returns playlist with songs', async () => {
    prisma.playlist.findFirst.mockResolvedValue({
      ...mockPlaylist,
      songs: [{ position: 1, addedAt: new Date(), song: mockSong }],
    });

    const result = await playlistService.getPlaylistById(USER_ID, PLAYLIST_ID);

    expect(result.songs).toHaveLength(1);
    expect(result.songs[0].title).toBe('Test Song');
  });

  it('throws 404 when playlist not found', async () => {
    prisma.playlist.findFirst.mockResolvedValue(null);

    await expect(playlistService.getPlaylistById(USER_ID, PLAYLIST_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── createPlaylist ───────────────────────────────────────────────────────────

describe('createPlaylist', () => {
  it('creates and returns playlist', async () => {
    prisma.playlist.create.mockResolvedValue({ ...mockPlaylist });

    const result = await playlistService.createPlaylist(USER_ID, { title: 'New Playlist' });

    expect(prisma.playlist.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'New Playlist', userId: USER_ID }) })
    );
    expect(result.songCount).toBe(0);
  });

  it('throws 422 when title is empty', async () => {
    await expect(playlistService.createPlaylist(USER_ID, { title: '' })).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});

// ─── updatePlaylist ───────────────────────────────────────────────────────────

describe('updatePlaylist', () => {
  it('updates title', async () => {
    prisma.playlist.findFirst.mockResolvedValue({ id: PLAYLIST_ID });
    prisma.playlist.update.mockResolvedValue({ ...mockPlaylist, title: 'Updated' });

    const result = await playlistService.updatePlaylist(USER_ID, PLAYLIST_ID, { title: 'Updated' });

    expect(prisma.playlist.update).toHaveBeenCalled();
    expect(result.title).toBe('Updated');
  });

  it('throws 404 when playlist not owned by user', async () => {
    prisma.playlist.findFirst.mockResolvedValue(null);

    await expect(playlistService.updatePlaylist(USER_ID, PLAYLIST_ID, { title: 'x' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── deletePlaylist ───────────────────────────────────────────────────────────

describe('deletePlaylist', () => {
  it('deletes playlist', async () => {
    prisma.playlist.findFirst.mockResolvedValue({ id: PLAYLIST_ID });
    prisma.playlist.delete.mockResolvedValue({});

    await playlistService.deletePlaylist(USER_ID, PLAYLIST_ID);

    expect(prisma.playlist.delete).toHaveBeenCalledWith({ where: { id: PLAYLIST_ID } });
  });

  it('throws 404 when not found', async () => {
    prisma.playlist.findFirst.mockResolvedValue(null);

    await expect(playlistService.deletePlaylist(USER_ID, PLAYLIST_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── addSongToPlaylist ────────────────────────────────────────────────────────

describe('addSongToPlaylist', () => {
  it('adds song to playlist', async () => {
    prisma.playlist.findFirst.mockResolvedValue({ id: PLAYLIST_ID });
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID });
    prisma.playlistSong.findUnique.mockResolvedValue(null);
    prisma.playlistSong.findFirst.mockResolvedValue(null);
    prisma.playlistSong.create.mockResolvedValue({});

    await playlistService.addSongToPlaylist(USER_ID, PLAYLIST_ID, SONG_ID);

    expect(prisma.playlistSong.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ playlistId: PLAYLIST_ID, songId: SONG_ID, position: 1 }) })
    );
  });

  it('throws 409 if song already in playlist', async () => {
    prisma.playlist.findFirst.mockResolvedValue({ id: PLAYLIST_ID });
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID });
    prisma.playlistSong.findUnique.mockResolvedValue({ playlistId: PLAYLIST_ID, songId: SONG_ID });

    await expect(playlistService.addSongToPlaylist(USER_ID, PLAYLIST_ID, SONG_ID)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});

// ─── removeSongFromPlaylist ───────────────────────────────────────────────────

describe('removeSongFromPlaylist', () => {
  it('removes song', async () => {
    prisma.playlist.findFirst.mockResolvedValue({ id: PLAYLIST_ID });
    prisma.playlistSong.findUnique.mockResolvedValue({ playlistId: PLAYLIST_ID, songId: SONG_ID });
    prisma.playlistSong.delete.mockResolvedValue({});

    await playlistService.removeSongFromPlaylist(USER_ID, PLAYLIST_ID, SONG_ID);

    expect(prisma.playlistSong.delete).toHaveBeenCalled();
  });

  it('throws 404 if song not in playlist', async () => {
    prisma.playlist.findFirst.mockResolvedValue({ id: PLAYLIST_ID });
    prisma.playlistSong.findUnique.mockResolvedValue(null);

    await expect(playlistService.removeSongFromPlaylist(USER_ID, PLAYLIST_ID, SONG_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── Liked songs ──────────────────────────────────────────────────────────────

describe('getLikedSongs', () => {
  it('returns paginated liked songs', async () => {
    prisma.likedSong.findMany.mockResolvedValue([{ createdAt: new Date(), song: mockSong }]);
    prisma.likedSong.count.mockResolvedValue(1);

    const result = await playlistService.getLikedSongs(USER_ID);

    expect(result.songs).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});

describe('likeSong', () => {
  it('likes a song', async () => {
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID });
    prisma.likedSong.findUnique.mockResolvedValue(null);
    prisma.likedSong.create.mockResolvedValue({});

    await playlistService.likeSong(USER_ID, SONG_ID);

    expect(prisma.likedSong.create).toHaveBeenCalledWith({ data: { userId: USER_ID, songId: SONG_ID } });
  });

  it('throws 409 if already liked', async () => {
    prisma.song.findFirst.mockResolvedValue({ id: SONG_ID });
    prisma.likedSong.findUnique.mockResolvedValue({ userId: USER_ID, songId: SONG_ID });

    await expect(playlistService.likeSong(USER_ID, SONG_ID)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('unlikeSong', () => {
  it('unlikes a song', async () => {
    prisma.likedSong.findUnique.mockResolvedValue({ userId: USER_ID, songId: SONG_ID });
    prisma.likedSong.delete.mockResolvedValue({});

    await playlistService.unlikeSong(USER_ID, SONG_ID);

    expect(prisma.likedSong.delete).toHaveBeenCalled();
  });

  it('throws 404 if not liked', async () => {
    prisma.likedSong.findUnique.mockResolvedValue(null);

    await expect(playlistService.unlikeSong(USER_ID, SONG_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('isSongLiked', () => {
  it('returns true when liked', async () => {
    prisma.likedSong.findUnique.mockResolvedValue({ userId: USER_ID });
    const result = await playlistService.isSongLiked(USER_ID, SONG_ID);
    expect(result.liked).toBe(true);
  });

  it('returns false when not liked', async () => {
    prisma.likedSong.findUnique.mockResolvedValue(null);
    const result = await playlistService.isSongLiked(USER_ID, SONG_ID);
    expect(result.liked).toBe(false);
  });
});
