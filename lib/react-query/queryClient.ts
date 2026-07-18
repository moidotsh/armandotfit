// lib/react-query/queryClient.ts
// React Query client configuration. Mirrors qep-tracker's error-handling
// shape: queries/mutations funnel errors through handleApiError, auth-class
// errors trigger the registered handler (set up fromAuthProvider).

import { QueryClient } from '@tanstack/react-query';
import { AppError, handleApiError } from '../../utils/errors';
import logger from '../../utils/logger';

export const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: (failureCount: number, error: unknown) => {
    if (error instanceof AppError && error.code === 'ERR_AUTH') return false;
    if (error instanceof AppError && error.code === 'ERR_VALIDATION') return false;
    return failureCount < 3;
  },
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  throwOnError: false,
};

export const defaultMutationOptions = {
  retry: 1,
  throwOnError: false,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: defaultQueryOptions,
    mutations: defaultMutationOptions,
  },
});

let onAuthError: (() => void) | null = null;

export function registerAuthErrorHandler(handler: () => void) {
  onAuthError = handler;
}

function isAuthError(appError: AppError): boolean {
  return (
    appError.code === 'ERR_AUTH' ||
    appError.code === 'ERR_UNAUTHORIZED' ||
    appError.code === 'ERR_SESSION_EXPIRED' ||
    /401|AUTH_SESSION_EXPIRED|not authenticated/i.test(appError.message)
  );
}

export function setupQueryErrorHandlers(): () => void {
  const queryUnsub = queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'updated' && event.query.state.status === 'error') {
      const error = event.query.state.error;
      const appError = handleApiError(error, `Query: ${event.query.queryHash}`);
      if (isAuthError(appError)) {
        onAuthError?.();
      }
      logger.error('queries', 'Query error', appError, {
        queryKey: event.query.queryKey,
      });
    }
  });

  const mutationUnsub = queryClient.getMutationCache().subscribe((event) => {
    if (event?.type === 'updated' && event.mutation.state.status === 'error') {
      const error = event.mutation.state.error;
      const appError = handleApiError(error, `Mutation: ${event.mutation.mutationId}`);
      if (isAuthError(appError)) {
        onAuthError?.();
      }
      logger.error('mutations', 'Mutation error', appError, {
        mutationKey: event.mutation.options.mutationKey,
      });
    }
  });

  return () => {
    queryUnsub();
    mutationUnsub();
  };
}
