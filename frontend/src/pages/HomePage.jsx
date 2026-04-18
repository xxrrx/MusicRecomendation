import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { fetchSongs } from '../lib/musicApi';
import { getFollowing } from '../lib/socialApi';
import SongCard from '../components/SongCard';
import ArtistCard from '../components/ArtistCard';

const quickLinks = [
  {
    to: '/liked',
    icon: '❤️',
    label: 'Liked Songs',
    desc: 'Songs you have liked',
    color: 'from-pink-600 to-rose-700',
  },
  {
    to: '/playlists',
    icon: '📋',
    label: 'Your Playlists',
    desc: 'Collections you created',
    color: 'from-indigo-600 to-blue-700',
  },
  {
    to: '/following',
    icon: '👥',
    label: 'Following',
    desc: 'Artists you follow',
    color: 'from-emerald-600 to-teal-700',
  },
];

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

  const songs = songsData?.data ?? [];
  const followedArtists = followingData?.artists ?? [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          {greeting()}{user?.name ? `, ${user.name}` : ''} 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">What do you want to listen to today?</p>
      </div>

      {/* Quick links */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map(({ to, icon, label, desc, color }) => (
            <Link
              key={to}
              to={to}
              className={`bg-gradient-to-br ${color} rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition`}
            >
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="text-white font-semibold">{label}</p>
                <p className="text-white/70 text-xs">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Artists you follow */}
      {followedArtists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Artists You Follow</h2>
            <Link to="/following" className="text-sm text-gray-400 hover:text-white transition">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {followedArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>
      )}

      {/* New songs */}
      {songs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">New Songs</h2>
          <div className="space-y-1">
            {songs.map((song, i) => (
              <SongCard key={song.id} song={song} queue={songs} queueIndex={i} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {songs.length === 0 && followedArtists.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎵</p>
          <p className="text-white font-semibold text-lg">Nothing here yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Start exploring music and follow artists you love.
          </p>
        </div>
      )}
    </div>
  );
}
