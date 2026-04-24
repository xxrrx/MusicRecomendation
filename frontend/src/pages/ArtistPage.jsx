import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchArtist } from '../lib/musicApi';
import SongCard from '../components/SongCard';
import FollowButton from '../components/FollowButton';

export default function ArtistPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: artist, isLoading, isError } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => fetchArtist(id),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !artist) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/50">Không tìm thấy nghệ sĩ.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full text-white">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Blurred backdrop */}
        {artist.avatarUrl && (
          <img
            src={artist.avatarUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-20 pointer-events-none"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 via-transparent to-[#07070f]" />

        <div className="relative z-10 px-8 pt-16 pb-10 flex items-end gap-7">
          {artist.avatarUrl ? (
            <img
              src={artist.avatarUrl}
              alt={artist.displayName}
              className="w-40 h-40 rounded-full object-cover shadow-2xl ring-4 ring-white/10 shrink-0"
            />
          ) : (
            <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center shrink-0 ring-4 ring-white/10">
              <span className="text-6xl">🎤</span>
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Nghệ sĩ</p>
            <h1 className="text-5xl font-extrabold leading-none truncate">{artist.displayName}</h1>
            <p className="text-white/50 text-sm mt-3">
              <span className="text-white font-semibold">{artist.followerCount.toLocaleString()}</span> người theo dõi
              <span className="mx-2 text-white/30">·</span>
              <span className="text-white font-semibold">{artist.totalPlayCount.toLocaleString()}</span> lượt nghe
            </p>
            <div className="mt-5 flex items-center gap-3">
              <FollowButton artistId={artist.id} />
              <button
                onClick={() => navigate(`/donate/${artist.id}`)}
                className="px-5 py-2 bg-transparent border border-white/40 hover:border-white text-white text-sm font-bold rounded-full transition"
              >
                Ủng hộ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-8 py-6 space-y-10">
        {artist.bio && (
          <section>
            <h2 className="text-xl font-bold mb-3">Giới thiệu</h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-2xl">{artist.bio}</p>
          </section>
        )}

        {artist.songs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-3">Phổ biến</h2>
            <div className="space-y-1">
              {artist.songs.map((song, i) => (
                <SongCard key={song.id} song={song} rank={i + 1} queue={artist.songs} queueIndex={i} />
              ))}
            </div>
          </section>
        )}

        {artist.albums.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Album</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {artist.albums.map((album) => (
                <Link
                  key={album.id}
                  to={`/albums/${album.id}`}
                  className="group bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-colors duration-150"
                >
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full aspect-square rounded-lg object-cover mb-3 shadow-lg"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-white/10 flex items-center justify-center mb-3">
                      <span className="text-4xl">💿</span>
                    </div>
                  )}
                  <p className="text-white text-sm font-semibold truncate">{album.title}</p>
                  {album.year && (
                    <p className="text-white/40 text-xs mt-1">{album.year}</p>
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
