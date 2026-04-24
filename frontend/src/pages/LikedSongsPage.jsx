import { useQuery } from '@tanstack/react-query';
import { getLikedSongs } from '../lib/playlistApi';
import SongCard from '../components/SongCard';

/* ── Loading skeleton row ─────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 animate-pulse">
      <div className="w-4 h-4 rounded bg-sp-hover shrink-0" />
      <div className="w-10 h-10 rounded-lg bg-sp-hover shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-sp-hover rounded w-1/2" />
        <div className="h-3 bg-sp-hover rounded w-1/3" />
      </div>
    </div>
  );
}

export default function LikedSongsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['liked-songs'],
    queryFn: () => getLikedSongs(),
  });

  const songs = data?.songs ?? [];
  const total = data?.pagination?.total ?? songs.length;

  return (
    <div className="min-h-full">
      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#4b3baf] via-[#2a1f6b] to-sp-dark px-8 pt-12 pb-8">
        <div className="flex items-end gap-6">
          <div className="w-44 h-44 rounded-card-lg shrink-0 shadow-modal
                          bg-gradient-to-br from-[#4b3baf] to-[#9b6dff]
                          flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-20 h-20 opacity-90">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" />
            </svg>
          </div>
          <div className="pb-1">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Playlist</p>
            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">Bài hát đã thích</h1>
            <p className="text-white/60 text-sm">{total} bài hát</p>
          </div>
        </div>
      </div>

      {/* ── Content area ────────────────────────────────────────────────── */}
      <div className="px-8 py-4">
        {!isLoading && songs.length > 0 && (
          <div className="border-b border-sp-border mb-2" />
        )}

        {isLoading && (
          <div className="space-y-1 mt-2">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-sp-gray-dark">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 1.998-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.502-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-white font-semibold">Không thể tải bài hát đã thích</p>
            <p className="text-sp-gray text-sm">Vui lòng thử lại sau.</p>
          </div>
        )}

        {!isLoading && songs.length > 0 && (
          <div className="space-y-0.5">
            {songs.map((song, i) => (
              <SongCard key={song.id} song={song} rank={i + 1} queue={songs} queueIndex={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && songs.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3 text-center">
            <div className="w-20 h-20 rounded-full bg-sp-hover flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-sp-gray">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg">Bài hát bạn thích sẽ xuất hiện ở đây</p>
            <p className="text-sp-gray text-sm">Nhấn biểu tượng trái tim trên bài hát để lưu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
