import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDonationHistory } from '../lib/donationApi';

const PAGE_SIZE = 10;

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_CONFIG = {
  success: { label: 'Thành công', bg: 'rgba(29,185,84,0.12)', border: 'rgba(29,185,84,0.30)', color: '#1DB954' },
  pending: { label: 'Đang xử lý', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.30)', color: '#fbbf24' },
  failed:  { label: 'Thất bại',   bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)',  color: '#f87171' },
};

const METHOD_LABEL = { stripe: 'Stripe', vnpay: 'VNPay' };

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 animate-pulse">
      <div className="w-11 h-11 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-3 rounded w-1/4"   style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>
      <div className="w-24 h-4 rounded"   style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="w-16 h-6 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

export default function DonationHistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['donation-history', page],
    queryFn: () => getDonationHistory({ page, limit: PAGE_SIZE }),
    keepPreviousData: true,
  });

  const items      = data?.items      ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-full text-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-8 pt-12 pb-10"
        style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.30), rgba(7,7,15,0))' }}>
        <div className="flex items-end gap-6">
          <div className="w-44 h-44 rounded-2xl shrink-0 shadow-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#c084fc)' }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-20 h-20 opacity-90">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" />
            </svg>
          </div>
          <div className="pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Hồ sơ</p>
            <h1 className="text-5xl font-extrabold tracking-tight mb-3">Lịch sử donate</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{total} giao dịch</p>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-8 py-5">

        {isLoading && (
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center py-20 gap-3 text-center">
            <p className="text-white font-semibold">Không thể tải lịch sử donate</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Vui lòng thử lại sau.</p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[44px_1fr_130px_100px_140px_100px] gap-3 px-4 mb-2
                            text-xs font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span />
              <span>Nghệ sĩ</span>
              <span>Số tiền</span>
              <span>Phương thức</span>
              <span>Thời gian</span>
              <span>Trạng thái</span>
            </div>
            <div className="mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }} />

            <div className="space-y-0.5">
              {items.map((d) => {
                const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.pending;
                const artistName   = d.artist?.user?.displayName ?? d.artist?.displayName ?? 'Nghệ sĩ';
                const artistAvatar = d.artist?.user?.avatarUrl   ?? d.artist?.avatarUrl;

                return (
                  <div key={d.id}
                    className="grid grid-cols-[44px_1fr_130px_100px_140px_100px] gap-3 items-center
                               px-4 py-3 rounded-xl transition-all duration-150"
                    style={{ cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      {artistAvatar ? (
                        <img src={artistAvatar} alt={artistName} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5z" />
                            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291A6.751 6.751 0 0 1 6 12.75v-1.5A.75.75 0 0 1 6 10.5z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Artist + transaction id */}
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{artistName}</p>
                      <p className="text-xs truncate font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.transactionId}</p>
                    </div>

                    {/* Amount */}
                    <span className="text-white font-bold text-sm tabular-nums">{formatVND(d.amount)}</span>

                    {/* Method */}
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {METHOD_LABEL[d.paymentMethod] ?? d.paymentMethod}
                    </span>

                    {/* Time */}
                    <span className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {formatDate(d.completedAt ?? d.createdAt)}
                    </span>

                    {/* Status badge */}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.10)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                >
                  Trước
                </button>
                <span className="text-sm px-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.10)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg">Chưa có giao dịch nào</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Hãy ủng hộ nghệ sĩ yêu thích của bạn!</p>
            <Link to="/"
              className="mt-1 px-6 py-2.5 rounded-full text-black font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}>
              Khám phá nghệ sĩ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
