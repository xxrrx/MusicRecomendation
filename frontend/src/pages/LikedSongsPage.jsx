import { useQuery } from '@tanstack/react-query';
import { getLikedSongs } from '../lib/playlistApi';
import SongCard from '../components/SongCard';

export default function LikedSongsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['liked-songs'],
    queryFn: () => getLikedSongs(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Failed to load liked songs.</p>
      </div>
    );
  }

  const songs = data?.songs ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shrink-0">
          <span className="text-3xl">♥</span>
        </div>
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wider">Playlist</p>
          <h1 className="text-3xl font-bold">Liked Songs</h1>
          <p className="text-gray-400 mt-1">{data?.pagination?.total ?? songs.length} songs</p>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No liked songs yet.</p>
          <p className="text-sm mt-1">Click the heart on any song to save it here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {songs.map((song, i) => (
            <SongCard key={song.id} song={song} rank={i + 1} queue={songs} queueIndex={i} />
          ))}
        </div>
      )}
    </div>
  );
}
