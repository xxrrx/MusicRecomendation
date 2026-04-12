import api from './api';

export async function fetchSongs(params = {}) {
  const res = await api.get('/music/songs', { params });
  return res.data; // { success, data, pagination }
}

export async function fetchSong(id) {
  const res = await api.get(`/music/songs/${id}`);
  return res.data.data;
}

export async function fetchAlbum(id) {
  const res = await api.get(`/music/albums/${id}`);
  return res.data.data;
}

export async function fetchArtist(id) {
  const res = await api.get(`/music/artists/${id}`);
  return res.data.data;
}
