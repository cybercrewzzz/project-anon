import { z } from 'zod';
import { apiClient } from './client';
import { BlockEntrySchema } from './schemas/common';
import type { BlockEntry } from './schemas/common';

const UnblockResponseSchema = z.object({
  message: z.string(),
});

export async function getBlockList(): Promise<{ data: BlockEntry[] }> {
  const { data } = await apiClient.get('/block');
  return z.object({ data: z.array(BlockEntrySchema) }).parse(data);
}

export async function unblockUser(
  blockedId: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/block/${blockedId}`);
  return UnblockResponseSchema.parse(data);
}
