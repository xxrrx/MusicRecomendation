function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Props:
 *   song  — { id, title, duration, coverUrl, artist: { id, displayName }, album }
 *   rank  — optional number shown as prefix (for charts)
 */
export default function SongCard({ song, rank }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800 transition group">
      {rank != null && (
        <span className="w-5 text-right text-sm text-gray-500 shrink-0">{rank}</span>
      )}

      {song.coverUrl ? (
        <img
          src={song.coverUrl}
          alt={song.title}
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
          <span className="text-gray-400 text-xl">♪</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{song.title}</p>
        <p className="text-gray-400 text-sm truncate">{song.artist?.displayName}</p>
      </div>

      <span className="text-gray-500 text-sm shrink-0 tabular-nums">
        {formatDuration(song.duration)}
      </span>
    </div>
  );
}
