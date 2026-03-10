import { z } from 'zod';

// ── Shared primitives ──

export const AccountRoleSchema = z.enum(['user', 'volunteer', 'admin']);
export type AccountRole = z.infer<typeof AccountRoleSchema>;

export const LanguageSchema = z.object({
  languageId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
});
export type Language = z.infer<typeof LanguageSchema>;

export const CategorySchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
});
export type Category = z.infer<typeof CategorySchema>;

export const SpecialisationSchema = z.object({
  specialisationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
});
export type Specialisation = z.infer<typeof SpecialisationSchema>;

// ── Pagination wrapper ──

export function paginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  });
}

// ── Block ──

export const BlockEntrySchema = z.object({
  blockedId: z.string().uuid(),
  blockedAt: z.string(),
});
export type BlockEntry = z.infer<typeof BlockEntrySchema>;

// ── Tickets ──

export const TicketsRemainingSchema = z.object({
  daily: z.number(),
  consumed: z.number(),
  reserved: z.number(),
  remaining: z.number(),
});
export type TicketsRemaining = z.infer<typeof TicketsRemainingSchema>;
