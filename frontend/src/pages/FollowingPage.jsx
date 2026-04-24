import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getFollowing } from '../lib/socialApi';
import FollowButton from '../components/FollowButton';

/* ── Skeleton row ────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-3 py-2.5 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-sp-hover shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-sp-hover rounded w-2/5" />
        <div className="h-3 bg-sp-hover rounded w-1/4" />
      </div>
      <div className="w-20 h-8 rounded-pill bg-sp-hover shrink-0" />
    </div>
  );
}

/* ── Mic icon for avatar placeholder ─────────────────────────────────────── */
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-sp-gray">
    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5z" />
  </svg>
);

export default function FollowingPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['following-list'],
    queryFn: () => getFollowing(),
  });

  const artists = data?.artists ?? [];

  return (
    <div className="min-h-full">
      {/* ── Header banner ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#1a4a8a] via-[#0f2a52] to-sp-dark px-8 pt-12 pb-8">
        <div className="flex items-end gap-6">
          <div className="w-44 h-44 rounded-card-lg shrink-0 shadow-modal
                          bg-gradient-to-br from-[#1a4a8a] to-[#4b9ee0]
                          flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-20 h-20 opacity-90">
              <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003z" />
            </svg>
          </div>
          <div className="pb-1">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Thư viện</p>
            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">Đang theo dõi</h1>
            <p className="text-white/60 text-sm">{artists.length} nghệ sĩ</p>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-8 py-4">
        {isLoading && (
          <div className="space-y-1 mt-2">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-sp-gray-dark">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 1.998-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.502-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-white font-semibold">Không thể tải danh sách theo dõi</p>
          </div>
        )}

        {!isLoading && artists.length > 0 && (
          <div className="space-y-0.5">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="flex items-center gap-4 px-3 py-3 rounded-card
                           hover:bg-sp-hover transition-colors duration-150 group"
              >
                <Link to={`/artists/${artist.id}`} className="shrink-0">
                  {artist.avatarUrl ? (
                    <img
                      src={artist.avatarUrl}
                      alt={artist.displayName}
                      className="w-16 h-16 rounded-full object-cover
                                 group-hover:brightness-90 transition-all duration-150"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-sp-hover
                                    flex items-center justify-center
                                    group-hover:bg-sp-border transition-colors duration-150">
                      <MicIcon />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/artists/${artist.id}`}
                    className="text-white font-semibold text-base truncate block
                               hover:text-sp-green transition-colors duration-150"
                  >
                    {artist.displayName}
                  </Link>
                  <p className="text-sp-gray text-sm mt-0.5">
                    {artist.followerCount?.toLocaleString()} người theo dõi
                  </p>
                </div>

                <div className="shrink-0">
                  <FollowButton artistId={artist.id} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && artists.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3 text-center">
            <div className="w-20 h-20 rounded-full bg-sp-hover flex items-center justify-center">
              <MicIcon />
            </div>
            <p className="text-white font-bold text-lg">Bạn chưa theo dõi ai</p>
            <p className="text-sp-gray text-sm">Theo dõi nghệ sĩ yêu thích để xem ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
