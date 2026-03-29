import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// DTO for POST /block
//
// Validates the request body when a user or volunteer blocks another account.
// Only requires the ID of the person to block — the blocker is taken from
// the JWT (via @CurrentUser()).
// ─────────────────────────────────────────────────────────────────────────────

export const CreateBlockSchema = z.object({
  // The account to block. Must be a valid UUID.
  blockedId: z.string().uuid({ message: 'blockedId must be a valid UUID' }),
});

export type CreateBlockDto = z.infer<typeof CreateBlockSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Schema for DELETE /block/:blockedId — validates the URL parameter.
// ─────────────────────────────────────────────────────────────────────────────

export const BlockParamsSchema = z.object({
  blockedId: z.string().uuid({ message: 'blockedId must be a valid UUID' }),
});

export type BlockParamsDto = z.infer<typeof BlockParamsSchema>;
