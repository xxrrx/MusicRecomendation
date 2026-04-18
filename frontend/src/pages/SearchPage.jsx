import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchAll } from '../lib/searchApi';
import SongCard from '../components/SongCard';

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'songs', label: 'Songs' },
  { value: 'artists', label: 'Artists' },
  { value: 'albums', label: 'Albums' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  const { data, isFetching } = useQuery({
    queryKey: ['search', query, type],
    queryFn: () => searchAll({ q: query, type }),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });

  const songs = data?.songs ?? [];
  const artists = data?.artists ?? [];
  const albums = data?.albums ?? [];
  const hasResults = songs.length > 0 || artists.length > 0 || albums.length > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Search</h1>

      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search songs, artists, albums..."
        className="w-full bg-gray-800 text-white rounded-xl px-5 py-3 text-lg outline-none focus:ring-2 focus:ring-green-500 mb-4"
        data-testid="search-input"
      />

      {/* Type filter */}
      <div className="flex gap-2 mb-8">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              type === t.value
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isFetching && (
        <p className="text-gray-400 text-center py-8">Searching...</p>
      )}

      {/* Empty state */}
      {!isFetching && query.trim().length > 0 && !hasResults && (
        <p className="text-gray-500 text-center py-8">No results for "{query}"</p>
      )}

      {/* Songs */}
      {songs.length > 0 && (
        <section className="mb-8" data-testid="songs-section">
          <h2 className="text-xl font-semibold text-white mb-3">Songs</h2>
          <div className="space-y-1">
            {songs.map((song, idx) => (
              <SongCard key={song.id} song={song} queue={songs} queueIndex={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Artists */}
      {artists.length > 0 && (
        <section className="mb-8" data-testid="artists-section">
          <h2 className="text-xl font-semibold text-white mb-3">Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artists/${artist.id}`}
                className="flex flex-col items-center p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-center"
              >
                {artist.avatarUrl ? (
                  <img
                    src={artist.avatarUrl}
                    alt={artist.displayName}
                    className="w-20 h-20 rounded-full object-cover mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center mb-3">
                    <span className="text-3xl text-gray-400">♪</span>
                  </div>
                )}
                <p className="text-white font-medium truncate w-full">{artist.displayName}</p>
                <p className="text-gray-400 text-sm">{artist.followerCount} followers</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <section className="mb-8" data-testid="albums-section">
          <h2 className="text-xl font-semibold text-white mb-3">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/albums/${album.id}`}
                className="group rounded-xl bg-gray-800 hover:bg-gray-700 transition overflow-hidden"
              >
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-700 flex items-center justify-center">
                    <span className="text-4xl text-gray-500">♫</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-white font-medium truncate">{album.title}</p>
                  {album.artist && (
                    <p className="text-gray-400 text-sm truncate">{album.artist.displayName}</p>
                  )}
                  {album.year && <p className="text-gray-500 text-xs">{album.year}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
