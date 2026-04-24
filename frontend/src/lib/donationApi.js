import api from './api';

export async function initiateDonation({ artistId, amount, method }) {
  const res = await api.post('/donations/initiate', { artistId, amount, method });
  return res.data.data;
}

export async function confirmStripeDonation(paymentIntentId) {
  const res = await api.post('/donations/confirm', { paymentIntentId });
  return res.data.data;
}

export async function getDonationHistory({ page = 1, limit = 20 } = {}) {
  const res = await api.get('/donations/history', { params: { page, limit } });
  return res.data.data;
}
