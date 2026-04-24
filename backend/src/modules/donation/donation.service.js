const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { VNPay, VnpLocale, ignoreLogger, ProductCode, dateFormat } = require('vnpay');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Stripe ────────────────────────────────────────────────────────────────────

async function initiateStripe({ userId, artistId, amount }) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) throw Object.assign(new Error('Artist not found'), { status: 404 });

  const amountInCents = Math.round(Number(amount) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'vnd',
    metadata: { userId, artistId },
  });

  await prisma.donation.create({
    data: {
      userId,
      artistId,
      amount,
      currency: 'VND',
      paymentMethod: 'stripe',
      status: 'pending',
      transactionId: paymentIntent.id,
    },
  });

  return { clientSecret: paymentIntent.client_secret, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY };
}

async function confirmStripe({ userId, paymentIntentId }) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== 'succeeded') {
    throw Object.assign(new Error('Payment not succeeded'), { status: 400 });
  }

  const donation = await prisma.donation.findFirst({
    where: { transactionId: paymentIntentId },
  });

  if (!donation) throw Object.assign(new Error('Donation not found'), { status: 404 });
  if (donation.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (donation.status === 'success') return { message: 'Already confirmed' };

  await prisma.$transaction([
    prisma.donation.update({
      where: { id: donation.id },
      data: { status: 'success', completedAt: new Date() },
    }),
    prisma.artist.update({
      where: { id: donation.artistId },
      data: { totalEarnings: { increment: donation.amount } },
    }),
  ]);

  return { message: 'Donation confirmed' };
}

// ─── VNPay ─────────────────────────────────────────────────────────────────────

function createVNPayInstance() {
  return new VNPay({
    tmnCode: process.env.VNP_TMN_CODE,
    secureSecret: process.env.VNP_SECURE_SECRET,
    vnpayHost: process.env.VNP_HOST || 'https://sandbox.vnpayment.vn',
    testMode: process.env.NODE_ENV !== 'production',
    hashAlgorithm: 'SHA512',
    loggerFn: ignoreLogger,
  });
}

async function initiateVNPay({ userId, artistId, amount, ipAddr }) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) throw Object.assign(new Error('Artist not found'), { status: 404 });

  const orderId = `${Date.now()}_${userId.slice(0, 8)}`;
  const returnUrl = `${process.env.BACKEND_URL || 'http://localhost:8080/api'}/donations/vnpay-return`;

  const donation = await prisma.donation.create({
    data: {
      userId,
      artistId,
      amount,
      currency: 'VND',
      paymentMethod: 'vnpay',
      status: 'pending',
      transactionId: orderId,
    },
  });

  const vnpay = createVNPayInstance();
  const paymentUrl = await vnpay.buildPaymentUrl({
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Donate cho artist ${artistId}`,
    vnp_Amount: Number(amount),
    vnp_ReturnUrl: returnUrl,
    vnp_CreateDate: dateFormat(new Date(), 'yyyyMMddHHmmss'),
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_Locale: VnpLocale.VN,
    vnp_CurrCode: 'VND',
    vnp_ExpireDate: dateFormat(new Date(Date.now() + 15 * 60 * 1000), 'yyyyMMddHHmmss'),
    vnp_OrderType: ProductCode.Other,
  });

  return { paymentUrl, donationId: donation.id };
}

async function handleVNPayReturn(query) {
  const vnpay = createVNPayInstance();
  const verify = vnpay.verifyReturnUrl(query);

  if (!verify.isVerified) {
    return { success: false, message: 'Invalid signature' };
  }

  const orderId = query.vnp_TxnRef;
  const responseCode = query.vnp_ResponseCode;

  const donation = await prisma.donation.findFirst({ where: { transactionId: orderId } });
  if (!donation) return { success: false, message: 'Donation not found' };

  if (donation.status !== 'pending') {
    return { success: true, message: 'Already processed' };
  }

  if (responseCode === '00') {
    await prisma.$transaction([
      prisma.donation.update({
        where: { id: donation.id },
        data: { status: 'success', completedAt: new Date() },
      }),
      prisma.artist.update({
        where: { id: donation.artistId },
        data: { totalEarnings: { increment: donation.amount } },
      }),
    ]);
    return { success: true, donationId: donation.id };
  } else {
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: 'failed' },
    });
    return { success: false, message: 'Payment failed', code: responseCode };
  }
}

// ─── History ───────────────────────────────────────────────────────────────────

async function getDonationHistory({ userId, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: {
        artist: { include: { user: { select: { displayName: true, avatarUrl: true } } } },
      },
    }),
    prisma.donation.count({ where: { userId } }),
  ]);

  return { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
}

module.exports = { initiateStripe, confirmStripe, initiateVNPay, handleVNPayReturn, getDonationHistory };
