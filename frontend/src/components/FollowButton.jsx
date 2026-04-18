import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkFollowing, followArtist, unfollowArtist } from '../lib/socialApi';
import { useAuthStore } from '../stores/authStore';

/**
 * Props:
 *   artistId — string
 */
export default function FollowButton({ artistId }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: following = false } = useQuery({
    queryKey: ['following', artistId],
    queryFn: () => checkFollowing(artistId),
    enabled: isAuthenticated && !!artistId,
  });

  const mutation = useMutation({
    mutationFn: () => (following ? unfollowArtist(artistId) : followArtist(artistId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', artistId] });
      queryClient.invalidateQueries({ queryKey: ['following-list'] });
      queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
    },
  });

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={mutation.mutate}
      disabled={mutation.isPending}
      className={`px-6 py-2 rounded-full font-semibold text-sm transition disabled:opacity-50 ${
        following
          ? 'bg-transparent border border-gray-400 text-gray-300 hover:border-white hover:text-white'
          : 'bg-white text-black hover:bg-gray-200'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
