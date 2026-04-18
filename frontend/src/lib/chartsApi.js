import api from './api';

/**
 * @param {'daily'|'weekly'|'monthly'} type
 */
export async function fetchChart(type) {
  const res = await api.get(`/charts/${type}`);
  return res.data.data; // { type, title, songs, computedAt }
}
