import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserDetail, updateUserStatus, updateUserRole } from '../../lib/adminApi';

const ROLES = ['user', 'artist', 'admin'];

function fmtDate(d) {
  return d ? new Date(d).toLocaleString('vi-VN') : '—';
}

function StatCard({ label, value }) {
  return (
    <div className="bg-sp-card rounded-card p-4 text-center border border-sp-border">
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-sp-gray text-xs mt-1">{label}</p>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: () => getUserDetail(id),
  });

  const statusMutation = useMutation({
    mutationFn: (isActive) => updateUserStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user-detail', id] }),
  });

  const roleMutation = useMutation({
    mutationFn: (role) => updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user-detail', id] }),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-4 bg-sp-card rounded w-24" />
        <div className="bg-sp-card rounded-card p-6 flex gap-5">
          <div className="w-20 h-20 rounded-full bg-sp-hover" />
          <div className="flex-1 space-y-3 py-2">
            <div className="h-5 bg-sp-hover rounded w-1/4" />
            <div className="h-3.5 bg-sp-hover rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-6 text-sp-gray">Không tìm thấy user.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sp-gray hover:text-white text-sm transition-colors">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0z" clipRule="evenodd" />
        </svg>
        Quay lại
      </Link>

      {/* Profile card */}
      <div className="bg-sp-card rounded-card p-6 flex items-start gap-5">
        <div className="w-20 h-20 rounded-full bg-sp-hover overflow-hidden shrink-0 flex items-center justify-center">
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-3xl font-bold text-sp-gray uppercase">{user.displayName?.[0] ?? user.email?.[0]}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
          <p className="text-sp-gray text-sm mt-0.5">{user.email}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-sp-gray-dark">
            <span>Tham gia: {fmtDate(user.createdAt)}</span>
            <span className={`flex items-center gap-1 ${user.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
              {user.isVerified ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" clipRule="evenodd" /></svg>
              )}
              {user.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 shrink-0">
          <div>
            <label className="text-sp-gray text-xs mb-1.5 block">Vai trò</label>
            <select
              value={user.role}
              onChange={(e) => roleMutation.mutate(e.target.value)}
              disabled={roleMutation.isPending}
              className="bg-sp-hover text-white rounded-card px-3 py-2 text-sm border border-sp-border focus:outline-none focus:border-white disabled:opacity-50"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {user.role !== 'admin' && (
            <button
              onClick={() => statusMutation.mutate(!user.isActive)}
              disabled={statusMutation.isPending}
              className={`px-4 py-2 rounded-pill text-sm font-semibold transition-all duration-150 disabled:opacity-50 ${
                user.isActive
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              }`}
            >
              {user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <StatCard label="Bài đã thích"    value={user._count?.likedSongs ?? 0} />
        <StatCard label="Playlist"        value={user._count?.playlists ?? 0} />
        <StatCard label="Đang theo dõi"   value={user._count?.followings ?? 0} />
        <StatCard label="Like"            value={user.behaviorStats?.like ?? 0} />
        <StatCard label="Skip"            value={user.behaviorStats?.skip ?? 0} />
      </div>

      {/* Artist info */}
      {user.artist && (
        <div className="bg-sp-card rounded-card p-5">
          <h2 className="text-white font-semibold mb-4 text-sm">Thông tin nghệ sĩ</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Bài hát',           value: user.artist._count?.songs },
              { label: 'Người theo dõi',    value: user.artist._count?.followers },
              { label: 'Tổng thu nhập',     value: `${Number(user.artist.totalEarnings).toLocaleString()} ₫` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-sp-gray text-xs">{label}</p>
                <p className="text-white font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Play history */}
      <div className="bg-sp-card rounded-card p-5">
        <h2 className="text-white font-semibold mb-4 text-sm">Lịch sử nghe gần đây</h2>
        {!user.recentHistory?.length ? (
          <p className="text-sp-gray text-sm text-center py-6">Chưa có lịch sử nghe.</p>
        ) : (
          <ul className="space-y-0.5">
            {user.recentHistory.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2.5 border-b border-sp-border last:border-0">
                <div className="w-9 h-9 rounded-lg bg-sp-hover overflow-hidden flex items-center justify-center shrink-0">
                  {h.song?.coverUrl
                    ? <img src={h.song.coverUrl} alt="" className="w-full h-full object-cover" />
                    : <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-sp-gray"><path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" /></svg>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{h.song?.title}</p>
                </div>
                <div className="text-right text-xs text-sp-gray-dark shrink-0">
                  <p>{fmtDate(h.playedAt)}</p>
                  {h.completionRate != null && (
                    <p className="mt-0.5">{Math.round(h.completionRate * 100)}% hoàn thành</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
