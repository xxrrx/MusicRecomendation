import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChart } from '../lib/chartsApi';
import SongCard from '../components/SongCard';

const CHART_TYPES = [
  {
    value: 'daily',
    label: 'Daily',
    sublabel: 'Top 50',
    gradient: 'from-orange-600 to-rose-600',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    sublabel: 'Top 50',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    sublabel: 'Top 50',
    gradient: 'from-blue-600 to-cyan-500',
  },
];

/* Gradient map used in the hero banner */
const BANNER_GRADIENT = {
  daily:   'from-[#c2410c] via-[#7c1d06] to-sp-dark',
  weekly:  'from-[#7e22ce] via-[#4a0f6b] to-sp-dark',
  monthly: 'from-[#1d4ed8] via-[#0f2e6e] to-sp-dark',
};

/* Podium icon for top-3 ranks */
function RankBadge({ rank }) {
  if (rank > 3) return null;
  const colors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
  return (
    <svg viewBox="0 0 24 24" fill="currentColor"
         className={`w-4 h-4 ${colors[rank - 1]} shrink-0`}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

/* Skeleton row */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 animate-pulse">
      <div className="w-5 h-5 rounded bg-sp-hover shrink-0" />
      <div className="w-10 h-10 rounded-lg bg-sp-hover shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-sp-hover rounded w-2/5" />
        <div className="h-3 bg-sp-hover rounded w-1/4" />
      </div>
    </div>
  );
}

export default function ChartsPage() {
  const [type, setType] = useState('daily');
  const active = CHART_TYPES.find((c) => c.value === type);

  const { data, isLoading, error } = useQuery({
    queryKey: ['chart', type],
    queryFn: () => fetchChart(type),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-full">
      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-b ${BANNER_GRADIENT[type]} px-8 pt-12 pb-8 transition-all duration-300`}>
        <div className="flex items-end gap-6">
          <div className={`w-44 h-44 rounded-card-lg shrink-0 shadow-modal
                           bg-gradient-to-br ${active.gradient}
                           flex items-center justify-center`}>
            <svg viewBox="0 0 24 24" fill="white" className="w-20 h-20 opacity-90">
              <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
            </svg>
          </div>

          <div className="pb-1">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Bảng xếp hạng</p>
            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">
              {active.label} {active.sublabel}
            </h1>
            {data?.computedAt && (
              <p className="text-white/50 text-sm">
                Cập nhật {new Date(data.computedAt).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-8 py-5">
        <div className="flex gap-2 mb-5">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setType(ct.value)}
              data-testid={`tab-${ct.value}`}
              className={`px-5 py-2 rounded-pill text-sm font-semibold transition-all duration-150
                          ${type === ct.value
                            ? 'bg-white text-black'
                            : 'bg-sp-hover text-sp-gray hover:bg-sp-border hover:text-white'
                          }`}
            >
              {ct.label}
            </button>
          ))}
        </div>

        {!isLoading && data?.songs?.length > 0 && (
          <div className="border-b border-sp-border mb-2" />
        )}

        {isLoading && (
          <div className="space-y-1 mt-2">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-center py-12">Không thể tải bảng xếp hạng.</p>
        )}

        {data?.songs?.length > 0 && (
          <div className="space-y-0.5" data-testid="chart-songs">
            {data.songs.map((song, idx) => (
              <div key={song.id} className="flex items-center">
                <div className="w-9 flex items-center justify-center shrink-0 mr-1">
                  {idx < 3 ? (
                    <RankBadge rank={idx + 1} />
                  ) : (
                    <span className="text-sm text-sp-gray-dark tabular-nums">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <SongCard song={song} queue={data.songs} queueIndex={idx} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && data?.songs?.length === 0 && (
          <p className="text-sp-gray text-center py-12">Chưa có dữ liệu cho bảng xếp hạng này.</p>
        )}
      </div>
    </div>
  );
}
