import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/music/genres')
      .then((res) => setGenres(res.data.data))
      .catch(() => setError('Failed to load genres.'));
  }, []);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Please select at least one genre.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/users/onboarding', { genreIds: selected });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sp-black px-4">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <Link to="/" className="flex items-center gap-2 mb-10">
        <svg viewBox="0 0 24 24" fill="#1DB954" className="w-10 h-10">
          <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
        </svg>
        <span className="text-white font-extrabold text-2xl tracking-tight">SoundWave</span>
      </Link>

      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[480px] bg-[#121212] rounded-card-lg px-8 py-10 shadow-modal animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            What do you love listening to?
          </h1>
          <p className="text-sp-gray text-sm">
            Pick at least one genre to personalise your experience.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-950/60 border border-red-700/60
                          text-red-300 text-sm px-4 py-3 rounded-card mb-5 text-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 1.998-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.502-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {genres.length === 0 && !error && (
          <p className="text-center text-sp-gray-dark text-sm mb-6">Loading genres…</p>
        )}

        {/* Genre chips */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-150 ${
                selected.includes(g.id)
                  ? 'bg-sp-green border-sp-green text-black'
                  : 'bg-transparent border-sp-border text-sp-gray hover:border-white hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || selected.length === 0}
          className="w-full btn-primary py-3.5 text-base"
        >
          {loading
            ? 'Saving…'
            : selected.length === 0
            ? 'Select at least one genre'
            : `Continue with ${selected.length} genre${selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
