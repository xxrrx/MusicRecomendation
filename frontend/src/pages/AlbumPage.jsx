import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAlbum } from '../lib/musicApi';
import SongCard from '../components/SongCard';

export default function AlbumPage() {
  const { id } = useParams();

  const { data: album, isLoading, isError } = useQuery({
    queryKey: ['album', id],
    queryFn: () => fetchAlbum(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (isError || !album) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Album not found.</p>
      </div>
    );
  }

  const totalDuration = album.songs.reduce((sum, s) => sum + s.duration, 0);
  const totalMin = Math.floor(totalDuration / 60);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-10">
        <div className="max-w-4xl mx-auto flex items-end gap-6">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={album.title}
              className="w-40 h-40 rounded-xl object-cover shadow-xl shrink-0"
            />
          ) : (
            <div className="w-40 h-40 rounded-xl bg-gray-700 flex items-center justify-center shrink-0">
              <span className="text-6xl">💿</span>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Album</p>
            <h1 className="text-3xl font-bold">{album.title}</h1>
            <Link
              to={`/artists/${album.artist.id}`}
              className="text-purple-400 hover:underline text-sm mt-1 inline-block"
            >
              {album.artist.displayName}
            </Link>
            <p className="text-gray-400 text-xs mt-1">
              {album.year && `${album.year} · `}
              {album.songs.length} songs · {totalMin} min
            </p>
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-1">
          {album.songs.map((song, i) => (
            <SongCard key={song.id} song={song} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
