import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// WHAT IS A DTO?
//
// DTO = "Data Transfer Object". It defines the exact SHAPE of the data that
// is allowed to come in through the HTTP request body. Think of it as a
// contract / form validator. If the request body doesn't match this shape,
// NestJS rejects it with a 400 Bad Request before your code even runs.
//
// We use ZOD (not class-validator) as specified in the task doc.
// Zod lets us define a schema and then extract the TypeScript type from it
// automatically — so we don't repeat ourselves.
// ─────────────────────────────────────────────────────────────────────────────

export const ConnectSessionSchema = z.object({
  // The problem category the seeker is facing (e.g. "Anxiety", "Grief").
  // Must be a valid UUID that exists in the `category` table.
  categoryId: z.string().uuid({ message: 'categoryId must be a valid UUID' }),

  // How strongly the seeker is feeling the issue — scale of 1 (mild) to 5 (severe).
  // This gets stored in `user_problem.feeling_level`.
  feelingLevel: z
    .number()
    .int()
    .min(1, { message: 'feelingLevel must be at least 1' })
    .max(5, { message: 'feelingLevel cannot exceed 5' }),

  // Optional free-text label the seeker can add for more context.
  // Stored in `user_problem.custom_category_label`.
  customLabel: z.string().max(200).optional(),

  // A unique key the CLIENT generates (a UUID) before sending the request.
  // WHY? If the network drops after the server processes the request but
  // before the response arrives, the client might retry the same request.
  // The idempotency key lets the server detect "I already processed this"
  // and return the original result instead of creating a duplicate session.
  // Stored in Redis with a 5-minute TTL.
  idempotencyKey: z.string().uuid({ message: 'idempotencyKey must be a valid UUID' }),
});

// Extract the TypeScript type from the Zod schema automatically.
// This gives us: { categoryId: string; feelingLevel: number; customLabel?: string; idempotencyKey: string }
export type ConnectSessionDto = z.infer<typeof ConnectSessionSchema>;
