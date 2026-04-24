import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylists, createPlaylist } from '../lib/playlistApi';

/* ── Music note icon for playlist cover placeholder ─────────────────────── */
const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-sp-gray">
    <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
  </svg>
);

/* ── Skeleton card ───────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 p-3 animate-pulse">
      <div className="w-14 h-14 rounded-card bg-sp-hover shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-sp-hover rounded w-2/5" />
        <div className="h-3 bg-sp-hover rounded w-1/4" />
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: getPlaylists,
  });

  const createMutation = useMutation({
    mutationFn: () => createPlaylist(newTitle.trim(), null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setNewTitle('');
      setShowCreate(false);
    },
  });

  function handleCreate(e) {
    e.preventDefault();
    if (newTitle.trim()) createMutation.mutate();
  }

  return (
    <div className="min-h-full">
      {/* ── Header banner ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#1a6b4a] via-[#0f3d2a] to-sp-dark px-8 pt-12 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-end gap-6">
            <div className="w-44 h-44 rounded-card-lg shrink-0 shadow-modal
                            bg-gradient-to-br from-[#1a6b4a] to-[#1DB954]
                            flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-20 h-20 opacity-90">
                <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75zM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="pb-1">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Thư viện</p>
              <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">Playlist của bạn</h1>
              <p className="text-white/60 text-sm">{playlists.length} playlist</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreate((v) => !v)}
            className="btn-primary flex items-center gap-2 shrink-0 self-end mb-1"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75z" clipRule="evenodd" />
            </svg>
            Playlist mới
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-8 py-4">
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="flex gap-2 mb-4 p-4 bg-sp-card rounded-card animate-fadeIn"
          >
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Đặt tên cho playlist..."
              className="sp-input"
            />
            <button
              type="submit"
              disabled={createMutation.isPending || !newTitle.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {createMutation.isPending ? 'Đang tạo…' : 'Tạo'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setNewTitle(''); }}
              className="btn-icon px-3 text-2xl leading-none"
            >
              ×
            </button>
          </form>
        )}

        {isLoading && (
          <div className="space-y-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!isLoading && playlists.length > 0 && (
          <div className="space-y-0.5">
            {playlists.map((pl) => (
              <Link
                key={pl.id}
                to={`/playlists/${pl.id}`}
                className="flex items-center gap-4 px-3 py-3 rounded-card
                           hover:bg-sp-hover transition-colors duration-150 group"
              >
                <div className="w-16 h-16 rounded-card bg-sp-hover shrink-0
                                flex items-center justify-center
                                group-hover:bg-sp-border transition-colors duration-150">
                  <MusicIcon />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base truncate group-hover:text-sp-green
                                transition-colors duration-150">
                    {pl.title}
                  </p>
                  <p className="text-sp-gray text-sm mt-0.5">
                    {pl.songCount ?? 0} bài hát
                  </p>
                </div>

                <svg viewBox="0 0 24 24" fill="currentColor"
                     className="w-5 h-5 text-sp-gray-dark opacity-0 group-hover:opacity-100
                                transition-opacity duration-150 shrink-0">
                  <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5z" clipRule="evenodd" />
                </svg>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && playlists.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3 text-center">
            <div className="w-20 h-20 rounded-full bg-sp-hover flex items-center justify-center">
              <MusicIcon />
            </div>
            <p className="text-white font-bold text-lg">Tạo playlist đầu tiên của bạn</p>
            <p className="text-sp-gray text-sm">Rất dễ dàng, chúng tôi sẽ giúp bạn.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
              Tạo playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
