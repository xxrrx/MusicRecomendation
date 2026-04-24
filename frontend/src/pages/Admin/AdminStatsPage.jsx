import { useQuery } from '@tanstack/react-query';
import { getStats } from '../../lib/adminApi';

const STAT_CONFIG = [
  {
    key: 'userCount',
    label: 'Tổng người dùng',
    accent: 'bg-blue-500/15 border-blue-500/20',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003z" />
      </svg>
    ),
  },
  {
    key: 'songCount',
    label: 'Bài hát đã duyệt',
    accent: 'bg-sp-green/15 border-sp-green/20',
    iconBg: 'bg-sp-green/20',
    iconColor: 'text-sp-green',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
      </svg>
    ),
  },
  {
    key: 'pendingCount',
    label: 'Chờ duyệt',
    accent: 'bg-yellow-500/15 border-yellow-500/20',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    key: 'artistCount',
    label: 'Nghệ sĩ',
    accent: 'bg-purple-500/15 border-purple-500/20',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5z" />
      </svg>
    ),
  },
];

function StatCard({ value, label, Icon, accent, iconBg, iconColor }) {
  return (
    <div className={`rounded-card p-5 border flex flex-col gap-4 ${accent}`}>
      <div className={`w-12 h-12 rounded-card flex items-center justify-center ${iconBg} ${iconColor}`}>
        <Icon />
      </div>
      <div>
        <p className="text-3xl font-extrabold text-white tabular-nums">{value.toLocaleString()}</p>
        <p className="text-sp-gray text-sm mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="rounded-card p-5 bg-sp-card animate-pulse h-36" />;
}

export default function AdminStatsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: getStats });

  return (
    <div className="p-6 max-w-4xl mx-auto" data-testid="stats-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Tổng quan</h1>
        <p className="text-sp-gray text-sm mt-1">Thống kê tổng thể nền tảng</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : STAT_CONFIG.map(({ key, label, Icon, accent, iconBg, iconColor }) => (
              <StatCard
                key={key}
                value={data?.[key] ?? 0}
                label={label}
                Icon={Icon}
                accent={accent}
                iconBg={iconBg}
                iconColor={iconColor}
              />
            ))
        }
      </div>
    </div>
  );
}
