import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import {
  getBusinessCustomer,
  getBusinessCustomers,
  getBusinessOverview,
  getBusinessPass,
  getBusinessPasses,
  getBusinessPayouts,
  getBusinessSources,
  getPassVideoWatch,
  checkCreatorPassVideo,
  getCreatorPassVideos,
  getSellingReadiness,
  pausePassSale,
  removeCreatorPassVideo,
  replaceCreatorPassVideo,
  requestPassSalesReview,
  resumePassSale,
  type BusinessScopeParams,
  type PassWatchPeriod,
  type CustomersParams,
  type PageParams,
  type PassesParams,
} from '../api/creatorBusiness';
import type {
  CheckVideoResponse,
  PassRow,
  PassSummary,
  PassVideosResponse,
  RemoveVideoResponse,
  ReplaceVideoResponse,
  ReviewRequestResponse,
  SaleActionResponse,
  SalesSwitch,
} from '../types/creatorBusiness';
import { applyPassSummary, findPassSummary, optimisticPaused } from '../components/pages/CreatorHub/Business/passActions';
import { queryKeys } from '../utils/queryKeys';

/**
 * TanStack Query hooks for the creator business view.
 *
 * - The server caches aggregates ~60 s per creator, so 60 s of client
 *   freshness costs nothing and avoids refetch storms when switching screens.
 * - Previous data is kept while the next period / page / filter loads, so a
 *   table never collapses to a skeleton between two pages.
 * - A 4xx answer (bad parameter, not found, rate limited) is not retried:
 *   asking again gets the same answer.
 */
const STALE_MS = 60_000;

const statusOf = (error: unknown): number | null => {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  return typeof status === 'number' ? status : null;
};

const retry = (failureCount: number, error: unknown): boolean => {
  const status = statusOf(error);
  if (status !== null && status >= 400 && status < 500) return false;
  return failureCount < 2;
};

const common = { staleTime: STALE_MS, retry, placeholderData: keepPreviousData } as const;

export const useBusinessOverview = (params: BusinessScopeParams, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: queryKeys.creatorBusiness.overview(params),
    queryFn: () => getBusinessOverview(params),
    enabled: options.enabled ?? true,
    ...common,
  });

export const useBusinessPasses = (params: PassesParams, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: queryKeys.creatorBusiness.passes(params),
    queryFn: () => getBusinessPasses(params),
    enabled: options.enabled ?? true,
    ...common,
  });

/** Pages read at most for "every pass" (100 per page → 2,000 passes). */
const ALL_PASSES_MAX_PAGES = 20;

export interface AllBusinessPasses extends SalesSwitch {
  items: PassRow[];
  total: number;
  /** True when the creator has more passes than were read. */
  truncated: boolean;
}

/**
 * Every pass row for the period (all pages, newest first). Used where the
 * screen needs the whole set: the pass list joins its own rows on these, and
 * the empty states decide the next step from them.
 */
export const useAllBusinessPasses = (params: BusinessScopeParams, options: { enabled?: boolean } = {}) =>
  useQuery<AllBusinessPasses>({
    queryKey: queryKeys.creatorBusiness.allPasses(params),
    queryFn: async () => {
      const items: PassRow[] = [];
      let total = 0;
      let sales: SalesSwitch = { salesEnabled: true, salesDisabledReason: null };
      for (let page = 1; page <= ALL_PASSES_MAX_PAGES; page += 1) {
        const response = await getBusinessPasses({ ...params, page, pageSize: 100, sort: 'newest', dir: 'desc' });
        items.push(...response.items);
        total = response.pagination.total;
        sales = { salesEnabled: response.salesEnabled, salesDisabledReason: response.salesDisabledReason };
        if (items.length >= total || response.items.length === 0) break;
      }
      return { items, total, truncated: items.length < total, ...sales };
    },
    enabled: options.enabled ?? true,
    ...common,
  });

export const useBusinessPass = (passId: string | undefined, params: BusinessScopeParams) =>
  useQuery({
    queryKey: queryKeys.creatorBusiness.pass(passId ?? '', params),
    queryFn: () => getBusinessPass(passId as string, params),
    enabled: Boolean(passId),
    ...common,
  });

/** Person lists carry emails: the server never caches them, and neither do we for long. */
export const useBusinessCustomers = (params: CustomersParams, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: queryKeys.creatorBusiness.customers(params),
    queryFn: () => getBusinessCustomers(params),
    enabled: options.enabled ?? true,
    ...common,
    staleTime: 30_000,
  });

export const useBusinessCustomer = (customerId: string | undefined, params: BusinessScopeParams & PageParams) =>
  useQuery({
    queryKey: queryKeys.creatorBusiness.customer(customerId ?? '', params),
    queryFn: () => getBusinessCustomer(customerId as string, params),
    enabled: Boolean(customerId),
    ...common,
    staleTime: 30_000,
  });

export const useBusinessSources = (params: BusinessScopeParams, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: queryKeys.creatorBusiness.sources(params),
    queryFn: () => getBusinessSources(params),
    enabled: options.enabled ?? true,
    ...common,
  });

export const useBusinessPayouts = (params: BusinessScopeParams, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: queryKeys.creatorBusiness.payouts(params),
    queryFn: () => getBusinessPayouts(params),
    enabled: options.enabled ?? true,
    ...common,
  });

/**
 * Plays of a channel's pass videos (aggregates only) for one of the periods
 * that endpoint knows. Disabled until the pass's channel is known.
 */
export const usePassVideoWatch = (
  channelId: number | undefined,
  params: { period: PassWatchPeriod; passId?: string },
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: queryKeys.creatorBusiness.passVideoWatch(channelId ?? 0, params),
    queryFn: () => getPassVideoWatch(channelId as number, params),
    enabled: (options.enabled ?? true) && typeof channelId === 'number' && channelId > 0,
    ...common,
  });

// --- Creator actions -------------------------------------------------------------------
//
// Every action answers the pass's new state. It is written straight into every
// cached business answer that shows the pass (lists, pass detail, videos), then
// the business screens, the creator's pass list and the pass page are read
// again (the server dropped its own cache for this creator). Pausing is shown
// at once (optimistic) and put back if the server refuses; resuming waits for
// the server, which may refuse it with the reasons.

export const passVideosKey = (passId: string) => [...queryKeys.creatorBusiness.all, 'passVideos', passId] as const;
export const readinessKey = (channelId: number | null | undefined) =>
  [...queryKeys.creatorBusiness.all, 'readiness', channelId ?? 'all'] as const;

function writeSummary(queryClient: QueryClient, summary: PassSummary): void {
  queryClient.setQueriesData<unknown>({ queryKey: queryKeys.creatorBusiness.all }, (data: unknown) => applyPassSummary(data, summary));
}

function refreshAfterAction(queryClient: QueryClient, passId: string): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.creatorBusiness.all }),
    queryClient.invalidateQueries({ queryKey: ['creator-passes'] }),
    queryClient.invalidateQueries({ queryKey: ['pass', passId] }),
  ]);
}

type Snapshot = Array<[QueryKey, unknown]>;

export const useSaleAction = () => {
  const queryClient = useQueryClient();
  return useMutation<SaleActionResponse, unknown, { passId: string; action: 'pause' | 'resume' }, { snapshot: Snapshot }>({
    mutationFn: ({ passId, action }) => (action === 'pause' ? pausePassSale(passId) : resumePassSale(passId)),
    onMutate: async ({ passId, action }) => {
      if (action !== 'pause') return { snapshot: [] };
      await queryClient.cancelQueries({ queryKey: queryKeys.creatorBusiness.all });
      const snapshot = queryClient.getQueriesData({ queryKey: queryKeys.creatorBusiness.all }) as Snapshot;
      const current = snapshot.map(([, data]) => findPassSummary(data, passId)).find(Boolean);
      if (current) writeSummary(queryClient, optimisticPaused(current));
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData<unknown>(key, data));
    },
    onSuccess: (data) => writeSummary(queryClient, data.pass),
    onSettled: (_data, _error, { passId }) => refreshAfterAction(queryClient, passId),
  });
};

/** The videos of a pass with, per video, why it cannot be sold and whether it can be removed. */
export const useCreatorPassVideos = (passId: string | undefined) =>
  useQuery({
    queryKey: passVideosKey(passId ?? ''),
    queryFn: () => getCreatorPassVideos(passId as string),
    enabled: Boolean(passId),
    staleTime: 15_000,
    retry,
  });

function onVideosAnswer(queryClient: QueryClient, passId: string, answer: PassVideosResponse): void {
  const { pass, videos, buyersWithAccess, reorderable } = answer;
  queryClient.setQueryData<PassVideosResponse>(passVideosKey(passId), { pass, videos, buyersWithAccess, reorderable });
  writeSummary(queryClient, pass);
}

export const useRemovePassVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<RemoveVideoResponse, unknown, { passId: string; videoId: string; confirmBuyersWithAccess?: number }>({
    mutationFn: ({ passId, videoId, confirmBuyersWithAccess }) => removeCreatorPassVideo(passId, videoId, confirmBuyersWithAccess),
    onSuccess: (data, { passId }) => onVideosAnswer(queryClient, passId, data),
    onSettled: (_data, _error, { passId }) => refreshAfterAction(queryClient, passId),
  });
};

export const useCheckPassVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<CheckVideoResponse, unknown, { passId: string; videoId: string }>({
    mutationFn: ({ passId, videoId }) => checkCreatorPassVideo(passId, videoId),
    onSuccess: (data, { passId }) => {
      onVideosAnswer(queryClient, passId, data);
      if (data.outcome === 'ok' || data.outcome === 'problem') void refreshAfterAction(queryClient, passId);
    },
  });
};

/** Selling readiness of one channel (or of every channel when none is chosen). */
export const useSellingReadiness = (channelId: number | null | undefined, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: readinessKey(channelId),
    queryFn: () => getSellingReadiness(channelId),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
    retry,
  });

export const useRequestPassSalesReview = () => {
  const queryClient = useQueryClient();
  return useMutation<ReviewRequestResponse, unknown, { channelId: number; message?: string }>({
    mutationFn: ({ channelId, message }) => requestPassSalesReview(channelId, message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...queryKeys.creatorBusiness.all, 'readiness'] }),
  });
};

export const useReplacePassVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<ReplaceVideoResponse, unknown, { passId: string; videoId: string; srcUrl: string; title?: string }>({
    mutationFn: ({ passId, videoId, srcUrl, title }) => replaceCreatorPassVideo(passId, videoId, srcUrl, title),
    onSuccess: (data, { passId }) => onVideosAnswer(queryClient, passId, data),
    onSettled: (_data, _error, { passId }) => refreshAfterAction(queryClient, passId),
  });
};
