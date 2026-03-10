import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from './types';

/** Normalized API error that consuming code works with */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly serverError?: string;

  constructor(statusCode: number, message: string, serverError?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.serverError = serverError;
  }
}

/**
 * Parse any error into an ApiError.
 * - AxiosError with backend envelope → extract statusCode/message/error
 * - AxiosError without response (network error) → statusCode 0
 * - Already an ApiError → return as-is
 * - Anything else → generic 500
 */
export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (data && typeof data.statusCode === 'number') {
      const message =
        Array.isArray(data.message) ? data.message.join(', ') : data.message;
      return new ApiError(data.statusCode, message, data.error);
    }

    if (!error.response) {
      return new ApiError(0, 'Network error. Please check your connection.');
    }

    return new ApiError(
      error.response.status,
      error.message || 'An unexpected error occurred.',
    );
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return new ApiError(500, message);
}
