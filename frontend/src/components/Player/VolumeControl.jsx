/**
 * VolumeControl
 * ─────────────
 * Mute toggle + range slider styled to match the ProgressBar aesthetic.
 *
 * Props:
 *   volume    — number 0–1
 *   onChange  — (volume: number) => void
 */
export default function VolumeControl({ volume = 0.8, onChange }) {
  const isMuted = volume === 0;

  return (
    <div className="flex items-center gap-2 group">
      {/* Mute toggle */}
      <button
        onClick={() => onChange?.(isMuted ? 0.8 : 0)}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className="btn-icon shrink-0"
      >
        {isMuted ? (
          /* Muted — speaker with X */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
          </svg>
        ) : (
          /* Speaker with waves */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
          </svg>
        )}
      </button>

      {/* Volume slider — same hover-reveal thumb as ProgressBar */}
      <div className="relative flex items-center w-24 h-1 rounded-full cursor-pointer"
           style={{ background: '#4d4d4d' }}>
        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-sp-gray group-hover:bg-white transition-colors duration-150 pointer-events-none"
          style={{ width: `${volume * 100}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
          style={{ left: `${volume * 100}%` }}
        />
        {/* Native range input (invisible, sits on top for interaction) */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onChange?.(parseFloat(e.target.value))}
          aria-label="Volume"
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
