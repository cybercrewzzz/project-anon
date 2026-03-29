import { apiClient } from './client';
import {
  ReportResponseSchema,
  type ReportResponse,
  type SubmitReportBody,
} from './schemas/report';

/**
 * POST /report — File a report against the other session participant.
 *
 * @param body.sessionId   The session where the issue occurred
 * @param body.reportedId  Account ID of the reported user
 * @param body.category    One of: harassment | inappropriate | spam | other
 * @param body.description Free-text description of the issue
 */
export async function submitReport(
  body: SubmitReportBody,
): Promise<ReportResponse> {
  const { data } = await apiClient.post('/report', body);
  return ReportResponseSchema.parse(data);
}
