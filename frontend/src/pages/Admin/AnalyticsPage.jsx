import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsOverview, getTopSongs, getTopArtists,
  getPlaysOverTime, getNewUsersOverTime,
} from '../../lib/adminApi';

const PERIODS = [
  { label: '7 ngày',  days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
];

/* ── Shared sub-components ───────────────────────────────────────────────── */

function OverviewCard({ label, value, Icon, accent, iconColor }) {
  return (
    <div className={`rounded-card p-5 border flex flex-col gap-3 ${accent}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
        <Icon />
      </div>
      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-sp-gray text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-sp-card rounded-card p-5">
      <h3 className="text-white font-bold text-sm mb-4">{title}</h3>
      {children}
    </div>
  );
}

function BarChart({ data, color = 'blue' }) {
  const colorMap = { blue: 'bg-blue-500', green: 'bg-sp-green' };
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const lastN  = data.slice(-20);
  return (
    <div className="flex items-end gap-[3px] h-28">
      {lastN.map((d) => (
        <div key={d.date} title={`${d.date}: ${d.count}`}
             className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-sm ${colorMap[color]} opacity-80 hover:opacity-100 transition-opacity`}
            style={{ height: `${Math.max(3, (d.count / maxVal) * 96)}px` }}
          />
          <span className="text-sp-gray-dark hidden sm:block" style={{ fontSize: 8 }}>{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-28 flex items-center justify-center text-sp-gray-dark text-sm">Chưa có dữ liệu</div>;
}

function SkeletonCard() {
  return <div className="rounded-card bg-sp-card animate-pulse h-28" />;
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);

  const { data: overview }     = useQuery({ queryKey: ['analytics-overview'], queryFn: getAnalyticsOverview });
  const { data: topSongs }     = useQuery({ queryKey: ['analytics-top-songs', period],    queryFn: () => getTopSongs({ period, limit: 10 }) });
  const { data: topArtists }   = useQuery({ queryKey: ['analytics-top-artists', period],  queryFn: () => getTopArtists({ period, limit: 10 }) });
  const { data: playsData }    = useQuery({ queryKey: ['analytics-plays', period],        queryFn: () => getPlaysOverTime({ days: period }) });
  const { data: newUsersData } = useQuery({ queryKey: ['analytics-new-users', period],    queryFn: () => getNewUsersOverTime({ days: period }) });

  const overviewCards = [
    {
      label: `Lượt nghe (30 ngày)`,
      value: overview?.playsThisMonth?.toLocaleString() ?? '—',
      accent: 'bg-blue-500/10 border-blue-500/20',
      iconColor: 'bg-blue-500/20 text-blue-400',
      Icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'Lượt nghe (7 ngày)',
      value: overview?.playsThisWeek?.toLocaleString() ?? '—',
      accent: 'bg-purple-500/10 border-purple-500/20',
      iconColor: 'bg-purple-500/20 text-purple-400',
      Icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
        </svg>
      ),
    },
    {
      label: 'User mới (30 ngày)',
      value: overview?.newUsersThisMonth?.toLocaleString() ?? '—',
      accent: 'bg-sp-green/10 border-sp-green/20',
      iconColor: 'bg-sp-green/20 text-sp-green',
      Icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122z" />
        </svg>
      ),
    },
    {
      label: 'Tổng doanh thu',
      value: `${(overview?.totalRevenue ?? 0).toLocaleString()} ₫`,
      accent: 'bg-yellow-500/10 border-yellow-500/20',
      iconColor: 'bg-yellow-500/20 text-yellow-400',
      Icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5z" />
          <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header + period tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-sp-gray text-sm mt-1">Thống kê chi tiết nền tảng</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(({ label, days }) => (
            <button key={days} onClick={() => setPeriod(days)}
              className={`px-4 py-2 rounded-pill text-sm font-semibold transition-all duration-150 ${
                period === days ? 'bg-white text-black' : 'bg-sp-hover text-sp-gray hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {!overview
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : overviewCards.map(({ label, value, Icon, accent, iconColor }) => (
              <OverviewCard key={label} label={label} value={value}
                Icon={Icon} accent={accent} iconColor={iconColor} />
            ))
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title={`Lượt nghe (${period} ngày qua)`}>
          {playsData?.length ? <BarChart data={playsData} color="blue" /> : <EmptyChart />}
        </ChartCard>
        <ChartCard title={`User mới (${period} ngày qua)`}>
          {newUsersData?.length ? <BarChart data={newUsersData} color="green" /> : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top songs */}
        <div className="bg-sp-card rounded-card p-5">
          <h3 className="text-white font-bold text-sm mb-4">Top bài hát ({period} ngày)</h3>
          {!topSongs?.length ? <p className="text-sp-gray text-sm">Chưa có dữ liệu.</p> : (
            <ol className="space-y-2.5">
              {topSongs.map(({ rank, song, playCount }) => (
                <li key={song.id} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-5 text-right shrink-0 ${rank <= 3 ? 'text-yellow-400' : 'text-sp-gray-dark'}`}>{rank}</span>
                  <div className="w-9 h-9 rounded-lg bg-sp-hover overflow-hidden shrink-0 flex items-center justify-center">
                    {song.coverUrl
                      ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sp-gray text-xs">♪</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{song.title}</p>
                    <p className="text-sp-gray-dark text-xs truncate">{song.artist?.user?.displayName}</p>
                  </div>
                  <span className="text-sp-gray text-sm tabular-nums shrink-0">{playCount.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Top artists */}
        <div className="bg-sp-card rounded-card p-5">
          <h3 className="text-white font-bold text-sm mb-4">Top nghệ sĩ ({period} ngày)</h3>
          {!topArtists?.length ? <p className="text-sp-gray text-sm">Chưa có dữ liệu.</p> : (
            <ol className="space-y-2.5">
              {topArtists.map(({ rank, artist, playCount }) => (
                <li key={artist.id} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-5 text-right shrink-0 ${rank <= 3 ? 'text-yellow-400' : 'text-sp-gray-dark'}`}>{rank}</span>
                  <div className="w-9 h-9 rounded-full bg-sp-hover overflow-hidden shrink-0 flex items-center justify-center">
                    {artist.avatarUrl
                      ? <img src={artist.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sp-gray text-xs">♪</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{artist.displayName}</p>
                    <p className="text-sp-gray-dark text-xs">{artist.followerCount?.toLocaleString()} followers</p>
                  </div>
                  <span className="text-sp-gray text-sm tabular-nums shrink-0">{playCount.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
