import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDonations, getDonationStats } from '../../lib/adminApi';

const STATUS_FILTERS = ['', 'pending', 'success', 'failed'];
const STATUS_LABEL   = { '': 'Tất cả', pending: 'Đang xử lý', success: 'Thành công', failed: 'Thất bại' };

const STATUS_BADGE = {
  success: 'bg-green-500/15 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  failed:  'bg-red-500/15 text-red-400 border-red-500/30',
};

function fmtAmount(amount, currency) {
  if (currency === 'VND') return `${Number(amount).toLocaleString('vi-VN')} ₫`;
  return `$${Number(amount).toFixed(2)}`;
}

function StatCard({ label, value, highlight, Icon }) {
  return (
    <div className="bg-sp-card rounded-card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        highlight ? 'bg-sp-green/20 text-sp-green' : 'bg-sp-hover text-sp-gray'
      }`}>
        <Icon />
      </div>
      <div>
        <p className={`text-2xl font-bold ${highlight ? 'text-sp-green' : 'text-white'}`}>{value}</p>
        <p className="text-sp-gray text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-sp-border">
      {[1,2,3,4,5,6].map((i) => (
        <td key={i} className="px-4 py-3.5"><div className="h-3 bg-sp-hover rounded w-3/4" /></td>
      ))}
    </tr>
  );
}

export default function DonationsPage() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-donations', status],
    queryFn: () => getDonations({ status: status || undefined }),
  });
  const { data: stats } = useQuery({
    queryKey: ['admin-donation-stats'],
    queryFn: getDonationStats,
  });

  const donations = data?.donations || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Donations & Doanh thu</h1>
        <p className="text-sp-gray text-sm mt-1">Quản lý tất cả giao dịch</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Tổng doanh thu" value={`${stats.totalRevenue.toLocaleString()} ₫`} highlight
            Icon={() => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5z" /><path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0z" clipRule="evenodd" /></svg>}
          />
          <StatCard label="Thành công" value={stats.byStatus?.success?.count ?? 0}
            Icon={() => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>}
          />
          <StatCard label="Đang xử lý" value={stats.byStatus?.pending?.count ?? 0}
            Icon={() => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6z" clipRule="evenodd" /></svg>}
          />
          <StatCard label="Thất bại" value={stats.byStatus?.failed?.count ?? 0}
            Icon={() => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" /></svg>}
          />
        </div>
      )}

      {/* Top artists */}
      {stats?.topArtists?.length > 0 && (
        <div className="bg-sp-card rounded-card p-5">
          <h3 className="text-white font-bold text-sm mb-4">Top nghệ sĩ nhận donation</h3>
          <div className="space-y-2.5">
            {stats.topArtists.map((a, i) => {
              const maxRevenue = stats.topArtists[0]?.revenue || 1;
              return (
                <div key={a.artistId} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-5 text-right shrink-0 ${i < 3 ? 'text-yellow-400' : 'text-sp-gray-dark'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-medium truncate">{a.name}</p>
                      <p className="text-sp-green text-sm font-semibold ml-3 shrink-0">{a.revenue.toLocaleString()} ₫</p>
                    </div>
                    <div className="h-1 bg-sp-hover rounded-full overflow-hidden">
                      <div className="h-full bg-sp-green rounded-full" style={{ width: `${(a.revenue / maxRevenue) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-pill text-sm font-semibold transition-all duration-150 ${
              status === s ? 'bg-white text-black' : 'bg-sp-hover text-sp-gray hover:text-white'
            }`}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-sp-card rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-sp-border">
            <tr className="text-sp-gray text-xs uppercase tracking-wider text-left">
              <th className="px-4 py-3.5">Người donate</th>
              <th className="px-4 py-3.5">Nghệ sĩ</th>
              <th className="px-4 py-3.5">Số tiền</th>
              <th className="px-4 py-3.5">Phương thức</th>
              <th className="px-4 py-3.5">Trạng thái</th>
              <th className="px-4 py-3.5">Ngày</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sp-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : donations.length === 0
                ? <tr><td colSpan={6} className="text-center text-sp-gray py-12 text-sm">Không có giao dịch nào.</td></tr>
                : donations.map((d) => (
                    <tr key={d.id} className="hover:bg-sp-hover/40 transition-colors duration-150">
                      <td className="px-4 py-3.5">
                        <p className="text-white font-medium">{d.user?.displayName}</p>
                        <p className="text-sp-gray-dark text-xs">{d.user?.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sp-gray">{d.artist?.user?.displayName}</td>
                      <td className="px-4 py-3.5 text-white font-semibold">{fmtAmount(d.amount, d.currency)}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs bg-sp-hover text-sp-gray px-2 py-0.5 rounded uppercase font-medium">
                          {d.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill border ${STATUS_BADGE[d.status] ?? 'bg-sp-hover text-sp-gray border-sp-border'}`}>
                          {STATUS_LABEL[d.status] ?? d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sp-gray-dark text-xs">
                        {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
