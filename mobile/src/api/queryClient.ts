import { QueryClient } from '@tanstack/react-query';
import { parseApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const apiError = parseApiError(error);
        if ([401, 403, 404].includes(apiError.statusCode)) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: false,
    },
  },
});
