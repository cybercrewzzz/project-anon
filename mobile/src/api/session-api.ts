import { apiClient } from './client';
import { parseApiError } from './errors';
import {
  SessionConnectMatchSchema,
  SessionConnectWaitingSchema,
  SessionAcceptSchema,
  SessionHistorySchema,
  SessionTicketsSchema,
  type SessionConnectMatch,
  type SessionConnectWaiting,
  type SessionAccept,
  type SessionHistory,
  type SessionTickets,
} from './schemas';

// =============================================================================
// POST /session/connect
// Seeker requests a session — find match or queue into waiting state.
//
// Returns one of two shapes:
//   - SessionConnectMatch  (HTTP 200) — matched instantly
//   - SessionConnectWaiting (HTTP 202) — queued, waiting for volunteer to accept
// =============================================================================

export interface ConnectSessionBody {
  categoryId: string;
  feelingLevel: number; // 1-5
  customLabel?: string;
  idempotencyKey: string; // client-generated UUID
}

export type ConnectSessionResult = SessionConnectMatch | SessionConnectWaiting;

export async function connectSession(
  body: ConnectSessionBody,
): Promise<ConnectSessionResult> {
  try {
    const { data } = await apiClient.post('/session/connect', body);
    // Try to parse as match first, then waiting
    const matchResult = SessionConnectMatchSchema.safeParse(data);
    if (matchResult.success) return matchResult.data;
    return SessionConnectWaitingSchema.parse(data);
  } catch (error) {
    // The backend throws 202 as an HttpException with the waiting payload.
    // Axios treats non-2xx as errors, but 202 is still success.
    // We need to handle this transparently.
    const axiosError = error as {
      response?: { status?: number; data?: unknown };
    };
    if (axiosError?.response?.status === 202) {
      return SessionConnectWaitingSchema.parse(axiosError.response.data);
    }
    throw parseApiError(error);
  }
}

// =============================================================================
// POST /session/:sessionId/accept
// Volunteer accepts a session from a push notification (Path B).
// Only volunteers call this. Multiple may race — only first wins (409 for rest).
// =============================================================================

export async function acceptSession(sessionId: string): Promise<SessionAccept> {
  try {
    const { data } = await apiClient.post(`/session/${sessionId}/accept`);
    return SessionAcceptSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}

// =============================================================================
// PATCH /session/:sessionId/rate
// Submit a rating after a session ends.
// Both seekers and volunteers call this. Each can only rate once.
// seeker: rating 1-5 + optional starred boolean
// volunteer: rating 1-5 (starred is ignored by backend)
// =============================================================================

export interface RateSessionBody {
  rating: number; // 1-5
  starred?: boolean; // only meaningful for seekers
}

export async function rateSession(
  sessionId: string,
  body: RateSessionBody,
): Promise<{ message: string }> {
  try {
    const { data } = await apiClient.patch(`/session/${sessionId}/rate`, body);
    return data as { message: string };
  } catch (error) {
    throw parseApiError(error);
  }
}

// =============================================================================
// GET /session/history
// Get the current user's session history (paginated).
// Works for both seekers and volunteers.
// =============================================================================

export interface SessionHistoryParams {
  page?: number;
  limit?: number;
}

export async function fetchSessionHistory(
  params: SessionHistoryParams = {},
): Promise<SessionHistory> {
  try {
    const { data } = await apiClient.get('/session/history', { params });
    return SessionHistorySchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}

// =============================================================================
// GET /session/tickets
// Get how many session tickets the seeker has remaining today.
// Only seekers call this (volunteers are not ticket-limited).
// =============================================================================

export async function fetchSessionTickets(): Promise<SessionTickets> {
  try {
    const { data } = await apiClient.get('/session/tickets');
    return SessionTicketsSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}
