import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getFollowing } from '../lib/socialApi';
import FollowButton from '../components/FollowButton';

export default function FollowingPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['following-list'],
    queryFn: () => getFollowing(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Failed to load following list.</p>
      </div>
    );
  }

  const artists = data?.artists ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Following</h1>

      {artists.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>You're not following any artists yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {artists.map((artist) => (
            <div key={artist.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 hover:bg-gray-800 transition">
              {artist.avatarUrl ? (
                <img src={artist.avatarUrl} alt={artist.displayName} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center shrink-0 text-2xl">
                  🎤
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link to={`/artists/${artist.id}`} className="font-semibold hover:text-green-400 block truncate">
                  {artist.displayName}
                </Link>
                <p className="text-sm text-gray-400">{artist.followerCount.toLocaleString()} followers</p>
              </div>
              <FollowButton artistId={artist.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
