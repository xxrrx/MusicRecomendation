import api from './api';

export async function getStreamUrl(songId) {
  const res = await api.get(`/player/stream/${songId}`);
  return res.data.data; // { songId, title, url }
}

export async function logPlay(songId, durationPlayed, completionRate) {
  await api.post('/player/log', { songId, durationPlayed, completionRate });
}

export async function logBehavior(songId, action) {
  await api.post('/player/behavior', { songId, action });
}
