import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';
import { blockUser, unblockUser, getBlockList } from '@/api/block';

/**
 * Fetch the current user's block list.
 *
 * Uses `queryKeys.blocks` for caching and invalidation.
 */
export function useBlockList() {
  return useQuery({
    queryKey: queryKeys.blocks,
    queryFn: getBlockList,
  });
}

/**
 * Mutation hook to block a user.
 *
 * Invalidates the blocks cache on success.
 * Throws normalized ApiError to be handled by the caller.
 */
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedId: string) => blockUser(blockedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks });
    },
  });
}

/**
 * Mutation hook to unblock a user.
 *
 * Invalidates the blocks cache on success.
 * Throws normalized ApiError to be handled by the caller.
 */
export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedId: string) => unblockUser(blockedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks });
    },
  });
}
