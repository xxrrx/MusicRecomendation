import api from './api';

export async function getFollowing(page = 1, limit = 20) {
  const res = await api.get('/social/following', { params: { page, limit } });
  return { artists: res.data.data, pagination: res.data.pagination };
}

export async function checkFollowing(artistId) {
  const res = await api.get(`/social/follow/${artistId}`);
  return res.data.data.following;
}

export async function followArtist(artistId) {
  await api.post(`/social/follow/${artistId}`);
}

export async function unfollowArtist(artistId) {
  await api.delete(`/social/follow/${artistId}`);
}
