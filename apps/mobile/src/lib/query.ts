import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { isAccountRestrictedError } from '@basetube/api';
import { clearAccountRestriction, reopenAccountRestriction } from './accountStatus';

/** Key of the signed-in account query (`GET /api/v1/profile`, auth required). */
export const ME_QUERY_KEY = ['me'] as const;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // The account endpoint needs a valid, unblocked account. Public routes
    // answer a suspended account too, so only this one proves it is restored.
    onSuccess: (_data, query) => {
      if (query.queryKey[0] === ME_QUERY_KEY[0]) clearAccountRestriction();
    },
  }),
  mutationCache: new MutationCache({
    // A signed-in action (like, comment, subscribe, report, buy…) refused for a
    // suspended account brings the explanation back. Background loads do not.
    onError: (error) => {
      if (isAccountRestrictedError(error)) reopenAccountRestriction();
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // A suspended account gets the same answer on a retry.
      retry: (failureCount, error) => !isAccountRestrictedError(error) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});
