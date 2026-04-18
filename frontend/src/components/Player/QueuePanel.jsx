import { usePlayerStore } from '../../stores/playerStore';

export default function QueuePanel({ onClose }) {
  const { queue, queueIndex, currentSong, removeFromQueue, playQueue } = usePlayerStore();

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 max-h-[60vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <h3 className="text-white font-semibold text-sm">Queue</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition text-lg leading-none"
          aria-label="Close queue"
        >
          ×
        </button>
      </div>

      {/* Song list */}
      <div className="overflow-y-auto flex-1 py-2">
        {queue.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Queue is empty.</p>
        )}

        {queue.map((song, i) => {
          const isActive = i === queueIndex;
          return (
            <div
              key={`${song.id}-${i}`}
              className={`flex items-center gap-3 px-4 py-2 group hover:bg-gray-800 transition cursor-pointer ${
                isActive ? 'bg-gray-800' : ''
              }`}
              onClick={() => playQueue(queue, i)}
            >
              {/* Cover */}
              {song.coverUrl ? (
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-9 h-9 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded bg-gray-700 flex items-center justify-center shrink-0 text-gray-400 text-sm">
                  ♪
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>
                  {song.title}
                </p>
                <p className="text-gray-400 text-xs truncate">{song.artist?.displayName}</p>
              </div>

              {/* Playing indicator or remove button */}
              {isActive ? (
                <span className="text-green-400 text-xs shrink-0">▶</span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                  className="text-gray-500 hover:text-red-400 transition text-lg leading-none shrink-0"
                  aria-label="Remove from queue"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 shrink-0">
        <p className="text-gray-500 text-xs">{queue.length} song{queue.length !== 1 ? 's' : ''} in queue</p>
      </div>
    </div>
  );
}
