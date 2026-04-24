import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { fetchSongs } from '../lib/musicApi';
import { getFollowing } from '../lib/socialApi';
import { fetchRecommendations } from '../lib/recommendApi';
import SongCard from '../components/SongCard';
import ArtistCard from '../components/ArtistCard';

/* ── Quick-link card data ─────────────────────────────────────────────────── */
const quickLinks = [
  {
    to: '/liked',
    label: 'Liked Songs',
    sub: 'All your favourites',
    // Gradient: pink → purple (matches Spotify's Liked Songs colour)
    gradient: 'from-[#4b3baf] to-[#9b6dff]',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" />
      </svg>
    ),
  },
  {
    to: '/playlists',
    label: 'Your Playlists',
    sub: 'Collections you created',
    gradient: 'from-[#1a6b4a] to-[#1DB954]',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
        <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75zM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/following',
    label: 'Following',
    sub: 'Artists you follow',
    gradient: 'from-[#1a4a8a] to-[#4b9ee0]',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003z" />
      </svg>
    ),
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const { user } = useAuthStore();

  const { data: songsData } = useQuery({
    queryKey: ['songs', 'home'],
    queryFn: () => fetchSongs({ limit: 10 }),
  });

  const { data: followingData } = useQuery({
    queryKey: ['following', 'home'],
    queryFn: () => getFollowing(1, 8),
  });

  const { data: recommendedRaw, isLoading: loadingRecs } = useQuery({
    queryKey: ['recommendations', 'home'],
    queryFn: fetchRecommendations,
    staleTime: 1000 * 60 * 15, // 15 min — matches backend cache TTL
  });

  const songs = songsData?.data ?? [];
  const followedArtists = followingData?.artists ?? [];
  const recommended = (recommendedRaw ?? []).slice(0, 10);

  return (
    <div className="px-8 py-6 space-y-8">

      {/* ── Greeting header ─────────────────────────────────────────────── */}
      <header>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {greeting()}{user?.displayName ? `, ${user.displayName}` : ''}
        </h1>
        <p className="text-sp-gray mt-1 text-sm">Bạn muốn nghe gì hôm nay?</p>
      </header>

      {/* ── Quick links ─────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map(({ to, label, sub, gradient, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`bg-gradient-to-br ${gradient} rounded-card p-5
                          flex items-center gap-4
                          hover:brightness-110 hover:scale-[1.01]
                          active:scale-[0.99] transition-all duration-150
                          shadow-card`}
            >
              <div className="p-3 rounded-full bg-white/10 shrink-0">
                <Icon />
              </div>
              <div>
                <p className="text-white font-bold text-base">{label}</p>
                <p className="text-white/70 text-sm mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recommended For You ─────────────────────────────────────────── */}
      {(loadingRecs || recommended.length > 0) && (
        <section>
          <h2 className="text-xl font-bold text-white mb-3">Đề xuất cho bạn</h2>
          {loadingRecs ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-card bg-sp-hover animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {recommended.map((song, i) => (
                <SongCard key={song.id} song={song} rank={i + 1} queue={recommended} queueIndex={i} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Artists you follow ──────────────────────────────────────────── */}
      {followedArtists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Nghệ sĩ bạn theo dõi</h2>
            <Link
              to="/following"
              className="text-sm text-sp-gray hover:text-white transition-colors duration-150 font-semibold"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {followedArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>
      )}

      {/* ── New songs ───────────────────────────────────────────────────── */}
      {songs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-3">Bài hát mới</h2>
          <div className="space-y-0.5">
            {songs.map((song, i) => (
              <SongCard key={song.id} song={song} rank={i + 1} queue={songs} queueIndex={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {songs.length === 0 && followedArtists.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-full bg-sp-hover flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-sp-gray">
              <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
            </svg>
          </div>
          <p className="text-white font-bold text-lg">Chưa có gì ở đây</p>
          <p className="text-sp-gray text-sm mt-1">Khám phá âm nhạc và theo dõi nghệ sĩ yêu thích.</p>
          <Link to="/search" className="inline-block mt-5 btn-primary text-sm">
            Khám phá
          </Link>
        </div>
      )}

    </div>
  );
}
