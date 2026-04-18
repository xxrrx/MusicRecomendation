import api from './api';

/**
 * @param {string} q      — search query
 * @param {string} type   — 'all' | 'songs' | 'artists' | 'albums'
 * @param {number} limit  — results per category
 */
export async function searchAll({ q, type = 'all', limit = 10 } = {}) {
  const res = await api.get('/search', { params: { q, type, limit } });
  return res.data.data; // { songs, artists, albums }
}
