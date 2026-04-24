import api from './api';

export async function getDashboard() {
  const res = await api.get('/artist/dashboard');
  return res.data.data;
}

export async function getMySongs(params = {}) {
  const res = await api.get('/artist/songs', { params });
  return { songs: res.data.data, pagination: res.data.pagination };
}

export async function getMySong(id) {
  const res = await api.get(`/artist/songs/${id}`);
  return res.data.data;
}

export async function uploadSong(formData) {
  const res = await api.post('/artist/songs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function updateSong(id, payload) {
  const res = await api.patch(`/artist/songs/${id}`, payload);
  return res.data.data;
}

export async function deleteSong(id) {
  await api.delete(`/artist/songs/${id}`);
}

// Albums
export async function getMyAlbums() {
  const res = await api.get('/artist/albums');
  return res.data.data;
}

export async function createAlbum(formData) {
  const res = await api.post('/artist/albums', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function getMyAlbum(id) {
  const res = await api.get(`/artist/albums/${id}`);
  return res.data.data;
}

export async function updateAlbum(id, formData) {
  const res = await api.patch(`/artist/albums/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function deleteAlbum(id) {
  await api.delete(`/artist/albums/${id}`);
}

export async function addSongToAlbum(albumId, songId) {
  const res = await api.post(`/artist/albums/${albumId}/songs`, { songId });
  return res.data.data;
}

export async function removeSongFromAlbum(albumId, songId) {
  await api.delete(`/artist/albums/${albumId}/songs/${songId}`);
}

// Analytics
export async function getMyPlaysOverTime(params = {}) {
  const res = await api.get('/artist/analytics/plays', { params });
  return res.data.data;
}

export async function getMyTopSongs(params = {}) {
  const res = await api.get('/artist/analytics/top-songs', { params });
  return res.data.data;
}

export async function getMyRevenue() {
  const res = await api.get('/artist/analytics/revenue');
  return res.data.data;
}

// Profile
export async function updateMyProfile(formData) {
  const res = await api.patch('/artist/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
