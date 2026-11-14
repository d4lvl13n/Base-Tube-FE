import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiKey, listApiKeys, revokeApiKey, type CreateApiKeyInput } from '../api/apiKeys';
import { queryKeys } from '../utils/queryKeys';

/**
 * The creator's API keys (Creator Hub → API). A 4xx answer is not retried:
 * asking again gets the same answer.
 */
const statusOf = (error: unknown): number | null => {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  return typeof status === 'number' ? status : null;
};

const retry = (failureCount: number, error: unknown): boolean => {
  const status = statusOf(error);
  if (status !== null && status >= 400 && status < 500) return false;
  return failureCount < 2;
};

export const useApiKeys = () =>
  useQuery({
    queryKey: queryKeys.apiKeys.all,
    queryFn: listApiKeys,
    staleTime: 30_000,
    retry,
  });

/** The answer holds the key itself: it is kept in component state only, never in the query cache. */
export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApiKeyInput) => createApiKey(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all }),
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => revokeApiKey(publicId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all }),
  });
};
