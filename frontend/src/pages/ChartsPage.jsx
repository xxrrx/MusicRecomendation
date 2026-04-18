import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChart } from '../lib/chartsApi';
import SongCard from '../components/SongCard';

const CHART_TYPES = [
  { value: 'daily', label: 'Daily Top 50' },
  { value: 'weekly', label: 'Weekly Top 50' },
  { value: 'monthly', label: 'Monthly Top 50' },
];

export default function ChartsPage() {
  const [type, setType] = useState('daily');

  const { data, isLoading, error } = useQuery({
    queryKey: ['chart', type],
    queryFn: () => fetchChart(type),
    staleTime: 60_000,
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Charts</h1>

      {/* Type tabs */}
      <div className="flex gap-2 mb-8">
        {CHART_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => setType(ct.value)}
            className={`px-5 py-2 rounded-full font-medium transition text-sm ${
              type === ct.value
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            data-testid={`tab-${ct.value}`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="text-gray-400 text-center py-12">Loading chart...</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-center py-12">Failed to load chart.</p>
      )}

      {/* Chart list */}
      {data && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">{data.title}</h2>
            {data.computedAt && (
              <p className="text-gray-500 text-xs">
                Updated {new Date(data.computedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {data.songs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data yet for this chart.</p>
          ) : (
            <div className="space-y-1" data-testid="chart-songs">
              {data.songs.map((song, idx) => (
                <SongCard
                  key={song.id}
                  song={song}
                  rank={idx + 1}
                  queue={data.songs}
                  queueIndex={idx}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
