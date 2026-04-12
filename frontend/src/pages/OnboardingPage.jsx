import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">What do you love listening to?</h1>
          <p className="text-gray-400 text-sm">Pick at least one genre to personalise your experience.</p>
        </div>

        {error && (
          <p className="bg-red-900/40 border border-red-600 text-red-300 text-sm p-3 rounded-lg text-center">
            {error}
          </p>
        )}

        {genres.length === 0 && !error && (
          <p className="text-center text-gray-500 text-sm">Loading genres...</p>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                selected.includes(g.id)
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || selected.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 font-semibold py-2 rounded-lg transition"
        >
          {loading ? 'Saving...' : `Continue with ${selected.length} genre${selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
