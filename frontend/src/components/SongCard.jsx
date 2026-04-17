import { usePlayerStore } from '../stores/playerStore';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Props:
 *   song     — { id, title, duration, coverUrl, artist: { id, displayName }, album }
 *   rank     — optional number shown as prefix (for charts)
 *   queue    — optional Song[] — if provided, clicking plays the whole list
 *   queueIndex — optional number — index of this song in queue
 */
export default function SongCard({ song, rank, queue, queueIndex }) {
  const { playSong, playQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();

  const isCurrentSong = currentSong?.id === song.id;

  function handleClick() {
    if (isCurrentSong) {
      togglePlay();
    } else if (queue) {
      playQueue(queue, queueIndex ?? 0);
    } else {
      playSong(song);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800 transition group cursor-pointer ${isCurrentSong ? 'bg-gray-800' : ''}`}
    >
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

      {isCurrentSong && isPlaying ? (
        <span className="text-green-400 text-xs shrink-0">▶</span>
      ) : (
        <span className="text-gray-500 text-sm shrink-0 tabular-nums">
          {formatDuration(song.duration)}
        </span>
      )}
    </div>
  );
}
