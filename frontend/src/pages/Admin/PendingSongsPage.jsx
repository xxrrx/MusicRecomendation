import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingSongs, reviewSong, adminDeleteSong } from '../../lib/adminApi';
import Pagination from '../../components/Pagination';

export default function PendingSongsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-songs', page],
    queryFn: () => getPendingSongs({ page, limit: 10 }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, reason }) => reviewSong(id, { action, reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pending-songs'] }); setRejectingId(null); setReason(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteSong(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pending-songs'] }),
  });

  const songs = data?.songs || [];
  const total = data?.pagination?.total ?? 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 shrink-0 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Duyệt bài hát</h1>
        <p className="text-sp-gray text-sm mt-1">
          {total} bài hát đang chờ duyệt
        </p>
      </div>

      </div>{/* end shrink-0 header */}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 min-h-0 max-w-4xl mx-auto w-full">

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-sp-card rounded-card p-5 animate-pulse flex gap-4">
              <div className="w-16 h-16 rounded-card bg-sp-hover shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-sp-hover rounded w-1/3" />
                <div className="h-3 bg-sp-hover rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All clear */}
      {!isLoading && songs.length === 0 && (
        <div data-testid="no-pending"
             className="bg-sp-card rounded-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-400">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-white font-bold text-lg">Tất cả đã được duyệt!</p>
          <p className="text-sp-gray text-sm mt-1">Không có bài hát nào chờ duyệt.</p>
        </div>
      )}

      {/* Song list */}
      {!isLoading && songs.length > 0 && (
        <ul className="space-y-3" data-testid="pending-songs-list">
          {songs.map((song) => (
            <li key={song.id} data-testid={`pending-song-${song.id}`}
                className="bg-sp-card rounded-card p-5 hover:bg-sp-hover/50 transition-colors duration-150">
              <div className="flex gap-4">
                {/* Cover */}
                <div className="w-16 h-16 rounded-card bg-sp-hover flex items-center justify-center shrink-0 overflow-hidden">
                  {song.coverUrl ? (
                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-sp-gray">
                      <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base truncate">{song.title}</p>
                  <p className="text-sp-gray text-sm mt-0.5">
                    by <span className="text-white">{song.artist?.user?.displayName}</span>
                    {song.genre && <span className="text-sp-gray-dark"> · {song.genre.name}</span>}
                    {song.album && <span className="text-sp-gray-dark"> · {song.album.title}</span>}
                  </p>
                  <p className="text-sp-gray-dark text-xs mt-1">
                    Upload lúc {new Date(song.uploadedAt).toLocaleString('vi-VN')}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    data-testid={`approve-${song.id}`}
                    onClick={() => reviewMutation.mutate({ id: song.id, action: 'approved' })}
                    disabled={reviewMutation.isPending}
                    className="flex items-center gap-1.5 bg-sp-green hover:bg-sp-green-light text-black
                               font-semibold px-4 py-2 rounded-pill text-sm transition-all duration-150
                               disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207z" clipRule="evenodd" />
                    </svg>
                    Duyệt
                  </button>
                  <button
                    data-testid={`reject-btn-${song.id}`}
                    onClick={() => { setRejectingId(rejectingId === song.id ? null : song.id); setReason(''); }}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white
                               font-semibold px-4 py-2 rounded-pill text-sm transition-all duration-150
                               hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
                    </svg>
                    Từ chối
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(song.id)}
                    disabled={deleteMutation.isPending}
                    className="text-sp-gray-dark hover:text-red-400 text-xs text-center
                               transition-colors duration-150 disabled:opacity-50 py-1"
                  >
                    Xóa vĩnh viễn
                  </button>
                </div>
              </div>

              {/* Rejection reason form */}
              {rejectingId === song.id && (
                <div className="mt-4 flex gap-2 animate-fadeIn" data-testid={`reject-form-${song.id}`}>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Lý do từ chối…"
                    data-testid={`reject-reason-${song.id}`}
                    className="sp-input text-sm flex-1 border-red-500/40 focus:border-red-500"
                    autoFocus
                  />
                  <button
                    data-testid={`confirm-reject-${song.id}`}
                    onClick={() => reviewMutation.mutate({ id: song.id, action: 'rejected', reason })}
                    disabled={!reason.trim() || reviewMutation.isPending}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white
                               px-5 py-2.5 rounded-card text-sm font-semibold transition-all duration-150
                               hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      </div>{/* end scroll area */}

      <Pagination pagination={data?.pagination} onPageChange={setPage} label="bài hát chờ duyệt" />
    </div>
  );
}
