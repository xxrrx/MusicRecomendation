import { Link } from 'react-router-dom';

/**
 * Props:
 *   artist — { id, displayName, avatarUrl, followerCount }
 */
export default function ArtistCard({ artist }) {
  return (
    <Link
      to={`/artists/${artist.id}`}
      className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-800 transition text-center"
    >
      {artist.avatarUrl ? (
        <img
          src={artist.avatarUrl}
          alt={artist.displayName}
          className="w-20 h-20 rounded-full object-cover"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
          <span className="text-3xl text-gray-400">🎤</span>
        </div>
      )}

      <div>
        <p className="text-white font-semibold">{artist.displayName}</p>
        {artist.followerCount != null && (
          <p className="text-gray-400 text-xs mt-0.5">
            {artist.followerCount.toLocaleString()} followers
          </p>
        )}
      </div>
    </Link>
  );
}
