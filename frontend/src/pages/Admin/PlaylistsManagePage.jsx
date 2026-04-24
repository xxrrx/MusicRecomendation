import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Pagination from '../../components/Pagination';
import {
  getAdminPlaylists, getAdminPlaylistDetail, createAdminPlaylist,
  deleteAdminPlaylist, addSongToAdminPlaylist, removeSongFromAdminPlaylist,
} from '../../lib/adminApi';

function fmtDuration(s) {
  if (!s) return '--';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function SkeletonPlaylist() {
  return (
    <div className="bg-sp-card rounded-card p-4 animate-pulse flex gap-3">
      <div className="w-12 h-12 rounded-lg bg-sp-hover shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 bg-sp-hover rounded w-2/5" />
        <div className="h-3 bg-sp-hover rounded w-1/5" />
      </div>
    </div>
  );
}

export default function PlaylistsManagePage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', coverUrl: '' });
  const [selected, setSelected] = useState(null);
  const [addSongId, setAddSongId] = useState('');
  const [addError, setAddError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-playlists', page],
    queryFn: () => getAdminPlaylists({ page, limit: 10 }),
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-playlist-detail', selected],
    queryFn: () => getAdminPlaylistDetail(selected),
    enabled: !!selected,
  });

  const createMutation = useMutation({
    mutationFn: () => createAdminPlaylist(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-playlists'] });
      setShowCreate(false); setCreateForm({ title: '', coverUrl: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminPlaylist(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-playlists'] });
      if (selected) setSelected(null);
    },
  });

  const addSongMutation = useMutation({
    mutationFn: (songId) => addSongToAdminPlaylist(selected, songId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-playlist-detail', selected] });
      setAddSongId(''); setAddError('');
    },
    onError: (err) => setAddError(err.response?.data?.error?.message || 'Lỗi'),
  });

  const removeSongMutation = useMutation({
    mutationFn: (songId) => removeSongFromAdminPlaylist(selected, songId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-playlist-detail', selected] }),
  });

  const playlists = data?.playlists || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Playlist chính thức</h1>
          <p className="text-sp-gray text-sm mt-1">{data?.pagination?.total ?? 0} playlist</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-sp-green hover:bg-sp-green-light text-black font-semibold px-5 py-2.5 rounded-pill text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75z" clipRule="evenodd" />
          </svg>
          Tạo playlist
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-sp-card rounded-card p-5 mb-6 border border-sp-border animate-fadeIn">
          <h3 className="text-white font-semibold mb-4 text-sm">Playlist mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sp-gray text-xs mb-1.5 block">Tên *</label>
              <input value={createForm.title} onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                className="sp-input text-sm" />
            </div>
            <div>
              <label className="text-sp-gray text-xs mb-1.5 block">Cover URL (tuỳ chọn)</label>
              <input value={createForm.coverUrl} onChange={(e) => setCreateForm(f => ({ ...f, coverUrl: e.target.value }))}
                className="sp-input text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!createForm.title || createMutation.isPending}
              className="bg-sp-green hover:bg-sp-green-light disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-pill text-sm transition-all duration-150"
            >
              {createMutation.isPending ? 'Đang tạo…' : 'Tạo'}
            </button>
            <button onClick={() => setShowCreate(false)} className="text-sp-gray hover:text-white text-sm px-4 py-2 rounded-pill transition-colors">Hủy</button>
          </div>
        </div>
      )}

      </div>{/* end shrink-0 header */}

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Playlist list */}
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonPlaylist key={i} />)
            : playlists.length === 0
              ? <p className="text-sp-gray text-sm text-center py-12">Chưa có playlist chính thức nào.</p>
              : playlists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setSelected(selected === pl.id ? null : pl.id)}
                    className={`rounded-card p-4 cursor-pointer transition-colors duration-150 ${
                      selected === pl.id
                        ? 'bg-sp-hover ring-1 ring-sp-green/50'
                        : 'bg-sp-card hover:bg-sp-hover/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-sp-hover overflow-hidden shrink-0 flex items-center justify-center">
                        {pl.coverUrl
                          ? <img src={pl.coverUrl} alt="" className="w-full h-full object-cover" />
                          : <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-sp-gray"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{pl.title}</p>
                        <p className="text-sp-gray-dark text-xs mt-0.5">{pl._count?.songs} bài hát</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('Xóa playlist này?')) deleteMutation.mutate(pl.id); }}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 shrink-0"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
          }
        </div>

        {/* Playlist detail */}
        {selected && detail && (
          <div className="bg-sp-card rounded-card p-5 animate-fadeIn">
            <h3 className="text-white font-semibold mb-4 text-sm">"{detail.title}"</h3>

            <div className="flex gap-2 mb-2">
              <input
                value={addSongId}
                onChange={(e) => setAddSongId(e.target.value)}
                placeholder="Song ID để thêm…"
                className="sp-input text-sm flex-1 py-2"
              />
              <button
                onClick={() => addSongMutation.mutate(addSongId)}
                disabled={!addSongId.trim() || addSongMutation.isPending}
                className="bg-sp-green hover:bg-sp-green-light disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-card text-sm transition-all"
              >
                Thêm
              </button>
            </div>
            {addError && <p className="text-red-400 text-xs mb-3">{addError}</p>}

            {(detail.songs || []).length === 0 ? (
              <p className="text-sp-gray text-sm text-center py-6">Chưa có bài hát nào.</p>
            ) : (
              <ul className="space-y-0.5 mt-3">
                {detail.songs.map(({ position, song }) => (
                  <li key={song.id} className="flex items-center gap-3 py-2.5 border-b border-sp-border last:border-0">
                    <span className="text-sp-gray-dark text-xs w-5 text-right shrink-0 tabular-nums">{position}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{song.title}</p>
                      <p className="text-sp-gray-dark text-xs">{song.artist?.user?.displayName} · {fmtDuration(song.duration)}</p>
                    </div>
                    <button
                      onClick={() => removeSongMutation.mutate(song.id)}
                      disabled={removeSongMutation.isPending}
                      className="text-xs px-2.5 py-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-50"
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
      </div>{/* end scroll area */}

      <Pagination pagination={data?.pagination} onPageChange={setPage} label="playlist" />
    </div>
  );
}
