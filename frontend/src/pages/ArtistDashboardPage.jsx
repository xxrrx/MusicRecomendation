import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDashboard, getMySongs, uploadSong, updateSong, deleteSong,
  getMyAlbums, createAlbum, getMyAlbum, updateAlbum, deleteAlbum,
  addSongToAlbum, removeSongFromAlbum,
  getMyPlaysOverTime, getMyTopSongs, getMyRevenue,
  updateMyProfile,
} from '../lib/artistApi';

/* ══ Shared design tokens ═════════════════════════════════════════════════════ */

/** Status badge pill */
function StatusBadge({ status }) {
  const map = {
    published: 'bg-green-500/15 text-green-400 border border-green-500/30',
    pending:   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    rejected:  'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  const label = { published: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Từ chối' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || 'bg-sp-hover text-sp-gray'}`}>
      {label[status] ?? status}
    </span>
  );
}

/** Metric card */
function StatCard({ label, value, icon, accent }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ?? ''}`} style={!accent ? { background: 'rgba(255,255,255,0.08)' } : {}}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
      </div>
    </div>
  );
}

/** Labeled text input */
function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
        onFocus={e => e.target.style.borderColor = 'rgba(29,185,84,0.6)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'}
      />
    </div>
  );
}

/** Mini bar chart */
function BarChart({ data, color = 'green' }) {
  const colorMap = { green: '#1DB954', blue: '#3b82f6', purple: '#a855f7' };
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const lastN  = data.slice(-20);
  return (
    <div className="flex items-end gap-[3px] h-28 w-full">
      {lastN.map((d) => (
        <div key={d.date} title={`${d.date}: ${d.count}`}
             className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-sm opacity-80 hover:opacity-100 transition-opacity"
            style={{ height: `${Math.max(3, (d.count / maxVal) * 96)}px`, background: colorMap[color] }}
          />
          <span className="hidden sm:block" style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

/** Section card wrapper */
function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl p-4 ${className}`} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {title && <h3 className="text-white font-bold text-sm mb-3">{title}</h3>}
      {children}
    </div>
  );
}

/* ══ Page shell ═══════════════════════════════════════════════════════════════ */

export default function ArtistDashboardPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  return (
    <div className="p-6" data-testid="artist-dashboard">
      {tab === 'overview'  && <OverviewTab />}
      {tab === 'songs'     && <SongsTab />}
      {tab === 'albums'    && <AlbumsTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'revenue'   && <RevenueTab />}
      {tab === 'profile'   && <ProfileTab />}
    </div>
  );
}

/* ══ Overview ════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const { data: dashboard, isLoading } = useQuery({ queryKey: ['artist-dashboard'], queryFn: getDashboard });
  const { data: topSongs } = useQuery({ queryKey: ['artist-top-songs'], queryFn: () => getMyTopSongs({ limit: 5 }) });

  if (isLoading) return <PageLoading />;
  if (!dashboard) return null;

  return (
    <div data-testid="dashboard-stats" className="space-y-4">
      {/* Artist hero */}
      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {dashboard.avatarUrl ? (
          <img src={dashboard.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5z" />
            </svg>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{dashboard.displayName}</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{dashboard.email}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tổng lượt nghe" value={dashboard.totalPlayCount.toLocaleString()}
          accent="bg-blue-500/20"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>}
        />
        <StatCard label="Người theo dõi" value={dashboard.followerCount.toLocaleString()}
          accent="bg-purple-500/20"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-400"><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003z" /></svg>}
        />
        <StatCard label="Tổng thu nhập" value={`${Number(dashboard.totalEarnings).toLocaleString()} ₫`}
          accent="bg-sp-green/20"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-sp-green"><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5z" /><path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0z" clipRule="evenodd" /></svg>}
        />
        <StatCard label="Bài hát" value={dashboard.totalSongs}
          accent="bg-orange-500/20"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-400"><path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" /></svg>}
        />
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-3">
        <span className="flex items-center gap-2 px-4 py-2 rounded-pill bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          Đã duyệt: {dashboard.songsByStatus.published}
        </span>
        <span className="flex items-center gap-2 px-4 py-2 rounded-pill bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          Chờ duyệt: {dashboard.songsByStatus.pending}
        </span>
        <span className="flex items-center gap-2 px-4 py-2 rounded-pill bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          Từ chối: {dashboard.songsByStatus.rejected}
        </span>
      </div>

      {/* Top songs */}
      {topSongs?.length > 0 && (
        <Card title="Top bài hát">
          <ol className="space-y-2">
            {topSongs.map(({ rank, song, playCount }) => (
              <li key={song.id} className="flex items-center gap-3 py-1">
                <span className={`text-sm font-bold w-5 text-right shrink-0 ${rank <= 3 ? 'text-yellow-400' : 'text-sp-gray-dark'}`}>{rank}</span>
                <div className="w-10 h-10 rounded-lg bg-sp-hover overflow-hidden shrink-0 flex items-center justify-center">
                  {song.coverUrl
                    ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sp-gray text-sm">♪</span>
                  }
                </div>
                <p className="flex-1 text-white text-sm font-medium truncate">{song.title}</p>
                <span className="text-sp-gray text-sm tabular-nums">{playCount.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

/* ══ Songs ════════════════════════════════════════════════════════════════════ */
function SongsTab() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadError, setUploadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const audioRef = useRef(null);
  const coverRef = useRef(null);
  const [form, setForm] = useState({ title: '', duration: '', bpm: '', mood: '', year: '' });

  const { data: songsData, isLoading } = useQuery({
    queryKey: ['artist-songs', statusFilter],
    queryFn: () => getMySongs(statusFilter ? { status: statusFilter } : {}),
  });

  const uploadMutation = useMutation({
    mutationFn: (fd) => uploadSong(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artist-songs'] });
      qc.invalidateQueries({ queryKey: ['artist-dashboard'] });
      setShowUpload(false);
      setForm({ title: '', duration: '', bpm: '', mood: '', year: '' });
      setUploadError('');
    },
    onError: (err) => setUploadError(err.response?.data?.error?.message || 'Upload thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSong(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['artist-songs'] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSong(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['artist-songs'] }); qc.invalidateQueries({ queryKey: ['artist-dashboard'] }); },
  });

  function handleUpload(e) {
    e.preventDefault();
    if (!audioRef.current?.files?.[0]) { setUploadError('Cần có file audio'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    fd.append('audio', audioRef.current.files[0]);
    if (coverRef.current?.files?.[0]) fd.append('cover', coverRef.current.files[0]);
    uploadMutation.mutate(fd);
  }

  const songs = songsData?.songs || [];
  const filters = [
    { value: '',          label: 'Tất cả' },
    { value: 'published', label: 'Đã duyệt' },
    { value: 'pending',   label: 'Chờ duyệt' },
    { value: 'rejected',  label: 'Từ chối' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {filters.map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150"
              style={statusFilter === value
                ? { background: '#fff', color: '#000' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
              }>
              {label}
            </button>
          ))}
        </div>
        <button data-testid="upload-toggle" onClick={() => setShowUpload((v) => !v)}
          className="flex items-center gap-2 py-2.5 px-5 rounded-full font-semibold text-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}>
          {showUpload ? '✕ Hủy' : '+ Upload bài hát'}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <Card title="Upload bài hát mới" className="animate-fadeIn">
          <form data-testid="upload-form" onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tên bài hát *" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
              <Field label="Thời lượng (giây) *" value={form.duration} onChange={(v) => setForm((f) => ({ ...f, duration: v }))} type="number" />
              <Field label="BPM" value={form.bpm} onChange={(v) => setForm((f) => ({ ...f, bpm: v }))} type="number" />
              <Field label="Mood" value={form.mood} onChange={(v) => setForm((f) => ({ ...f, mood: v }))} placeholder="happy, chill, energetic…" />
              <Field label="Năm" value={form.year} onChange={(v) => setForm((f) => ({ ...f, year: v }))} type="number" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>File audio (MP3) *</label>
                <input ref={audioRef} type="file" accept="audio/*" data-testid="audio-input"
                  className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-white file:text-sm file:cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>Ảnh bìa (tùy chọn)</label>
                <input ref={coverRef} type="file" accept="image/*"
                  className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-white file:text-sm file:cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
            </div>
            {uploadError && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-card px-4 py-2">{uploadError}</p>
            )}
            <button type="submit" disabled={uploadMutation.isPending}
              className="py-2.5 px-6 rounded-full font-semibold text-black disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}>
              {uploadMutation.isPending ? 'Đang upload…' : 'Upload bài hát'}
            </button>
          </form>
        </Card>
      )}

      {/* Songs table */}
      {isLoading ? <PageLoading /> : songs.length === 0 ? (
        <div data-testid="empty-songs" className="flex flex-col items-center py-16 text-center">
          <p className="text-white font-semibold">Chưa có bài hát nào</p>
          <p className="text-sp-gray text-sm mt-1">Upload bài hát đầu tiên của bạn.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full text-sm" data-testid="songs-list">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <th className="px-4 py-3">Bài hát</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Lượt nghe</th>
                <th className="px-4 py-3">Album</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {songs.map((song) => (
                <>
                  <tr key={song.id} data-testid={`song-row-${song.id}`}
                      className="transition-colors duration-150"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          {song.coverUrl
                            ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>♪</span>
                          }
                        </div>
                        <p className="text-white font-medium">{song.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={song.status} />
                      {song.rejectionReason && (
                        <p className="text-red-400 text-xs mt-1">{song.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>{song.playCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{song.album?.title || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => { setEditingId(editingId === song.id ? null : song.id); setEditForm({ title: song.title, mood: song.mood || '', bpm: song.bpm || '', year: song.year || '' }); }}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: 'rgba(255,255,255,0.5)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                        >
                          Sửa
                        </button>
                        {song.status !== 'published' && (
                          <button data-testid={`delete-song-${song.id}`}
                            onClick={() => deleteMutation.mutate(song.id)} disabled={deleteMutation.isPending}
                            className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingId === song.id && (
                    <tr key={`edit-${song.id}`}>
                      <td colSpan={5} className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Field label="Tên" value={editForm.title} onChange={(v) => setEditForm((f) => ({ ...f, title: v }))} />
                          <Field label="Mood" value={editForm.mood} onChange={(v) => setEditForm((f) => ({ ...f, mood: v }))} />
                          <Field label="BPM" value={editForm.bpm} onChange={(v) => setEditForm((f) => ({ ...f, bpm: v }))} type="number" />
                          <Field label="Năm" value={editForm.year} onChange={(v) => setEditForm((f) => ({ ...f, year: v }))} type="number" />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => updateMutation.mutate({ id: song.id, data: editForm })} disabled={updateMutation.isPending}
                            className="text-sm py-2 px-5 rounded-full font-semibold text-black disabled:opacity-50 transition-all"
                            style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}>Lưu</button>
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-sm rounded-full transition-colors"
                            style={{ color: 'rgba(255,255,255,0.5)' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                          >Hủy</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══ Albums ══════════════════════════════════════════════════════════════════ */
function SkeletonAlbum() {
  return (
    <div className="rounded-xl p-4 animate-pulse flex gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-12 h-12 rounded-lg shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 rounded w-2/5" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-3 rounded w-1/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>
    </div>
  );
}

function fmtDuration(s) {
  if (!s) return '--';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function AlbumsTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [createForm, setCreateForm] = useState({ title: '', year: '' });
  const [createError, setCreateError] = useState('');
  const [addSongId, setAddSongId] = useState('');
  const [search, setSearch] = useState('');
  const coverRef = useRef(null);

  const { data: albums, isLoading } = useQuery({ queryKey: ['artist-albums'], queryFn: getMyAlbums });
  const { data: albumDetail } = useQuery({
    queryKey: ['artist-album', selectedAlbumId],
    queryFn: () => getMyAlbum(selectedAlbumId),
    enabled: !!selectedAlbumId,
  });
  const { data: allSongs } = useQuery({ queryKey: ['artist-songs'], queryFn: () => getMySongs({ limit: 200 }) });

  const createMutation = useMutation({
    mutationFn: (fd) => createAlbum(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artist-albums'] });
      setShowCreate(false);
      setCreateForm({ title: '', year: '' });
      setCreateError('');
    },
    onError: (err) => setCreateError(err.response?.data?.error?.message || 'Lỗi tạo album'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAlbum(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['artist-albums'] }); if (selectedAlbumId) setSelectedAlbumId(null); },
  });
  const addSongMutation = useMutation({
    mutationFn: ({ albumId, songId }) => addSongToAlbum(albumId, songId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['artist-album', selectedAlbumId] }); setAddSongId(''); },
  });
  const removeSongMutation = useMutation({
    mutationFn: ({ albumId, songId }) => removeSongFromAlbum(albumId, songId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artist-album', selectedAlbumId] }),
  });

  function handleCreate(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', createForm.title);
    if (createForm.year) fd.append('year', createForm.year);
    if (coverRef.current?.files?.[0]) fd.append('cover', coverRef.current.files[0]);
    createMutation.mutate(fd);
  }

  const songsNotInAlbum = (allSongs?.songs || []).filter(
    (s) => s.status === 'published' && !albumDetail?.songs?.find((as) => as.id === s.id)
  );

  const filteredAlbums = (albums || []).filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Album</h2>
          <p className="text-sp-gray text-sm mt-1">{(albums || []).length} album</p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full text-sm text-black transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75z" clipRule="evenodd" />
          </svg>
          Tạo album
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl p-5 animate-fadeIn" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-white font-semibold mb-4 text-sm">Tạo album mới</h3>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.45)' }}>Tên album *</label>
                <input value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.45)' }}>Năm</label>
                <input type="number" value={createForm.year} onChange={(e) => setCreateForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.45)' }}>Ảnh bìa</label>
                <input ref={coverRef} type="file" accept="image/*"
                  className="w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-white file:text-xs file:cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
            </div>
            {createError && <p className="text-red-400 text-sm mt-2">{createError}</p>}
            <div className="flex gap-2 mt-4">
              <button type="submit" disabled={!createForm.title || createMutation.isPending}
                className="disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-full text-sm transition-all duration-150"
                style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}>
                {createMutation.isPending ? 'Đang tạo…' : 'Tạo'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="text-sm px-4 py-2 rounded-full transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg viewBox="0 0 24 24" fill="currentColor"
             className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
             style={{ color: 'rgba(255,255,255,0.3)' }}>
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5zM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5z" clipRule="evenodd" />
        </svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm album…"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }} />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Album list */}
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonAlbum key={i} />)
            : filteredAlbums.length === 0
              ? <p className="text-sp-gray text-sm text-center py-12">Chưa có album nào.</p>
              : filteredAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => setSelectedAlbumId(selectedAlbumId === album.id ? null : album.id)}
                    className="rounded-xl p-4 cursor-pointer transition-all duration-150"
                    style={selectedAlbumId === album.id
                      ? { background: 'rgba(29,185,84,0.10)', border: '1px solid rgba(29,185,84,0.35)' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        {album.coverUrl
                          ? <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                          : <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.4)' }}><path d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657zM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6z" /></svg>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{album.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{album.year || '—'} · {album._count?.songs ?? 0} bài</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('Xóa album này?')) deleteMutation.mutate(album.id); }}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-150 shrink-0"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
          }
        </div>

        {/* Album detail */}
        {selectedAlbumId && albumDetail && (
          <div className="rounded-xl p-5 animate-fadeIn" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-white font-semibold mb-4 text-sm">Bài hát trong "{albumDetail.title}"</h3>

            {songsNotInAlbum.length > 0 && (
              <div className="flex gap-2 mb-4">
                <select value={addSongId} onChange={(e) => setAddSongId(e.target.value)}
                  className="flex-1 text-white rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <option value="">Chọn bài hát để thêm…</option>
                  {songsNotInAlbum.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <button
                  onClick={() => addSongId && addSongMutation.mutate({ albumId: selectedAlbumId, songId: addSongId })}
                  disabled={!addSongId || addSongMutation.isPending}
                  className="disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}
                >
                  Thêm
                </button>
              </div>
            )}

            {!albumDetail.songs?.length ? (
              <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Chưa có bài hát nào.</p>
            ) : (
              <ul className="space-y-0.5">
                {albumDetail.songs.map((song) => (
                  <li key={song.id} className="flex items-center gap-3 py-2.5 last:border-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{fmtDuration(song.duration)}</p>
                    </div>
                    <button
                      onClick={() => removeSongMutation.mutate({ albumId: selectedAlbumId, songId: song.id })}
                      disabled={removeSongMutation.isPending}
                      className="text-xs px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ Analytics ═══════════════════════════════════════════════════════════════ */
const PERIODS = [{ label: '7 ngày', days: 7 }, { label: '30 ngày', days: 30 }, { label: '90 ngày', days: 90 }];

function AnalyticsTab() {
  const [period, setPeriod] = useState(30);
  const { data: playsData } = useQuery({ queryKey: ['artist-plays', period], queryFn: () => getMyPlaysOverTime({ days: period }) });
  const { data: topSongs }  = useQuery({ queryKey: ['artist-top-songs', period], queryFn: () => getMyTopSongs({ limit: 10 }) });

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {PERIODS.map(({ label, days }) => (
          <button key={days} onClick={() => setPeriod(days)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150"
            style={period === days
              ? { background: '#fff', color: '#000' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
            }>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={`Lượt nghe (${period} ngày qua)`}>
          {playsData?.length ? <BarChart data={playsData} color="green" /> : <EmptyChart />}
        </Card>
        <Card title="Bài hát hot nhất">
          {!topSongs?.length ? <p className="text-sp-gray text-sm">Chưa có dữ liệu.</p> : (
            <ol className="space-y-2">
              {topSongs.map(({ rank, song, playCount }) => (
                <li key={song.id} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-5 text-right shrink-0 ${rank <= 3 ? 'text-yellow-400' : 'text-sp-gray-dark'}`}>{rank}</span>
                  <p className="flex-1 text-white text-sm truncate">{song.title}</p>
                  <span className="text-sp-gray text-sm tabular-nums">{playCount.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ══ Revenue ══════════════════════════════════════════════════════════════════ */
function RevenueTab() {
  const { data, isLoading } = useQuery({ queryKey: ['artist-revenue'], queryFn: getMyRevenue });
  if (isLoading) return <PageLoading />;
  if (!data) return null;

  const maxMonth = Math.max(...(data.byMonth || []).map((m) => m.total), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StatCard label="Tổng doanh thu" value={`${data.totalRevenue.toLocaleString()} ₫`}
          accent="bg-sp-green/20"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-sp-green"><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5z" /><path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0z" clipRule="evenodd" /></svg>}
        />
        <StatCard label="Số lần donate" value={data.totalDonations}
          accent="bg-purple-500/20"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-400"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" /></svg>}
        />
      </div>

      {data.byMonth?.length > 0 && (
        <Card title="Doanh thu theo tháng">
          <div className="space-y-3">
            {data.byMonth.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-sp-gray text-xs w-14 shrink-0">{m.month}</span>
                <div className="flex-1 h-1.5 bg-sp-hover rounded-full overflow-hidden">
                  <div className="h-full bg-sp-green rounded-full" style={{ width: `${Math.min(100, (m.total / maxMonth) * 100)}%` }} />
                </div>
                <span className="text-sp-green text-sm font-medium w-28 text-right">{m.total.toLocaleString()} ₫</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.recent?.length > 0 && (
        <Card title="Donate gần đây">
          <div>
            {data.recent.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {d.user?.avatarUrl
                  ? <img src={d.user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  : <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{d.user?.displayName?.[0]}</div>
                }
                <p className="text-white text-sm flex-1">{d.user?.displayName || 'Ẩn danh'}</p>
                <p className="text-sm font-semibold" style={{ color: '#1DB954' }}>{Number(d.amount).toLocaleString()} ₫</p>
                <p className="text-xs w-20 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>{new Date(d.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      {!data.recent?.length && <p className="text-sp-gray text-sm">Chưa nhận được donation nào.</p>}
    </div>
  );
}

/* ══ Profile ══════════════════════════════════════════════════════════════════ */
function ProfileTab() {
  const qc = useQueryClient();
  const { data: dashboard } = useQuery({ queryKey: ['artist-dashboard'], queryFn: getDashboard });
  const avatarRef = useRef(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  if (dashboard && form === null) setForm({ displayName: dashboard.displayName, bio: dashboard.bio || '' });

  const updateMutation = useMutation({
    mutationFn: (fd) => updateMyProfile(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artist-dashboard'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    if (form.displayName) fd.append('displayName', form.displayName);
    if (form.bio !== undefined) fd.append('bio', form.bio);
    if (avatarRef.current?.files?.[0]) fd.append('avatar', avatarRef.current.files[0]);
    updateMutation.mutate(fd);
  }

  if (!form) return <PageLoading />;

  return (
    <div className="max-w-lg space-y-4">
      {/* Avatar */}
      <Card>
        <div className="flex items-center gap-4">
          {dashboard?.avatarUrl ? (
            <img src={dashboard.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0zM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-white font-bold text-lg">{dashboard?.displayName}</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Nghệ sĩ</p>
            <label className="mt-2 flex items-center gap-2 text-sm cursor-pointer transition-colors" style={{ color: '#1DB954' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9z" />
                <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39z" clipRule="evenodd" />
              </svg>
              Đổi avatar
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" />
            </label>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card title="Thông tin hồ sơ">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Tên hiển thị" value={form.displayName} onChange={(v) => setForm((f) => ({ ...f, displayName: v }))} />
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>Giới thiệu (bio)</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={4}
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
              placeholder="Giới thiệu về bạn…"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={updateMutation.isPending}
              className="py-2.5 px-6 rounded-full font-semibold text-black disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}>
              {updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm animate-fadeIn" style={{ color: '#1DB954' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                Đã lưu!
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ══ Helpers ══════════════════════════════════════════════════════════════════ */
function PageLoading() {
  return (
    <div className="flex items-center gap-2 py-8 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Đang tải…
    </div>
  );
}

function EmptyChart() {
  return <div className="h-28 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Chưa có dữ liệu</div>;
}
