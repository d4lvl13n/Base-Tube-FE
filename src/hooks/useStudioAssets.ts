import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { thumbnailStudioApi } from "../api/thumbnailStudio";
import type { StudioAsset } from "../types/thumbnailStudio";
import { useStudioAccount } from "./useStudioAccount";

export const studioAssetKey = (account: string, id: string) =>
  ["thumbnail-studio", account, "asset", id] as const;
/**
 * Asset preview URLs are signed for a few minutes: refresh a minute before
 * they expire, at most every 4 minutes and at least every 15 seconds.
 */
export function studioAssetRefreshDelay(asset: StudioAsset | undefined, now = Date.now()): number {
  const expires = asset?.urlExpiresAt ? Date.parse(asset.urlExpiresAt) : Number.NaN;
  if (!Number.isFinite(expires)) return 240_000;
  return Math.min(240_000, Math.max(15_000, expires - now - 60_000));
}
/** Owned Studio assets with signed preview URLs that stay valid while shown. */
export function useStudioAssets(
  ids: string[],
  initial: (id: string) => StudioAsset | undefined = () => undefined,
) {
  const account = useStudioAccount();
  const client = useQueryClient();
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: studioAssetKey(account, id),
      queryFn: () => thumbnailStudioApi.asset(id),
      initialData: initial(id),
      staleTime: 60_000,
      refetchInterval: (query: { state: { data: StudioAsset | undefined } }) =>
        studioAssetRefreshDelay(query.state.data),
      refetchOnWindowFocus: true,
      retry: false,
    })),
  });
  /** Share an asset the browser just uploaded or imported. */
  const remember = useCallback(
    (asset: StudioAsset) => client.setQueryData(studioAssetKey(account, asset.id), asset),
    [client, account],
  );
  return { queries, remember };
}
