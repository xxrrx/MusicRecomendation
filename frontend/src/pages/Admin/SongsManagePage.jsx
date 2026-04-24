import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllSongs, updateSongMetadata, adminDeleteSong } from '../../lib/adminApi';
import api from '../../lib/api';
import Pagination from '../../components/Pagination';

const STATUSES = ['', 'pending', 'published', 'rejected'];
const STATUS_LABEL = { '': 'Tất cả', pending: 'Chờ duyệt', published: 'Đã duyệt', rejected: 'Từ chối' };
const STATUS_BADGE = {
  published: 'bg-green-500/15 text-green-400 border-green-500/30',
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/30',
};

function fmtDuration(s) {
  if (!s) return '--';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-sp-border">
      {[1,2,3,4,5,6,7].map((i) => (
        <td key={i} className="px-4 py-3.5"><div className="h-3 bg-sp-hover rounded w-3/4" /></td>
      ))}
    </tr>
  );
}

export default function SongsManagePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);

  // Reset về trang 1 khi đổi filter
  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleStatus = (v) => { setStatus(v); setPage(1); };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-songs', search, status, page],
    queryFn: () => getAllSongs({ search: search || undefined, status: status || undefined, page, limit: 10 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateSongMetadata(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-songs'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteSong(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-songs'] }),
  });

  async function handlePreview(songId) {
    if (preview?.id === songId) { setPreview(null); return; }
    try {
      const res = await api.get(`/player/stream/${songId}`);
      setPreview({ id: songId, url: res.data.data.url });
    } catch {
      alert('Không thể tải preview');
    }
  }

  const songs = data?.songs || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bài hát</h1>
          <p className="text-sp-gray text-sm mt-1">{data?.pagination?.total ?? 0} bài hát</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <svg viewBox="0 0 24 24" fill="currentColor"
               className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-gray-dark pointer-events-none">
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5zM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5z" clipRule="evenodd" />
          </svg>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm theo tên bài hát…"
            className="sp-input pl-10 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
          className="bg-sp-hover text-white rounded-card px-4 py-2.5 text-sm
                     border border-sp-border focus:outline-none focus:border-white
                     transition-colors duration-150"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      </div>{/* end shrink-0 header */}

      {/* Table — scrollable area */}
      <div className="flex-1 overflow-auto px-6 min-h-0">
      <div className="bg-sp-card rounded-card overflow-hidden" id="songs-table">
        <table className="w-full text-sm">
          <thead className="border-b border-sp-border">
            <tr className="text-sp-gray text-xs uppercase tracking-wider text-left">
              <th className="px-4 py-3.5">Bài hát</th>
              <th className="px-4 py-3.5">Nghệ sĩ</th>
              <th className="px-4 py-3.5">Thể loại</th>
              <th className="px-4 py-3.5">TL</th>
              <th className="px-4 py-3.5">Nghe</th>
              <th className="px-4 py-3.5">Trạng thái</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sp-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : songs.length === 0
                ? <tr><td colSpan={7} className="text-center text-sp-gray py-12 text-sm">Không có bài hát nào.</td></tr>
                : songs.map((song) => (
                    <>
                      <tr key={song.id} className="hover:bg-sp-hover/40 transition-colors duration-150">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-sp-hover flex items-center justify-center shrink-0 overflow-hidden">
                              {song.coverUrl
                                ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                                : <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-sp-gray"><path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" /></svg>
                              }
                            </div>
                            <span className="text-white font-medium truncate max-w-[180px]">{song.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sp-gray">{song.artist?.user?.displayName || '—'}</td>
                        <td className="px-4 py-3.5 text-sp-gray-dark">{song.genre?.name || '—'}</td>
                        <td className="px-4 py-3.5 text-sp-gray-dark tabular-nums">{fmtDuration(song.duration)}</td>
                        <td className="px-4 py-3.5 text-sp-gray-dark tabular-nums">{song.playCount?.toLocaleString()}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill border ${STATUS_BADGE[song.status] ?? 'bg-sp-hover text-sp-gray border-sp-border'}`}>
                            {STATUS_LABEL[song.status] ?? song.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handlePreview(song.id)}
                              className={`text-xs px-3 py-1.5 rounded-lg transition-colors duration-150 ${
                                preview?.id === song.id
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'text-sp-gray hover:text-white hover:bg-sp-hover'
                              }`}
                            >
                              {preview?.id === song.id ? (
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9z" clipRule="evenodd" /></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                              )}
                            </button>
                            <button
                              onClick={() => setEditing(editing?.id === song.id ? null : song)}
                              className="text-xs px-3 py-1.5 rounded-lg text-sp-gray hover:text-white hover:bg-sp-hover transition-colors duration-150"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => { if (confirm('Xóa bài hát này?')) deleteMutation.mutate(song.id); }}
                              disabled={deleteMutation.isPending}
                              className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>

                      {preview?.id === song.id && (
                        <tr key={`preview-${song.id}`} className="bg-sp-black/50">
                          <td colSpan={7} className="px-4 py-3">
                            <audio controls autoPlay src={preview.url} className="w-full h-8" />
                          </td>
                        </tr>
                      )}

                      {editing?.id === song.id && (
                        <tr key={`edit-${song.id}`} className="bg-sp-black/50">
                          <td colSpan={7} className="px-4 py-4">
                            <SongEditForm
                              song={editing}
                              isPending={updateMutation.isPending}
                              onSave={(payload) => updateMutation.mutate({ id: song.id, payload })}
                              onCancel={() => setEditing(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))
            }
          </tbody>
        </table>
      </div>
      </div>{/* end scroll area */}

      <Pagination pagination={data?.pagination} onPageChange={setPage} label="bài hát" />
    </div>
  );
}

function SongEditForm({ song, onSave, onCancel, isPending }) {
  const [form, setForm] = useState({
    title: song.title || '',
    status: song.status || 'pending',
    bpm: song.bpm ?? '',
    mood: song.mood ?? '',
    year: song.year ?? '',
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { key: 'title', label: 'Tên bài hát', type: 'text' },
        { key: 'bpm',   label: 'BPM',         type: 'number' },
        { key: 'mood',  label: 'Mood',         type: 'text' },
        { key: 'year',  label: 'Năm',          type: 'number' },
      ].map(({ key, label, type }) => (
        <div key={key}>
          <label className="text-sp-gray text-xs mb-1.5 block">{label}</label>
          <input
            type={type}
            value={form[key]}
            onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="sp-input text-sm py-2"
          />
        </div>
      ))}
      <div>
        <label className="text-sp-gray text-xs mb-1.5 block">Trạng thái</label>
        <select
          value={form.status}
          onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
          className="w-full bg-sp-hover text-white rounded-card px-3 py-2 text-sm border border-sp-border focus:outline-none focus:border-white"
        >
          <option value="pending">pending</option>
          <option value="published">published</option>
          <option value="rejected">rejected</option>
        </select>
      </div>
      <div className="col-span-2 md:col-span-4 flex gap-2 mt-1">
        <button
          onClick={() => onSave(form)}
          disabled={isPending}
          className="bg-sp-green hover:bg-sp-green-light disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-pill text-sm transition-all duration-150"
        >
          {isPending ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button onClick={onCancel} className="text-sp-gray hover:text-white text-sm px-4 py-2 rounded-pill transition-colors">Hủy</button>
      </div>
    </div>
  );
}
