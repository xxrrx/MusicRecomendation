import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingSongs, reviewSong, getUsers, updateUserStatus, getStats } from '../lib/adminApi';

const TABS = ['pending-songs', 'users', 'stats'];

export default function AdminPanelPage() {
  const [tab, setTab] = useState('pending-songs');
  const qc = useQueryClient();

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="admin-panel">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6" data-testid="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            data-testid={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {tab === 'pending-songs' && <PendingSongsTab qc={qc} />}
      {tab === 'users' && <UsersTab qc={qc} />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
}

// ─── Pending Songs tab ────────────────────────────────────────────────────────

function PendingSongsTab({ qc }) {
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-songs'],
    queryFn: () => getPendingSongs(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, reason }) => reviewSong(id, { action, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-songs'] });
      setRejectingId(null);
      setReason('');
    },
  });

  if (isLoading) return <p className="text-gray-400">Loading…</p>;

  const songs = data?.songs || [];

  return (
    <div data-testid="pending-songs-tab">
      {songs.length === 0 ? (
        <p data-testid="no-pending" className="text-gray-500 text-sm">No songs pending review.</p>
      ) : (
        <ul className="space-y-3" data-testid="pending-songs-list">
          {songs.map((song) => (
            <li key={song.id} data-testid={`pending-song-${song.id}`} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium">{song.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    by {song.artist?.user?.displayName} · uploaded {new Date(song.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    data-testid={`approve-${song.id}`}
                    onClick={() => reviewMutation.mutate({ id: song.id, action: 'approved' })}
                    disabled={reviewMutation.isPending}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Approve
                  </button>
                  <button
                    data-testid={`reject-btn-${song.id}`}
                    onClick={() => setRejectingId(rejectingId === song.id ? null : song.id)}
                    className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejectingId === song.id && (
                <div className="mt-3 flex gap-2" data-testid={`reject-form-${song.id}`}>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejection"
                    data-testid={`reject-reason-${song.id}`}
                    className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    data-testid={`confirm-reject-${song.id}`}
                    onClick={() => reviewMutation.mutate({ id: song.id, action: 'rejected', reason })}
                    disabled={!reason || reviewMutation.isPending}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab({ qc }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getUsers(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (isLoading) return <p className="text-gray-400">Loading…</p>;

  const users = data?.users || [];

  return (
    <div data-testid="users-tab">
      <table className="w-full text-sm" data-testid="users-table">
        <thead>
          <tr className="text-gray-400 text-left border-b border-gray-700">
            <th className="pb-2">User</th>
            <th className="pb-2">Role</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {users.map((user) => (
            <tr key={user.id} data-testid={`user-row-${user.id}`}>
              <td className="py-2">
                <p className="text-white">{user.displayName}</p>
                <p className="text-gray-400 text-xs">{user.email}</p>
              </td>
              <td className="py-2 text-gray-300 capitalize">{user.role}</td>
              <td className="py-2">
                <span className={user.isActive ? 'text-green-400' : 'text-red-400'}>
                  {user.isActive ? 'Active' : 'Banned'}
                </span>
              </td>
              <td className="py-2">
                {user.role !== 'admin' && (
                  <button
                    data-testid={`toggle-status-${user.id}`}
                    onClick={() => statusMutation.mutate({ id: user.id, isActive: !user.isActive })}
                    disabled={statusMutation.isPending}
                    className={`text-sm px-3 py-1 rounded-lg disabled:opacity-50 ${
                      user.isActive
                        ? 'bg-red-700 hover:bg-red-600 text-white'
                        : 'bg-green-700 hover:bg-green-600 text-white'
                    }`}
                  >
                    {user.isActive ? 'Ban' : 'Unban'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Stats tab ────────────────────────────────────────────────────────────────

function StatsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getStats,
  });

  if (isLoading) return <p className="text-gray-400">Loading…</p>;

  return (
    <div data-testid="stats-tab" className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Users" value={data?.userCount ?? 0} />
      <StatCard label="Published Songs" value={data?.songCount ?? 0} />
      <StatCard label="Pending Songs" value={data?.pendingCount ?? 0} />
      <StatCard label="Artists" value={data?.artistCount ?? 0} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}
