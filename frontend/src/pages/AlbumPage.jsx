import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAlbum } from '../lib/musicApi';
import SongCard from '../components/SongCard';

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AlbumPage() {
  const { id } = useParams();

  const { data: album, isLoading, isError } = useQuery({
    queryKey: ['album', id],
    queryFn: () => fetchAlbum(id),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#121212]">
        <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !album) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#121212]">
        <p className="text-[#b3b3b3]">Không tìm thấy album.</p>
      </div>
    );
  }

  const totalDuration = album.songs.reduce((sum, s) => sum + s.duration, 0);
  const totalMin = Math.floor(totalDuration / 60);
  const totalSec = totalDuration % 60;

  return (
    <div className="min-h-full bg-[#121212] text-white">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {album.coverUrl && (
          <img
            src={album.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-25 pointer-events-none"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#121212]/60 to-[#121212]" />

        <div className="relative z-10 px-8 pt-16 pb-10 flex items-end gap-7">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={album.title}
              className="w-44 h-44 rounded-xl object-cover shadow-2xl shrink-0"
            />
          ) : (
            <div className="w-44 h-44 rounded-xl bg-[#282828] flex items-center justify-center shrink-0">
              <span className="text-7xl">💿</span>
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b3b3b3] mb-2">Album</p>
            <h1 className="text-4xl font-extrabold leading-tight">{album.title}</h1>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {album.artist.avatarUrl && (
                <img src={album.artist.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
              )}
              <Link
                to={`/artists/${album.artist.id}`}
                className="text-white font-semibold hover:underline"
              >
                {album.artist.displayName}
              </Link>
              {album.year && (
                <>
                  <span className="text-[#6a6a6a]">·</span>
                  <span className="text-[#b3b3b3]">{album.year}</span>
                </>
              )}
              <span className="text-[#6a6a6a]">·</span>
              <span className="text-[#b3b3b3]">{album.songs.length} bài</span>
              <span className="text-[#6a6a6a]">·</span>
              <span className="text-[#b3b3b3]">{totalMin} phút {totalSec} giây</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Track list ──────────────────────────────────────────────────── */}
      <div className="px-8 pb-8">
        {/* Table header */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-[#2a2a2a] mb-2 text-xs uppercase tracking-widest text-[#6a6a6a]">
          <span className="w-5 text-right">#</span>
          <span className="w-10 shrink-0" />
          <span className="flex-1">Tiêu đề</span>
          <span className="w-10 text-right">Thời lượng</span>
        </div>
        <div className="space-y-1">
          {album.songs.map((song, i) => (
            <SongCard key={song.id} song={song} rank={i + 1} queue={album.songs} queueIndex={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
