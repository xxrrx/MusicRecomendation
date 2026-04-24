import api from './api';

export async function fetchRecommendations() {
  const res = await api.get('/recommendations');
  return res.data.data.songs ?? [];
}

export async function fetchRadio(songId) {
  const res = await api.get(`/recommendations/radio/${songId}`);
  return res.data.data.songs ?? [];
}
