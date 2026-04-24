const svc = require('./donation.service');

async function initiate(req, res, next) {
  try {
    const { artistId, amount, method } = req.body;
    const userId = req.user.id;
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    let data;
    if (method === 'stripe') {
      data = await svc.initiateStripe({ userId, artistId, amount });
    } else if (method === 'vnpay') {
      data = await svc.initiateVNPay({ userId, artistId, amount, ipAddr });
    } else {
      return res.status(400).json({ success: false, error: { message: 'Invalid payment method' } });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function confirmStripe(req, res, next) {
  try {
    const { paymentIntentId } = req.body;
    const data = await svc.confirmStripe({ userId: req.user.id, paymentIntentId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function vnpayReturn(req, res, next) {
  try {
    const result = await svc.handleVNPayReturn(req.query);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (result.success) {
      return res.redirect(`${frontendUrl}/donation-result?status=success&donationId=${result.donationId || ''}`);
    } else {
      return res.redirect(`${frontendUrl}/donation-result?status=failed&message=${encodeURIComponent(result.message || '')}`);
    }
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const { page, limit } = req.query;
    const data = await svc.getDonationHistory({ userId: req.user.id, page, limit });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { initiate, confirmStripe, vnpayReturn, getHistory };
