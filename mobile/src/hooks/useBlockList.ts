import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';
import { blockUser, unblockUser, getBlockList } from '@/api/block';
import { parseApiError } from '@/api/errors';
import { Alert } from 'react-native';

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
 * Shows an alert on error.
 */
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedId: string) => blockUser(blockedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks });
    },
    onError: error => {
      const apiError = parseApiError(error);
      Alert.alert('Block failed', apiError.message);
    },
  });
}

/**
 * Mutation hook to unblock a user.
 *
 * Invalidates the blocks cache on success.
 * Shows an alert on error.
 */
export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedId: string) => unblockUser(blockedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks });
    },
    onError: error => {
      const apiError = parseApiError(error);
      Alert.alert('Unblock failed', apiError.message);
    },
  });
}
