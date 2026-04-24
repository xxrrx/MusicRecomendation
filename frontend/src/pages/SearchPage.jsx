import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchAll } from '../lib/searchApi';
import SongCard from '../components/SongCard';

const TYPES = [
  { value: 'all',     label: 'All' },
  { value: 'songs',   label: 'Songs' },
  { value: 'artists', label: 'Artists' },
  { value: 'albums',  label: 'Albums' },
];

/* ── Icons ───────────────────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5zM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5z" clipRule="evenodd" />
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-sp-gray">
    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5z" />
  </svg>
);

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-card-lg bg-sp-card p-3 animate-pulse space-y-3">
      <div className="w-full aspect-square rounded-card bg-sp-hover" />
      <div className="h-3 bg-sp-hover rounded w-3/4" />
      <div className="h-3 bg-sp-hover rounded w-1/2" />
    </div>
  );
}

/* ── Artist card (inline, used only in search results) ────────────────────── */
function ArtistResult({ artist }) {
  return (
    <Link
      to={`/artists/${artist.id}`}
      className="flex flex-col items-center p-4 rounded-card-lg bg-sp-card
                 hover:bg-sp-hover transition-colors duration-150 text-center group"
    >
      {artist.avatarUrl ? (
        <img
          src={artist.avatarUrl}
          alt={artist.displayName}
          className="w-20 h-20 rounded-full object-cover mb-3
                     group-hover:scale-105 transition-transform duration-150"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-sp-hover mb-3
                        flex items-center justify-center
                        group-hover:scale-105 transition-transform duration-150">
          <MicIcon />
        </div>
      )}
      <p className="text-white font-semibold text-sm truncate w-full">{artist.displayName}</p>
      {artist.followerCount != null && (
        <p className="text-sp-gray text-xs mt-0.5">
          {artist.followerCount.toLocaleString()} followers
        </p>
      )}
    </Link>
  );
}

/* ── Album card ───────────────────────────────────────────────────────────── */
function AlbumResult({ album }) {
  return (
    <Link
      to={`/albums/${album.id}`}
      className="rounded-card-lg bg-sp-card hover:bg-sp-hover
                 transition-colors duration-150 overflow-hidden group"
    >
      {album.coverUrl ? (
        <img
          src={album.coverUrl}
          alt={album.title}
          className="w-full aspect-square object-cover
                     group-hover:brightness-90 transition-all duration-150"
        />
      ) : (
        <div className="w-full aspect-square bg-sp-hover flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-sp-gray">
            <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
          </svg>
        </div>
      )}
      <div className="p-3">
        <p className="text-white font-semibold text-sm truncate">{album.title}</p>
        {album.artist && (
          <p className="text-sp-gray text-xs mt-0.5 truncate">{album.artist.displayName}</p>
        )}
        {album.year && <p className="text-sp-gray-dark text-xs mt-0.5">{album.year}</p>}
      </div>
    </Link>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function SearchPage() {
  const [query, setQuery]  = useState('');
  const [type, setType]    = useState('all');
  const hasQuery = query.trim().length > 0;

  const { data, isFetching } = useQuery({
    queryKey: ['search', query, type],
    queryFn: () => searchAll({ q: query, type }),
    enabled: hasQuery,
    staleTime: 30_000,
  });

  const songs   = data?.songs   ?? [];
  const artists = data?.artists ?? [];
  const albums  = data?.albums  ?? [];
  const hasResults = songs.length > 0 || artists.length > 0 || albums.length > 0;

  return (
    <div className="min-h-full px-8 py-6">

      {/* ── Page title ──────────────────────────────────────────────────── */}
      <h1 className="text-3xl font-extrabold text-white tracking-tight mb-5">Tìm kiếm</h1>

      {/* ── Search input ────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-sp-gray">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bạn muốn nghe gì?"
          data-testid="search-input"
          className="w-full bg-white text-black rounded-pill pl-12 pr-5 py-3.5
                     text-base font-medium placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-sp-green
                     transition-all duration-150"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-4 flex items-center text-gray-400
                       hover:text-gray-700 transition-colors duration-150"
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Filter chips ────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-5 py-2 rounded-pill text-sm font-semibold transition-all duration-150
                        ${type === t.value
                          ? 'bg-white text-black'
                          : 'bg-sp-hover text-sp-gray hover:bg-sp-border hover:text-white'
                        }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isFetching && (
        <div className="space-y-6">
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-sp-hover shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-sp-hover rounded w-2/5" />
                  <div className="h-3 bg-sp-hover rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {/* ── No results ──────────────────────────────────────────────────── */}
      {!isFetching && hasQuery && !hasResults && (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <div className="w-20 h-20 rounded-full bg-sp-hover flex items-center justify-center">
            <SearchIcon />
          </div>
          <p className="text-white font-bold text-lg">Không tìm thấy kết quả cho</p>
          <p className="text-sp-gray">"{query}"</p>
          <p className="text-sp-gray-dark text-sm mt-1">Thử kiểm tra chính tả hoặc từ khóa khác.</p>
        </div>
      )}

      {/* ── Browse prompt (no query yet) ────────────────────────────────── */}
      {!hasQuery && (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <div className="w-20 h-20 rounded-full bg-sp-hover flex items-center justify-center">
            <SearchIcon />
          </div>
          <p className="text-white font-bold text-lg">Bắt đầu tìm kiếm</p>
          <p className="text-sp-gray text-sm">Tìm bài hát, nghệ sĩ và album.</p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {!isFetching && hasResults && (
        <div className="space-y-8">

          {songs.length > 0 && (
            <section data-testid="songs-section">
              <h2 className="text-xl font-bold text-white mb-3">Bài hát</h2>
              <div className="space-y-0.5">
                {songs.map((song, idx) => (
                  <SongCard key={song.id} song={song} queue={songs} queueIndex={idx} />
                ))}
              </div>
            </section>
          )}

          {artists.length > 0 && (
            <section data-testid="artists-section">
              <h2 className="text-xl font-bold text-white mb-3">Nghệ sĩ</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {artists.map((artist) => (
                  <ArtistResult key={artist.id} artist={artist} />
                ))}
              </div>
            </section>
          )}

          {albums.length > 0 && (
            <section data-testid="albums-section">
              <h2 className="text-xl font-bold text-white mb-3">Album</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                  <AlbumResult key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
