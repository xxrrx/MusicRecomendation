import api from './api';

// ─── Playlists ────────────────────────────────────────────────────────────────

export async function getPlaylists() {
  const res = await api.get('/playlists');
  return res.data.data;
}

export async function getPlaylist(id) {
  const res = await api.get(`/playlists/${id}`);
  return res.data.data;
}

export async function createPlaylist(title, coverUrl = null) {
  const res = await api.post('/playlists', { title, coverUrl });
  return res.data.data;
}

export async function updatePlaylist(id, payload) {
  const res = await api.patch(`/playlists/${id}`, payload);
  return res.data.data;
}

export async function deletePlaylist(id) {
  await api.delete(`/playlists/${id}`);
}

export async function addSongToPlaylist(playlistId, songId) {
  await api.post(`/playlists/${playlistId}/songs`, { songId });
}

export async function removeSongFromPlaylist(playlistId, songId) {
  await api.delete(`/playlists/${playlistId}/songs/${songId}`);
}

// ─── Liked songs ──────────────────────────────────────────────────────────────

export async function getLikedSongs(page = 1, limit = 20) {
  const res = await api.get('/playlists/liked/songs', { params: { page, limit } });
  return { songs: res.data.data, pagination: res.data.pagination };
}

export async function checkLiked(songId) {
  const res = await api.get(`/playlists/liked/songs/${songId}`);
  return res.data.data.liked;
}

export async function likeSong(songId) {
  await api.post(`/playlists/liked/songs/${songId}`);
}

export async function unlikeSong(songId) {
  await api.delete(`/playlists/liked/songs/${songId}`);
}
