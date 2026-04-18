import { usePlayerStore } from '../../stores/playerStore';
import { Link } from 'react-router-dom';
import LikeButton from '../LikeButton';
import AddToPlaylistMenu from '../AddToPlaylistMenu';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';

/**
 * Props:
 *   progress  — number (seconds)
 *   duration  — number (seconds)
 *   onSeek    — (seconds) => void
 *   onClose   — () => void
 */
export default function FullscreenPlayer({ progress, duration, onSeek, onClose }) {
  const {
    currentSong,
    queue,
    queueIndex,
    isPlaying,
    volume,
    repeat,
    togglePlay,
    nextSong,
    prevSong,
    setVolume,
    cycleRepeat,
  } = usePlayerStore();

  if (!currentSong) return null;

  const repeatLabel = { off: '↺', one: '1️⃣', all: '↺∞' };
  const repeatColor = repeat === 'off' ? 'text-gray-500' : 'text-green-400';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-gray-400 hover:text-white text-3xl leading-none transition"
        aria-label="Close fullscreen"
      >
        ∨
      </button>

      {/* Cover art */}
      <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-3xl overflow-hidden shadow-2xl mb-8">
        {currentSong.coverUrl ? (
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-8xl">♪</span>
          </div>
        )}
      </div>

      {/* Song info + actions */}
      <div className="flex items-center justify-between w-full max-w-md px-6 mb-6">
        <div className="min-w-0 flex-1">
          <p className="text-white text-xl font-bold truncate">{currentSong.title}</p>
          {currentSong.artist && (
            <Link
              to={`/artists/${currentSong.artist.id}`}
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:underline transition text-sm"
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

      {/* Progress */}
      <div className="w-full max-w-md px-6 mb-4">
        <ProgressBar current={progress} duration={duration} onSeek={onSeek} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-6">
        {/* Repeat */}
        <button
          onClick={cycleRepeat}
          className={`text-lg transition ${repeatColor}`}
          title={`Repeat: ${repeat}`}
          aria-label="Cycle repeat mode"
        >
          {repeat === 'one' ? '🔂' : '🔁'}
        </button>

        <PlayerControls
          isPlaying={isPlaying}
          hasPrev={queueIndex > 0}
          hasNext={queueIndex < queue.length - 1}
          onToggle={togglePlay}
          onPrev={prevSong}
          onNext={nextSong}
        />

        {/* Placeholder for symmetry */}
        <div className="w-8" />
      </div>

      {/* Volume */}
      <div className="w-full max-w-xs px-6">
        <VolumeControl volume={volume} onChange={setVolume} />
      </div>
    </div>
  );
}
