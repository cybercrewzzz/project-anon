import { z } from 'zod';
import { apiClient } from './client';
import { BlockEntrySchema } from './schemas/common';
import type { BlockEntry } from './schemas/common';
import { parseApiError } from './errors';

/**
 * POST /block — Block another user.
 * Bidirectional exclusion in matching.
 *
 * @param blockedId Account ID of the user to block
 */
export async function blockUser(
  blockedId: string,
): Promise<{ message: string }> {
  try {
    const { data } = await apiClient.post('/block', { blockedId });
    return z.object({ message: z.string() }).parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}

/**
 * DELETE /block/:blockedId — Unblock a user.
 *
 * @param blockedId Account ID of the user to unblock
 */
export async function unblockUser(
  blockedId: string,
): Promise<{ message: string }> {
  try {
    const { data } = await apiClient.delete(`/block/${blockedId}`);
    return z.object({ message: z.string() }).parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}

/**
 * GET /block — List all users blocked by the current user.
 *
 * @returns Array of blocked user entries with blockedId and timestamp
 */
export async function getBlockList(): Promise<{ data: BlockEntry[] }> {
  try {
    const { data } = await apiClient.get('/block');
    // Validate the response shape
    return z.object({ data: z.array(BlockEntrySchema) }).parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}
