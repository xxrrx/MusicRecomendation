import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylist, deletePlaylist, removeSongFromPlaylist, updatePlaylist } from '../lib/playlistApi';
import SongCard from '../components/SongCard';

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');

  const { data: playlist, isLoading, isError } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => getPlaylist(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlaylist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      navigate('/playlists');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (newTitle) => updatePlaylist(id, { title: newTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setEditing(false);
    },
  });

  const removeSongMutation = useMutation({
    mutationFn: (songId) => removeSongFromPlaylist(id, songId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', id] }),
  });

  function handleEditSubmit(e) {
    e.preventDefault();
    if (title.trim()) updateMutation.mutate(title.trim());
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (isError || !playlist) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Playlist not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          {editing ? (
            <form onSubmit={handleEditSubmit} className="flex gap-2">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-800 text-white px-3 py-1 rounded-lg text-2xl font-bold flex-1"
              />
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-green-500 text-black px-4 py-1 rounded-lg font-semibold hover:bg-green-400"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-700 text-white px-4 py-1 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </form>
          ) : (
            <h1
              className="text-3xl font-bold cursor-pointer hover:text-gray-300"
              onClick={() => { setTitle(playlist.title); setEditing(true); }}
              title="Click to edit"
            >
              {playlist.title}
            </h1>
          )}
          <p className="text-gray-400 mt-1">{playlist.songCount} songs</p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Delete this playlist?')) deleteMutation.mutate();
          }}
          className="ml-4 text-red-400 hover:text-red-300 text-sm"
        >
          Delete
        </button>
      </div>

      {/* Songs */}
      {playlist.songs && playlist.songs.length > 0 ? (
        <div className="space-y-1">
          {playlist.songs.map((song, i) => (
            <div key={song.id} className="flex items-center group">
              <div className="flex-1">
                <SongCard song={song} rank={i + 1} queue={playlist.songs} queueIndex={i} />
              </div>
              <button
                onClick={() => removeSongMutation.mutate(song.id)}
                className="ml-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xl px-2"
                title="Remove from playlist"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">This playlist is empty.</p>
          <Link to="/" className="text-green-400 hover:underline mt-2 inline-block">
            Browse music to add songs
          </Link>
        </div>
      )}
    </div>
  );
}
