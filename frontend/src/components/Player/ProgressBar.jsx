/**
 * ProgressBar
 * ───────────
 * A sleek seek bar with Spotify-style behaviour:
 *   • thin grey track that turns green on hover
 *   • a white thumb dot that appears on hover
 *   • click anywhere on the track to seek
 *
 * Props:
 *   current   — number (seconds)
 *   duration  — number (seconds)
 *   onSeek    — (seconds: number) => void
 */
function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

export default function ProgressBar({ current = 0, duration = 0, onSeek }) {
  const pct = duration > 0 ? (current / duration) * 100 : 0;

  function handleClick(e) {
    if (!onSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  }

  return (
    <div className="flex items-center gap-3 w-full group">
      {/* Elapsed time */}
      <span className="text-[11px] text-sp-gray tabular-nums w-8 text-right select-none">
        {fmt(current)}
      </span>

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(current)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        onClick={handleClick}
        className="relative flex-1 h-1 rounded-full cursor-pointer"
        style={{ background: '#4d4d4d' }}
      >
        {/* Filled portion — turns green on group hover */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-colors duration-150
                     bg-sp-gray group-hover:bg-sp-green"
          style={{ width: `${pct}%` }}
        />

        {/* Thumb — appears on hover */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Total duration */}
      <span className="text-[11px] text-sp-gray tabular-nums w-8 select-none">
        {fmt(duration)}
      </span>
    </div>
  );
}
