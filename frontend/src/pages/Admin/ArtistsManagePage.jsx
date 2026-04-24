import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminArtists, promoteUserToArtist, updateArtistProfile, getUsers } from '../../lib/adminApi';
import Pagination from '../../components/Pagination';

function SkeletonCard() {
  return (
    <div className="bg-sp-card rounded-card p-4 animate-pulse flex gap-4">
      <div className="w-12 h-12 rounded-full bg-sp-hover shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 bg-sp-hover rounded w-1/3" />
        <div className="h-3 bg-sp-hover rounded w-1/4" />
      </div>
    </div>
  );
}

export default function ArtistsManagePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [showPromote, setShowPromote] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState('');
  const [promoteBio, setPromoteBio] = useState('');
  const [promoteError, setPromoteError] = useState('');

  function handleSearch(val) { setSearch(val); setPage(1); }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-artists', search, page],
    queryFn: () => getAdminArtists({ search: search || undefined, page, limit: 10 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-non-artist'],
    queryFn: () => getUsers({ role: 'user' }),
    enabled: showPromote,
  });

  const promoteMutation = useMutation({
    mutationFn: () => promoteUserToArtist(promoteUserId, { bio: promoteBio || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-artists'] });
      qc.invalidateQueries({ queryKey: ['admin-users-non-artist'] });
      setShowPromote(false); setPromoteUserId(''); setPromoteBio(''); setPromoteError('');
    },
    onError: (err) => setPromoteError(err.response?.data?.error?.message || 'Lỗi'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => updateArtistProfile(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-artists'] }); setEditing(null); },
  });

  const artists = data?.artists || [];
  const nonArtistUsers = usersData?.users || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nghệ sĩ</h1>
          <p className="text-sp-gray text-sm mt-1">{data?.pagination?.total ?? 0} nghệ sĩ</p>
        </div>
        <button
          onClick={() => setShowPromote(!showPromote)}
          className="flex items-center gap-2 bg-sp-green hover:bg-sp-green-light text-black font-semibold px-5 py-2.5 rounded-pill text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75z" clipRule="evenodd" />
          </svg>
          Thêm nghệ sĩ
        </button>
      </div>

      {/* Promote form */}
      {showPromote && (
        <div className="bg-sp-card rounded-card p-5 mb-6 border border-sp-border animate-fadeIn">
          <h3 className="text-white font-semibold mb-4 text-sm">Phong cấp user thành nghệ sĩ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sp-gray text-xs mb-1.5 block">Chọn user</label>
              <select
                value={promoteUserId}
                onChange={(e) => setPromoteUserId(e.target.value)}
                className="w-full bg-sp-hover text-white rounded-card px-3 py-2.5 text-sm border border-sp-border focus:outline-none focus:border-white"
              >
                <option value="">-- Chọn user --</option>
                {nonArtistUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sp-gray text-xs mb-1.5 block">Bio (tuỳ chọn)</label>
              <input
                value={promoteBio}
                onChange={(e) => setPromoteBio(e.target.value)}
                placeholder="Giới thiệu về nghệ sĩ…"
                className="sp-input text-sm"
              />
            </div>
          </div>
          {promoteError && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" clipRule="evenodd" /></svg>
              {promoteError}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => promoteMutation.mutate()}
              disabled={!promoteUserId || promoteMutation.isPending}
              className="bg-sp-green hover:bg-sp-green-light disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-pill text-sm transition-all duration-150"
            >
              {promoteMutation.isPending ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
            <button onClick={() => setShowPromote(false)} className="text-sp-gray hover:text-white text-sm px-4 py-2 rounded-pill transition-colors">Hủy</button>
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
          placeholder="Tìm theo tên hoặc email…"
          className="sp-input pl-10 text-sm"
        />
      </div>

      </div>{/* end shrink-0 header */}

      {/* Card list — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 min-h-0">
      <div className="space-y-3" id="artists-list">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : artists.length === 0
            ? <p className="text-sp-gray text-sm text-center py-12">Không có nghệ sĩ nào.</p>
            : artists.map((artist) => (
                <div key={artist.id} className="bg-sp-card rounded-card p-4 hover:bg-sp-hover/50 transition-colors duration-150">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-sp-hover overflow-hidden shrink-0 flex items-center justify-center">
                      {artist.user?.avatarUrl
                        ? <img src={artist.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-sp-gray"><path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5z" /></svg>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{artist.user?.displayName}</p>
                      <p className="text-sp-gray text-xs mt-0.5">{artist.user?.email}</p>
                      <p className="text-sp-gray-dark text-xs mt-1 truncate">{artist.bio || 'Chưa có bio'}</p>
                      <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-sp-gray-dark">
                        <span className="flex items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" /></svg>
                          {artist._count?.songs} bài
                        </span>
                        <span className="flex items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657zM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6z" /></svg>
                          {artist._count?.albums} album
                        </span>
                        <span className="flex items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122z" /></svg>
                          {artist._count?.followers?.toLocaleString()} theo dõi
                        </span>
                        <span className="text-sp-green font-medium">{Number(artist.totalEarnings).toLocaleString()} ₫</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditing(editing?.id === artist.id ? null : artist)}
                      className="text-xs px-3 py-1.5 rounded-lg text-sp-gray hover:text-white hover:bg-sp-hover transition-colors duration-150 shrink-0"
                    >
                      Sửa
                    </button>
                  </div>

                  {editing?.id === artist.id && (
                    <ArtistEditForm
                      artist={editing}
                      isPending={editMutation.isPending}
                      onSave={(payload) => editMutation.mutate({ id: artist.id, payload })}
                      onCancel={() => setEditing(null)}
                    />
                  )}
                </div>
              ))
        }
      </div>
      </div>{/* end scroll area */}

      <Pagination pagination={data?.pagination} onPageChange={setPage} label="nghệ sĩ" />
    </div>
  );
}

function ArtistEditForm({ artist, onSave, onCancel, isPending }) {
  const [form, setForm] = useState({
    displayName: artist.user?.displayName || '',
    bio: artist.bio || '',
  });

  return (
    <div className="mt-4 pt-4 border-t border-sp-border grid grid-cols-1 md:grid-cols-2 gap-3 animate-fadeIn">
      {[
        { key: 'displayName', label: 'Tên hiển thị' },
        { key: 'bio',         label: 'Bio' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="text-sp-gray text-xs mb-1.5 block">{label}</label>
          <input
            value={form[key]}
            onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="sp-input text-sm py-2"
          />
        </div>
      ))}
      <div className="md:col-span-2 flex gap-2">
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
