import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Pagination from '../../components/Pagination';
import {
  getAdminAlbums, getAdminAlbumDetail, createAdminAlbum,
  deleteAdminAlbum, addSongToAlbum, removeSongFromAlbum,
  getAdminArtists,
} from '../../lib/adminApi';

function fmtDuration(s) {
  if (!s) return '--';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function SkeletonAlbum() {
  return (
    <div className="bg-sp-card rounded-card p-4 animate-pulse flex gap-3">
      <div className="w-12 h-12 rounded-lg bg-sp-hover shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 bg-sp-hover rounded w-2/5" />
        <div className="h-3 bg-sp-hover rounded w-1/4" />
      </div>
    </div>
  );
}

export default function AlbumsManagePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [createForm, setCreateForm] = useState({ title: '', artistId: '', year: '' });
  const [createError, setCreateError] = useState('');
  const [addSongId, setAddSongId] = useState('');

  function handleSearch(val) { setSearch(val); setPage(1); }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-albums', search, page],
    queryFn: () => getAdminAlbums({ search: search || undefined, page, limit: 10 }),
  });

  const { data: albumDetail } = useQuery({
    queryKey: ['admin-album-detail', selectedAlbum],
    queryFn: () => getAdminAlbumDetail(selectedAlbum),
    enabled: !!selectedAlbum,
  });

  const { data: artistsData } = useQuery({
    queryKey: ['admin-artists-list'],
    queryFn: () => getAdminArtists({ limit: 50 }),
    enabled: showCreate,
  });

  const createMutation = useMutation({
    mutationFn: () => createAdminAlbum({ ...createForm, year: createForm.year ? Number(createForm.year) : null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
      setShowCreate(false); setCreateForm({ title: '', artistId: '', year: '' });
    },
    onError: (err) => setCreateError(err.response?.data?.error?.message || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminAlbum(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
      if (selectedAlbum) setSelectedAlbum(null);
    },
  });

  const addSongMutation = useMutation({
    mutationFn: (songId) => addSongToAlbum(selectedAlbum, songId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-album-detail', selectedAlbum] }); setAddSongId(''); },
  });

  const removeSongMutation = useMutation({
    mutationFn: (songId) => removeSongFromAlbum(selectedAlbum, songId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-album-detail', selectedAlbum] }),
  });

  const albums = data?.albums || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Album</h1>
          <p className="text-sp-gray text-sm mt-1">{data?.pagination?.total ?? 0} album</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-sp-green hover:bg-sp-green-light text-black font-semibold px-5 py-2.5 rounded-pill text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75z" clipRule="evenodd" />
          </svg>
          Tạo album
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-sp-card rounded-card p-5 mb-6 border border-sp-border animate-fadeIn">
          <h3 className="text-white font-semibold mb-4 text-sm">Tạo album mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sp-gray text-xs mb-1.5 block">Tên album *</label>
              <input value={createForm.title} onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                className="sp-input text-sm" />
            </div>
            <div>
              <label className="text-sp-gray text-xs mb-1.5 block">Nghệ sĩ *</label>
              <select value={createForm.artistId} onChange={(e) => setCreateForm(f => ({ ...f, artistId: e.target.value }))}
                className="w-full bg-sp-hover text-white rounded-card px-3 py-2.5 text-sm border border-sp-border focus:outline-none focus:border-white">
                <option value="">-- Chọn nghệ sĩ --</option>
                {(artistsData?.artists || []).map((a) => (
                  <option key={a.id} value={a.id}>{a.user?.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sp-gray text-xs mb-1.5 block">Năm</label>
              <input type="number" value={createForm.year} onChange={(e) => setCreateForm(f => ({ ...f, year: e.target.value }))}
                className="sp-input text-sm" />
            </div>
          </div>
          {createError && <p className="text-red-400 text-sm mt-2">{createError}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!createForm.title || !createForm.artistId || createMutation.isPending}
              className="bg-sp-green hover:bg-sp-green-light disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-pill text-sm transition-all duration-150"
            >
              {createMutation.isPending ? 'Đang tạo…' : 'Tạo'}
            </button>
            <button onClick={() => setShowCreate(false)} className="text-sp-gray hover:text-white text-sm px-4 py-2 rounded-pill transition-colors">Hủy</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <svg viewBox="0 0 24 24" fill="currentColor"
             className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-gray-dark pointer-events-none">
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5zM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5z" clipRule="evenodd" />
        </svg>
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Tìm album…"
          className="sp-input pl-10 text-sm"
        />
      </div>

      </div>{/* end shrink-0 header */}

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Album list */}
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonAlbum key={i} />)
            : albums.length === 0
              ? <p className="text-sp-gray text-sm text-center py-12">Không có album nào.</p>
              : albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => setSelectedAlbum(selectedAlbum === album.id ? null : album.id)}
                    className={`rounded-card p-4 cursor-pointer transition-colors duration-150 ${
                      selectedAlbum === album.id
                        ? 'bg-sp-hover ring-1 ring-sp-green/50'
                        : 'bg-sp-card hover:bg-sp-hover/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-sp-hover overflow-hidden shrink-0 flex items-center justify-center">
                        {album.coverUrl
                          ? <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                          : <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-sp-gray"><path d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657zM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6z" /></svg>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{album.title}</p>
                        <p className="text-sp-gray-dark text-xs mt-0.5">{album.artist?.user?.displayName} · {album.year || '—'} · {album._count?.songs} bài</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('Xóa album này?')) deleteMutation.mutate(album.id); }}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 shrink-0"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
          }
        </div>

        {/* Album detail */}
        {selectedAlbum && albumDetail && (
          <div className="bg-sp-card rounded-card p-5 animate-fadeIn">
            <h3 className="text-white font-semibold mb-4 text-sm">Bài hát trong "{albumDetail.title}"</h3>

            <div className="flex gap-2 mb-4">
              <input
                value={addSongId}
                onChange={(e) => setAddSongId(e.target.value)}
                placeholder="Song ID để thêm vào album…"
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

            {(albumDetail.songs || []).length === 0 ? (
              <p className="text-sp-gray text-sm text-center py-6">Chưa có bài hát nào.</p>
            ) : (
              <ul className="space-y-0.5">
                {albumDetail.songs.map((song) => (
                  <li key={song.id} className="flex items-center gap-3 py-2.5 border-b border-sp-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{song.title}</p>
                      <p className="text-sp-gray-dark text-xs">{fmtDuration(song.duration)}</p>
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

      <Pagination pagination={data?.pagination} onPageChange={setPage} label="album" />
    </div>
  );
}
