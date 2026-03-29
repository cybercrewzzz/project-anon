import { z } from 'zod';

// ── Report categories ──

export const ReportCategorySchema = z.enum([
  'harassment',
  'inappropriate',
  'spam',
  'other',
]);
export type ReportCategory = z.infer<typeof ReportCategorySchema>;

// ── POST /report request body ──

export const SubmitReportBodySchema = z.object({
  sessionId: z.uuid(),
  reportedId: z.uuid(),
  category: ReportCategorySchema,
  description: z.string().min(1),
});
export type SubmitReportBody = z.infer<typeof SubmitReportBodySchema>;

// ── POST /report response ──

export const ReportResponseSchema = z.object({
  reportId: z.uuid(),
});
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
