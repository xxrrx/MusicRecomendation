import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkLiked, likeSong, unlikeSong } from '../lib/playlistApi';
import { useAuthStore } from '../stores/authStore';

/**
 * Props:
 *   songId  — string
 *   size    — 'sm' | 'md' (default 'md')
 */
export default function LikeButton({ songId, size = 'md' }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: liked = false } = useQuery({
    queryKey: ['liked', songId],
    queryFn: () => checkLiked(songId),
    enabled: isAuthenticated && !!songId,
  });

  const mutation = useMutation({
    mutationFn: () => (liked ? unlikeSong(songId) : likeSong(songId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked', songId] });
      queryClient.invalidateQueries({ queryKey: ['liked-songs'] });
    },
  });

  if (!isAuthenticated) return null;

  const iconSize = size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); mutation.mutate(); }}
      disabled={mutation.isPending}
      className={`${iconSize} transition-transform hover:scale-110 disabled:opacity-50`}
      title={liked ? 'Unlike' : 'Like'}
      aria-label={liked ? 'Unlike song' : 'Like song'}
    >
      {liked ? (
        <span className="text-green-400">♥</span>
      ) : (
        <span className="text-gray-400 hover:text-white">♡</span>
      )}
    </button>
  );
}
