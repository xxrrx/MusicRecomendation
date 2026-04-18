import api from './api';

export async function getPendingSongs(params = {}) {
  const res = await api.get('/admin/pending-songs', { params });
  return { songs: res.data.data, pagination: res.data.pagination };
}

export async function reviewSong(id, payload) {
  const res = await api.patch(`/admin/songs/${id}/review`, payload);
  return res.data.data;
}

export async function getUsers(params = {}) {
  const res = await api.get('/admin/users', { params });
  return { users: res.data.data, pagination: res.data.pagination };
}

export async function updateUserStatus(id, isActive) {
  const res = await api.patch(`/admin/users/${id}/status`, { isActive });
  return res.data.data;
}

export async function adminDeleteSong(id) {
  await api.delete(`/admin/songs/${id}`);
}

export async function getStats() {
  const res = await api.get('/admin/stats');
  return res.data.data;
}
