import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboard, getMySongs, uploadSong, deleteSong, getMyAlbums, createAlbum } from '../lib/artistApi';

const STATUS_COLORS = {
  published: 'text-green-400',
  pending: 'text-yellow-400',
  rejected: 'text-red-400',
};

export default function ArtistDashboardPage() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const audioRef = useRef(null);
  const coverRef = useRef(null);
  const [form, setForm] = useState({ title: '', duration: '', genreId: '', bpm: '', mood: '', year: '' });

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['artist-dashboard'],
    queryFn: getDashboard,
  });

  const { data: songsData, isLoading: songsLoading } = useQuery({
    queryKey: ['artist-songs'],
    queryFn: () => getMySongs(),
  });

  const uploadMutation = useMutation({
    mutationFn: (fd) => uploadSong(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artist-songs'] });
      qc.invalidateQueries({ queryKey: ['artist-dashboard'] });
      setShowUpload(false);
      setForm({ title: '', duration: '', genreId: '', bpm: '', mood: '', year: '' });
      setUploadError('');
    },
    onError: (err) => setUploadError(err.response?.data?.error?.message || 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSong(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artist-songs'] });
      qc.invalidateQueries({ queryKey: ['artist-dashboard'] });
    },
  });

  function handleUpload(e) {
    e.preventDefault();
    if (!audioRef.current?.files?.[0]) {
      setUploadError('Audio file is required');
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    fd.append('audio', audioRef.current.files[0]);
    if (coverRef.current?.files?.[0]) fd.append('cover', coverRef.current.files[0]);
    uploadMutation.mutate(fd);
  }

  if (dashLoading) return <div className="p-8 text-gray-400">Loading dashboard…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="artist-dashboard">
      {/* Stats */}
      {dashboard && (
        <div data-testid="dashboard-stats">
          <h1 className="text-2xl font-bold text-white mb-1">{dashboard.displayName}</h1>
          <p className="text-gray-400 text-sm mb-6">{dashboard.email}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Plays" value={dashboard.totalPlayCount.toLocaleString()} />
            <StatCard label="Followers" value={dashboard.followerCount.toLocaleString()} />
            <StatCard label="Earnings (VND)" value={Number(dashboard.totalEarnings).toLocaleString()} />
            <StatCard label="Songs" value={dashboard.totalSongs} />
          </div>
          <div className="flex gap-6 mb-8 text-sm">
            <span className="text-green-400">Published: {dashboard.songsByStatus.published}</span>
            <span className="text-yellow-400">Pending: {dashboard.songsByStatus.pending}</span>
            <span className="text-red-400">Rejected: {dashboard.songsByStatus.rejected}</span>
          </div>
        </div>
      )}

      {/* Upload toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">My Songs</h2>
        <button
          data-testid="upload-toggle"
          onClick={() => setShowUpload((v) => !v)}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showUpload ? 'Cancel' : '+ Upload Song'}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <form
          data-testid="upload-form"
          onSubmit={handleUpload}
          className="bg-gray-800 rounded-xl p-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title *" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
            <Field label="Duration (sec) *" value={form.duration} onChange={(v) => setForm((f) => ({ ...f, duration: v }))} type="number" />
            <Field label="BPM" value={form.bpm} onChange={(v) => setForm((f) => ({ ...f, bpm: v }))} type="number" />
            <Field label="Mood" value={form.mood} onChange={(v) => setForm((f) => ({ ...f, mood: v }))} />
            <Field label="Year" value={form.year} onChange={(v) => setForm((f) => ({ ...f, year: v }))} type="number" />
          </div>
          <div className="space-y-2">
            <label className="block text-gray-300 text-sm">Audio file (MP3) *</label>
            <input ref={audioRef} type="file" accept="audio/*" data-testid="audio-input" className="text-gray-300 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="block text-gray-300 text-sm">Cover image (optional)</label>
            <input ref={coverRef} type="file" accept="image/*" className="text-gray-300 text-sm" />
          </div>
          {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      )}

      {/* Songs list */}
      {songsLoading ? (
        <p className="text-gray-400">Loading songs…</p>
      ) : !songsData?.songs?.length ? (
        <p data-testid="empty-songs" className="text-gray-500 text-sm">
          No songs uploaded yet.
        </p>
      ) : (
        <ul data-testid="songs-list" className="space-y-2">
          {songsData.songs.map((song) => (
            <li
              key={song.id}
              data-testid={`song-row-${song.id}`}
              className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-white font-medium">{song.title}</p>
                <p className={`text-xs mt-0.5 ${STATUS_COLORS[song.status] || 'text-gray-400'}`}>
                  {song.status}
                  {song.rejectionReason && ` — ${song.rejectionReason}`}
                </p>
              </div>
              {song.status !== 'published' && (
                <button
                  data-testid={`delete-song-${song.id}`}
                  onClick={() => deleteMutation.mutate(song.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-gray-300 text-sm mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}
