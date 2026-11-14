import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BusinessScopeParams } from '../../../../api/creatorBusiness';
import { DEFAULT_PRESET, resolvePeriod, type PeriodPreset, type ResolvedPeriod } from './businessPeriod';
import { parseScope, patchParams, scopeSearch, type ScopeState } from './businessUrlState';

/** The period as API parameters: range=all for all time, else from / to. */
export const periodParams = (period: ResolvedPeriod): Pick<BusinessScopeParams, 'range' | 'from' | 'to'> =>
  period.preset === 'all' || !period.from || !period.to ? { range: 'all' } : { from: period.from, to: period.to };

export interface BusinessScope {
  params: URLSearchParams;
  scope: ScopeState;
  period: ResolvedPeriod;
  /** from / to (or range=all for all time) and channelId, as the API reads them. */
  apiParams: BusinessScopeParams;
  /** Apply a change to the address. Discrete choices push a history entry; typing replaces it. */
  update: (patch: Record<string, string | number | null | undefined>, options?: { resetPage?: boolean; replace?: boolean }) => void;
  setPreset: (preset: Exclude<PeriodPreset, 'custom'>) => void;
  setCustom: (from: string, to: string) => void;
  setChannel: (channelId: number | null) => void;
  /** "?period=…&channel=…" for links to the other business screens. */
  linkSearch: (extra?: Record<string, string | null | undefined>) => string;
}

/**
 * The period and channel of a business screen, read from (and written to)
 * the address. "All time" is sent as range=all: the API starts it on the first
 * checkout or payment and has no previous period for it.
 */
export function useBusinessScope(options: { fallback?: PeriodPreset } = {}): BusinessScope {
  const { fallback = DEFAULT_PRESET } = options;
  const [params, setParams] = useSearchParams();
  const scope = useMemo(() => parseScope(params, fallback), [params, fallback]);
  // The day changes at midnight UTC; the period is recomputed with every address change.
  const period = useMemo(() => resolvePeriod(scope), [scope]);

  const apiParams = useMemo<BusinessScopeParams>(
    () => ({ ...periodParams(period), channelId: scope.channelId ?? undefined }),
    [period, scope.channelId],
  );

  const update = useCallback<BusinessScope['update']>(
    (patch, opts = {}) => {
      setParams(patchParams(params, patch, { resetPage: opts.resetPage }), { replace: opts.replace });
    },
    [params, setParams],
  );

  const setPreset = useCallback(
    (preset: Exclude<PeriodPreset, 'custom'>) => update({ period: preset, from: null, to: null }, { resetPage: true }),
    [update],
  );
  const setCustom = useCallback(
    (from: string, to: string) => update({ period: 'custom', from, to }, { resetPage: true }),
    [update],
  );
  const setChannel = useCallback(
    (channelId: number | null) => update({ channel: channelId }, { resetPage: true }),
    [update],
  );
  const linkSearch = useCallback((extra: Record<string, string | null | undefined> = {}) => scopeSearch(params, extra), [params]);

  return { params, scope, period, apiParams, update, setPreset, setCustom, setChannel, linkSearch };
}
