/**
 * PlayerControls
 * ──────────────
 * Prev / Play-Pause / Next buttons.
 * The play button is a large white circle — the focal point of the player.
 *
 * Props:
 *   isPlaying  — bool
 *   hasPrev    — bool
 *   hasNext    — bool
 *   onToggle   — () => void
 *   onPrev     — () => void
 *   onNext     — () => void
 */
export default function PlayerControls({ isPlaying, hasPrev, hasNext, onToggle, onPrev, onNext }) {
  return (
    <div className="flex items-center gap-5">

      {/* Previous */}
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Previous track"
        className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M9.195 18.44c1.25.714 2.805-.189 2.805-1.629v-2.34l6.945 3.968c1.25.715 2.805-.188 2.805-1.628V8.69c0-1.44-1.555-2.343-2.805-1.628L12 11.029v-2.34c0-1.44-1.555-2.343-2.805-1.628l-7.108 4.061c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
        </svg>
      </button>

      {/* Play / Pause — prominent circular button */}
      <button
        onClick={onToggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center
                   hover:scale-105 active:scale-95 transition-transform duration-150
                   shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sp-green"
      >
        {isPlaying ? (
          /* Pause icon */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="w-[18px] h-[18px]">
            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25z" clipRule="evenodd" />
          </svg>
        ) : (
          /* Play icon — offset 1px right to look optically centred */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="w-[18px] h-[18px] translate-x-px">
            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next track"
        className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
        </svg>
      </button>
    </div>
  );
}
