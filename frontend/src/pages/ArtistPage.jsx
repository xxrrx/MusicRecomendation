import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchArtist } from '../lib/musicApi';
import SongCard from '../components/SongCard';
import FollowButton from '../components/FollowButton';

export default function ArtistPage() {
  const { id } = useParams();

  const { data: artist, isLoading, isError } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => fetchArtist(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (isError || !artist) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Artist not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="bg-gray-900 px-6 py-10">
        <div className="max-w-4xl mx-auto flex items-end gap-6">
          {artist.avatarUrl ? (
            <img
              src={artist.avatarUrl}
              alt={artist.displayName}
              className="w-32 h-32 rounded-full object-cover shadow-xl"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
              <span className="text-5xl">🎤</span>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Artist</p>
            <h1 className="text-3xl font-bold">{artist.displayName}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {artist.followerCount.toLocaleString()} followers
              {' · '}
              {artist.totalPlayCount.toLocaleString()} plays
            </p>
            <div className="mt-3">
              <FollowButton artistId={artist.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* Bio */}
        {artist.bio && (
          <section>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{artist.bio}</p>
          </section>
        )}

        {/* Popular songs */}
        {artist.songs.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Popular</h2>
            <div className="space-y-1">
              {artist.songs.map((song, i) => (
                <SongCard key={song.id} song={song} rank={i + 1} queue={artist.songs} queueIndex={i} />
              ))}
            </div>
          </section>
        )}

        {/* Albums */}
        {artist.albums.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {artist.albums.map((album) => (
                <Link
                  key={album.id}
                  to={`/albums/${album.id}`}
                  className="group rounded-xl p-3 hover:bg-gray-800 transition"
                >
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full aspect-square rounded-lg object-cover mb-3"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-gray-700 flex items-center justify-center mb-3">
                      <span className="text-4xl">💿</span>
                    </div>
                  )}
                  <p className="text-white text-sm font-medium truncate">{album.title}</p>
                  {album.year && (
                    <p className="text-gray-400 text-xs mt-0.5">{album.year}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
