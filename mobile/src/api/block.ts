import { z } from 'zod';
import { apiClient } from './client';
import { BlockEntrySchema } from './schemas/common';
import type { BlockEntry } from './schemas/common';

/**
 * POST /block — Block another user.
 * Bidirectional exclusion in matching.
 *
 * @param blockedId Account ID of the user to block
 */
export async function blockUser(
  blockedId: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.post('/block', { blockedId });
  return data;
}

/**
 * DELETE /block/:blockedId — Unblock a user.
 *
 * @param blockedId Account ID of the user to unblock
 */
export async function unblockUser(
  blockedId: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/block/${blockedId}`);
  return data;
}

/**
 * GET /block — List all users blocked by the current user.
 *
 * @returns Array of blocked user entries with blockedId and timestamp
 */
export async function getBlockList(): Promise<{ data: BlockEntry[] }> {
  const { data } = await apiClient.get('/block');
  // Validate the response shape
  const validated = z
    .object({ data: z.array(BlockEntrySchema) })
    .parse(data);
  return validated;
}
