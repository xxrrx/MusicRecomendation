import { usePlayerStore } from '../../stores/playerStore';

/**
 * QueuePanel
 * ──────────
 * Floating panel that shows the current playback queue.
 * Appears above the PlayerBar (bottom-20) anchored to the right edge.
 */
export default function QueuePanel({ onClose }) {
  const { queue, queueIndex, removeFromQueue, playQueue } = usePlayerStore();

  return (
    /* Slide-up entrance via animate-fadeIn */
    <div
      className="fixed bottom-24 right-4 z-50 w-80 max-h-[60vh] flex flex-col
                 bg-[#282828] rounded-card-lg shadow-modal animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-sp-border shrink-0">
        <h3 className="text-white font-bold text-sm tracking-wide">Queue</h3>
        <button
          onClick={onClose}
          aria-label="Close queue"
          className="btn-icon text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Song list */}
      <div className="overflow-y-auto flex-1 py-2">
        {queue.length === 0 && (
          <p className="text-sp-gray text-sm text-center py-10">Queue is empty.</p>
        )}

        {queue.map((song, i) => {
          const isActive = i === queueIndex;
          return (
            <div
              key={`${song.id}-${i}`}
              onClick={() => playQueue(queue, i)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-150
                          hover:bg-sp-hover group ${isActive ? 'bg-sp-hover/70' : ''}`}
            >
              {/* Cover */}
              {song.coverUrl ? (
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-sp-border flex items-center justify-center
                                shrink-0 text-sp-gray text-sm">
                  ♪
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-sp-green' : 'text-white'}`}>
                  {song.title}
                </p>
                <p className="text-sp-gray text-xs truncate">{song.artist?.displayName}</p>
              </div>

              {/* Playing bars or remove button */}
              {isActive ? (
                /* Animated equaliser bars */
                <div className="playing-bars shrink-0">
                  <span className="w-[3px] bg-sp-green rounded-full" />
                  <span className="w-[3px] bg-sp-green rounded-full" />
                  <span className="w-[3px] bg-sp-green rounded-full" />
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                  aria-label="Remove from queue"
                  className="btn-icon text-xl leading-none opacity-0 group-hover:opacity-100
                             hover:text-red-400 transition-all duration-150 shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-sp-border shrink-0">
        <p className="text-sp-gray-dark text-xs">
          {queue.length} song{queue.length !== 1 ? 's' : ''} in queue
        </p>
      </div>
    </div>
  );
}
