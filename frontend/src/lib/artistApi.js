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
