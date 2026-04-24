import api from './api';

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats() {
  const res = await api.get('/admin/stats');
  return res.data.data;
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function getPendingSongs(params = {}) {
  const res = await api.get('/admin/pending-songs', { params });
  return { songs: res.data.data, pagination: res.data.pagination };
}

export async function reviewSong(id, payload) {
  const res = await api.patch(`/admin/songs/${id}/review`, payload);
  return res.data.data;
}

// ─── Song management ──────────────────────────────────────────────────────────

export async function getAllSongs(params = {}) {
  const res = await api.get('/admin/songs', { params });
  return { songs: res.data.data, pagination: res.data.pagination };
}

export async function getSongDetail(id) {
  const res = await api.get(`/admin/songs/${id}`);
  return res.data.data;
}

export async function updateSongMetadata(id, payload) {
  const res = await api.patch(`/admin/songs/${id}`, payload);
  return res.data.data;
}

export async function adminDeleteSong(id) {
  await api.delete(`/admin/songs/${id}`);
}

// ─── Artist management ────────────────────────────────────────────────────────

export async function getAdminArtists(params = {}) {
  const res = await api.get('/admin/artists', { params });
  return { artists: res.data.data, pagination: res.data.pagination };
}

export async function promoteUserToArtist(userId, payload = {}) {
  const res = await api.post(`/admin/users/${userId}/promote-artist`, payload);
  return res.data.data;
}

export async function updateArtistProfile(artistId, payload) {
  const res = await api.patch(`/admin/artists/${artistId}`, payload);
  return res.data.data;
}

// ─── Album management ─────────────────────────────────────────────────────────

export async function getAdminAlbums(params = {}) {
  const res = await api.get('/admin/albums', { params });
  return { albums: res.data.data, pagination: res.data.pagination };
}

export async function getAdminAlbumDetail(id) {
  const res = await api.get(`/admin/albums/${id}`);
  return res.data.data;
}

export async function createAdminAlbum(payload) {
  const res = await api.post('/admin/albums', payload);
  return res.data.data;
}

export async function updateAdminAlbum(id, payload) {
  const res = await api.patch(`/admin/albums/${id}`, payload);
  return res.data.data;
}

export async function deleteAdminAlbum(id) {
  await api.delete(`/admin/albums/${id}`);
}

export async function addSongToAlbum(albumId, songId) {
  const res = await api.post(`/admin/albums/${albumId}/songs`, { songId });
  return res.data.data;
}

export async function removeSongFromAlbum(albumId, songId) {
  await api.delete(`/admin/albums/${albumId}/songs/${songId}`);
}

// ─── Playlist management ──────────────────────────────────────────────────────

export async function getAdminPlaylists(params = {}) {
  const res = await api.get('/admin/playlists', { params });
  return { playlists: res.data.data, pagination: res.data.pagination };
}

export async function getAdminPlaylistDetail(id) {
  const res = await api.get(`/admin/playlists/${id}`);
  return res.data.data;
}

export async function createAdminPlaylist(payload) {
  const res = await api.post('/admin/playlists', payload);
  return res.data.data;
}

export async function updateAdminPlaylist(id, payload) {
  const res = await api.patch(`/admin/playlists/${id}`, payload);
  return res.data.data;
}

export async function deleteAdminPlaylist(id) {
  await api.delete(`/admin/playlists/${id}`);
}

export async function addSongToAdminPlaylist(playlistId, songId) {
  const res = await api.post(`/admin/playlists/${playlistId}/songs`, { songId });
  return res.data.data;
}

export async function removeSongFromAdminPlaylist(playlistId, songId) {
  await api.delete(`/admin/playlists/${playlistId}/songs/${songId}`);
}

// ─── User management ──────────────────────────────────────────────────────────

export async function getUsers(params = {}) {
  const res = await api.get('/admin/users', { params });
  return { users: res.data.data, pagination: res.data.pagination };
}

export async function getUserDetail(id) {
  const res = await api.get(`/admin/users/${id}`);
  return res.data.data;
}

export async function updateUserStatus(id, isActive) {
  const res = await api.patch(`/admin/users/${id}/status`, { isActive });
  return res.data.data;
}

export async function updateUserRole(id, role) {
  const res = await api.patch(`/admin/users/${id}/role`, { role });
  return res.data.data;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsOverview() {
  const res = await api.get('/admin/analytics/overview');
  return res.data.data;
}

export async function getTopSongs(params = {}) {
  const res = await api.get('/admin/analytics/top-songs', { params });
  return res.data.data;
}

export async function getTopArtists(params = {}) {
  const res = await api.get('/admin/analytics/top-artists', { params });
  return res.data.data;
}

export async function getPlaysOverTime(params = {}) {
  const res = await api.get('/admin/analytics/plays', { params });
  return res.data.data;
}

export async function getNewUsersOverTime(params = {}) {
  const res = await api.get('/admin/analytics/new-users', { params });
  return res.data.data;
}

// ─── Donations ────────────────────────────────────────────────────────────────

export async function getDonations(params = {}) {
  const res = await api.get('/admin/donations', { params });
  return { donations: res.data.data, pagination: res.data.pagination };
}

export async function getDonationStats() {
  const res = await api.get('/admin/donations/stats');
  return res.data.data;
}
