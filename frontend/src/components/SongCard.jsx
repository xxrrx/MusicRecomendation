import { Link } from 'react-router-dom';
import { usePlayerStore } from '../stores/playerStore';
import LikeButton from './LikeButton';
import AddToPlaylistMenu from './AddToPlaylistMenu';

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * SongCard
 * ────────
 * A single row in a song list. Clicking plays the song (or the full queue
 * at that index). Active song is highlighted with the green accent colour.
 *
 * Props:
 *   song       — { id, title, duration, coverUrl, artist: { id, displayName } }
 *   rank       — optional number (shown as prefix in chart views)
 *   queue      — optional Song[] — full list for queue playback
 *   queueIndex — optional number — index of this song within queue
 */
export default function SongCard({ song, rank, queue, queueIndex }) {
  const { playSong, playQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();

  const isActive = currentSong?.id === song.id;

  function handleClick() {
    if (isActive) togglePlay();
    else if (queue) playQueue(queue, queueIndex ?? 0);
    else playSong(song);
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-card cursor-pointer group
                  transition-colors duration-150
                  ${isActive ? 'bg-sp-hover' : 'hover:bg-sp-hover/60'}`}
    >
      {/* Rank number (charts view) */}
      {rank != null && (
        <span className={`w-5 text-right text-sm shrink-0 tabular-nums
                          ${isActive ? 'text-sp-green' : 'text-sp-gray-dark'}`}>
          {rank}
        </span>
      )}

      {/* Cover / playing indicator overlay */}
      <div className="relative shrink-0">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={song.title}
            className={`w-10 h-10 rounded-lg object-cover transition-opacity duration-150
                        ${isActive ? 'brightness-75' : 'group-hover:brightness-90'}`}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-sp-hover flex items-center justify-center">
            <span className="text-sp-gray text-base">♪</span>
          </div>
        )}

        {/* Overlay: animated bars when playing, play icon on hover */}
        {isActive && isPlaying ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="playing-bars">
              <span className="w-[3px] bg-sp-green rounded-full" />
              <span className="w-[3px] bg-sp-green rounded-full" />
              <span className="w-[3px] bg-sp-green rounded-full" />
            </div>
          </div>
        ) : (
          /* Show a subtle play chevron on hover when not the active song */
          !isActive && (
            <div className="absolute inset-0 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 drop-shadow">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            </div>
          )
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-sp-green' : 'text-white'}`}>
          {song.title}
        </p>
        {song.artist && (
          <Link
            to={`/artists/${song.artist.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sp-gray text-xs truncate hover:text-white hover:underline
                       transition-colors duration-150 block"
          >
            {song.artist.displayName}
          </Link>
        )}
      </div>

      {/* Like + playlist (stop click propagation so they don't start playback) */}
      <div
        className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100
                   transition-opacity duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <LikeButton songId={song.id} size="sm" />
        <AddToPlaylistMenu songId={song.id} song={song} />
      </div>

      {/* Play count */}
      {song.playCount != null && (
        <span className="shrink-0 w-16 text-right text-xs tabular-nums text-sp-gray hidden sm:block">
          {song.playCount.toLocaleString()}
        </span>
      )}

      {/* Duration */}
      <span className="shrink-0 w-10 text-right text-xs tabular-nums text-sp-gray">
        {fmt(song.duration)}
      </span>
    </div>
  );
}
