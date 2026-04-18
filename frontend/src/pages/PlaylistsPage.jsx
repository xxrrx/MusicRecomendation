import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylists, createPlaylist } from '../lib/playlistApi';

export default function PlaylistsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: getPlaylists,
  });

  const createMutation = useMutation({
    mutationFn: () => createPlaylist(newTitle.trim(), null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setNewTitle('');
      setShowCreate(false);
    },
  });

  function handleCreate(e) {
    e.preventDefault();
    if (newTitle.trim()) createMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Playlists</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-green-500 text-black px-4 py-1.5 rounded-full font-semibold text-sm hover:bg-green-400"
        >
          + New Playlist
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Playlist name..."
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newTitle.trim()}
            className="bg-green-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-green-400 disabled:opacity-50"
          >
            Create
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : playlists.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>No playlists yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              to={`/playlists/${pl.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 hover:bg-gray-800 transition"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                <span className="text-xl">♫</span>
              </div>
              <div>
                <p className="font-semibold">{pl.title}</p>
                <p className="text-sm text-gray-400">{pl.songCount} songs</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
