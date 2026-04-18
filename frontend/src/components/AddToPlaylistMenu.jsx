import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylists, addSongToPlaylist } from '../lib/playlistApi';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';

/**
 * Props:
 *   songId — string
 */
export default function AddToPlaylistMenu({ songId, song }) {
  const { isAuthenticated } = useAuthStore();
  const { addToQueue, queue } = usePlayerStore();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(null); // playlistId just added to
  const menuRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: getPlaylists,
    enabled: isAuthenticated && open,
  });

  const mutation = useMutation({
    mutationFn: (playlistId) => addSongToPlaylist(playlistId, songId),
    onSuccess: (_, playlistId) => {
      setAdded(playlistId);
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      setTimeout(() => {
        setAdded(null);
        setOpen(false);
      }, 800);
    },
  });

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-gray-400 hover:text-white text-lg leading-none transition px-1"
        title="Add to playlist"
        aria-label="Add to playlist"
      >
        ⋯
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-full mb-1 z-50 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Add to queue */}
          {song && (
            <button
              onClick={() => { addToQueue(song); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition border-b border-gray-700"
            >
              + Add to queue
            </button>
          )}

          <p className="text-xs text-gray-500 px-3 py-2 border-b border-gray-700">
            Add to playlist
          </p>

          {playlists.length === 0 && (
            <p className="text-xs text-gray-500 px-3 py-2">No playlists yet.</p>
          )}

          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => mutation.mutate(pl.id)}
              disabled={mutation.isPending}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition flex items-center justify-between"
            >
              <span className="truncate">{pl.title}</span>
              {added === pl.id && (
                <span className="text-green-400 text-xs shrink-0 ml-2">✓ Added</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
