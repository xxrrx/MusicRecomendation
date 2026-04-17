function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Props:
 *   current   — number (seconds)
 *   duration  — number (seconds)
 *   onSeek    — (seconds: number) => void
 */
export default function ProgressBar({ current = 0, duration = 0, onSeek }) {
  const percent = duration > 0 ? (current / duration) * 100 : 0;

  function handleClick(e) {
    if (!onSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{formatTime(current)}</span>

      <div
        role="progressbar"
        aria-valuenow={Math.round(current)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        onClick={handleClick}
        className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group relative"
      >
        <div
          className="h-full bg-white rounded-full group-hover:bg-green-400 transition-colors"
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="text-xs text-gray-400 tabular-nums w-8">{formatTime(duration)}</span>
    </div>
  );
}
