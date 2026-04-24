import { usePlayerStore } from '../../stores/playerStore';
import { Link } from 'react-router-dom';
import LikeButton from '../LikeButton';
import AddToPlaylistMenu from '../AddToPlaylistMenu';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';

/* ── Repeat icon ─────────────────────────────────────────────────────────── */
const RepeatIcon = ({ mode }) =>
  mode === 'one' ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12 5.25a.75.75 0 0 1 .75.75v.756a49.106 49.106 0 0 1 9.152 1 .75.75 0 0 1-.152 1.485h-1.918l1.95 8.425a.75.75 0 0 1-.617.91 48.97 48.97 0 0 1-8.43 0 .75.75 0 0 1-.617-.91l1.95-8.425H12.75V6a.75.75 0 0 1 .75-.75zm-4.813.212a.75.75 0 0 1 1.06.013l2.5 2.5a.75.75 0 0 1-1.06 1.06L8.59 7.818 7.38 9.03a.75.75 0 0 1-1.06-1.06l1.5-1.5a.75.75 0 0 1 .367-.008zM12 12.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918z" clipRule="evenodd" />
    </svg>
  );

/* ── Chevron-down (close) ────────────────────────────────────────────────── */
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5z" clipRule="evenodd" />
  </svg>
);

/**
 * FullscreenPlayer
 * ────────────────
 * Full-viewport overlay that shows the current song with large artwork,
 * controls, and progress bar. Opens from the PlayerBar.
 *
 * Props:
 *   progress — number (seconds)
 *   duration — number (seconds)
 *   onSeek   — (seconds) => void
 *   onClose  — () => void
 */
export default function FullscreenPlayer({ progress, duration, onSeek, onClose }) {
  const {
    currentSong, queue, queueIndex, isPlaying, volume, repeat,
    togglePlay, nextSong, prevSong, setVolume, cycleRepeat,
  } = usePlayerStore();

  if (!currentSong) return null;

  const repeatActive = repeat !== 'off';

  return (
    /* Full-screen backdrop: blurred dark overlay */
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center
                    bg-black/90 backdrop-blur-2xl animate-fadeIn">

      {/* Close button (top-left) */}
      <button
        onClick={onClose}
        aria-label="Close fullscreen"
        className="absolute top-6 left-6 btn-icon p-2 rounded-full hover:bg-sp-hover transition"
      >
        <ChevronDown />
      </button>

      {/* ── Cover art ─────────────────────────────────────────────────────── */}
      <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-card-lg overflow-hidden
                      shadow-modal mb-8 transition-transform duration-300 hover:scale-[1.01]">
        {currentSong.coverUrl ? (
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-sp-hover flex items-center justify-center">
            <span className="text-7xl text-sp-gray">♪</span>
          </div>
        )}
      </div>

      {/* ── Song info + like / playlist actions ──────────────────────────── */}
      <div className="flex items-center justify-between w-full max-w-sm px-6 mb-6">
        <div className="min-w-0 flex-1">
          <p className="text-white text-xl font-bold truncate">{currentSong.title}</p>
          {currentSong.artist && (
            <Link
              to={`/artists/${currentSong.artist.id}`}
              onClick={onClose}
              className="text-sp-gray hover:text-white hover:underline transition-colors duration-150 text-sm"
            >
              {currentSong.artist.displayName}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          <LikeButton songId={currentSong.id} size="md" />
          <AddToPlaylistMenu songId={currentSong.id} song={currentSong} />
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-sm px-6 mb-6">
        <ProgressBar current={progress} duration={duration} onSeek={onSeek} />
      </div>

      {/* ── Playback controls ────────────────────────────────────────────── */}
      <div className="flex items-center gap-7 mb-8">
        {/* Repeat */}
        <button
          onClick={cycleRepeat}
          title={`Repeat: ${repeat}`}
          aria-label="Cycle repeat mode"
          className={`btn-icon relative ${repeatActive ? 'text-sp-green' : ''}`}
        >
          <RepeatIcon mode={repeat} />
          {repeatActive && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sp-green" />
          )}
        </button>

        <PlayerControls
          isPlaying={isPlaying}
          hasPrev={queueIndex > 0}
          hasNext={queueIndex < queue.length - 1}
          onToggle={togglePlay}
          onPrev={prevSong}
          onNext={nextSong}
        />

        {/* Symmetry spacer */}
        <div className="w-5 h-5" />
      </div>

      {/* ── Volume ───────────────────────────────────────────────────────── */}
      <div className="w-full max-w-xs px-6">
        <VolumeControl volume={volume} onChange={setVolume} />
      </div>
    </div>
  );
}
