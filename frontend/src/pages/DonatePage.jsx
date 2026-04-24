import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { fetchArtist } from '../lib/musicApi';
import { initiateDonation, confirmStripeDonation } from '../lib/donationApi';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51TPTCvFCSCfDri6wAtNGQPgSUBwLbywLZOBeAyHOoncWSpQZ8TzehkAeAibSmiPM7qmJ9A9a7rVE4P83XQV90iG000V2kqyMoR';
const stripePromise = loadStripe(STRIPE_PK);

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ─── Stripe form ───────────────────────────────────────────────────────────────
function StripeForm({ artistId, amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { clientSecret } = await initiateDonation({ artistId, amount, method: 'stripe' });
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        onError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        await confirmStripeDonation(result.paymentIntent.id);
        onSuccess();
      }
    } catch (err) {
      onError(err.response?.data?.error?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 focus-within:border-violet-500 transition">
        <CardElement options={{ hidePostalCode: true, style: { base: { color: '#fff', fontSize: '15px', '::placeholder': { color: 'rgba(255,255,255,0.3)' } } } }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold rounded-xl transition text-sm"
      >
        {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
      </button>
    </form>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function DonatePage() {
  const { id: artistId } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState('stripe');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => fetchArtist(artistId),
  });

  const finalAmount = customAmount ? Number(customAmount) : amount;

  async function handleVNPay() {
    setLoading(true);
    setError('');
    try {
      const { paymentUrl } = await initiateDonation({ artistId, amount: finalAmount, method: 'vnpay' });
      window.location.href = paymentUrl;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Không thể tạo thanh toán');
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full text-white px-6 py-10 md:px-10">
      {/* ── Header nghệ sĩ ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        {artist?.avatarUrl && (
          <img
            src={artist.avatarUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-20 pointer-events-none"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none rounded-2xl" />
        <div className="relative z-10 flex items-center gap-6 p-6 md:p-8">
          {artist?.avatarUrl ? (
            <img
              src={artist.avatarUrl}
              alt={artist?.displayName}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-2xl ring-4 ring-white/10 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 flex items-center justify-center text-4xl shrink-0 ring-4 ring-white/10">
              🎤
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Ủng hộ nghệ sĩ</p>
            <h1 className="text-2xl md:text-3xl font-extrabold">{artist?.displayName}</h1>
            {artist?.genre && <p className="text-white/50 text-sm mt-1">{artist.genre}</p>}
          </div>
        </div>
      </div>

      {/* ── Nội dung chính ───────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">

        {/* Cột trái: Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">Thanh toán</h2>
            <p className="text-white/50 text-sm mt-1">Chọn số tiền và phương thức thanh toán</p>
          </div>

          {/* Chọn số tiền */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-white/40">Số tiền</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount(''); }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    finalAmount === a && !customAmount
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {formatVND(a)}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Nhập số tiền khác (VND)"
              min={1000}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 placeholder-white/30 transition"
            />
          </div>

          {/* Chọn phương thức */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-white/40">Phương thức</p>
            <div className="flex gap-2">
              {[{ value: 'stripe', label: '💳 Stripe' }, { value: 'vnpay', label: '🏦 VNPay' }].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    method === m.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form thanh toán */}
          <div className="space-y-3">
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}
            {method === 'stripe' ? (
              <Elements stripe={stripePromise}>
                <StripeForm
                  artistId={artistId}
                  amount={finalAmount}
                  onSuccess={() => navigate('/donation-result?status=success')}
                  onError={setError}
                />
              </Elements>
            ) : (
              <button
                onClick={handleVNPay}
                disabled={loading || finalAmount < 1000}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-sm"
              >
                {loading ? 'Đang chuyển hướng...' : 'Thanh toán qua VNPay'}
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition"
            >
              Hủy
            </button>
          </div>
        </div>

        {/* Cột phải: Tóm tắt */}
        <div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-white/40">Tóm tắt giao dịch</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Nghệ sĩ</span>
                <span className="font-semibold">{artist?.displayName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Số tiền</span>
                <span className="font-bold">{formatVND(finalAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Phương thức</span>
                <span className="font-semibold">{method === 'stripe' ? '💳 Stripe' : '🏦 VNPay'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Phí</span>
                <span className="text-emerald-400 font-semibold">Miễn phí</span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
              <span className="font-semibold">Tổng</span>
              <span className="text-violet-400 font-extrabold text-xl">{formatVND(finalAmount || 0)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
