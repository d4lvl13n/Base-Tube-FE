import { useCallback, useEffect } from "react";
import { QueryClient, useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { ctrApi } from "../api/ctr";
import { useStudioAccount } from "./useStudioAccount";
import { subscriptionKey } from "./useSubscription";

const CHANNEL = "thumbnail-studio-usage";
const LOCAL_EVENT = "thumbnail-studio:usage-changed";
export const studioBalanceKey = (userId: string) =>
  ["thumbnail-studio", "usage", userId] as const;

/** Operation responses can arrive out of order. Always read the settled server balance. */
export async function invalidateStudioBalance(
  client: QueryClient,
  userId: string,
) {
  const queryKey = studioBalanceKey(userId);
  // The plan detail (videos left, credits by origin) moves with the balance.
  void client.invalidateQueries({ queryKey: subscriptionKey(userId), exact: true });
  // Reading the query signal below makes even a non-abortable legacy HTTP read cancellable.
  await client.cancelQueries({ queryKey, exact: true });
  await client.invalidateQueries({ queryKey, exact: true });
}

export function notifyStudioUsageChanged() {
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

type Subscription = { users: number; close: () => void };
const subscriptions = new WeakMap<QueryClient, Map<string, Subscription>>();
function subscribe(client: QueryClient, userId: string) {
  let users = subscriptions.get(client);
  if (!users) {
    users = new Map();
    subscriptions.set(client, users);
  }
  const existing = users.get(userId);
  if (existing) {
    existing.users++;
    return () => release();
  }
  const refresh = () => {
    void invalidateStudioBalance(client, userId);
  };
  let channel: BroadcastChannel | undefined;
  try {
    if (typeof BroadcastChannel !== "undefined")
      channel = new BroadcastChannel(CHANNEL);
  } catch {
    /* Storage fallback below. */
  }
  const onMessage = (message: unknown) => {
    if (
      message &&
      typeof message === "object" &&
      (message as any).userId === userId &&
      (message as any).refresh === true
    )
      refresh();
  };
  if (channel) channel.onmessage = (event) => onMessage(event.data);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== CHANNEL || !event.newValue) return;
    try {
      onMessage(JSON.parse(event.newValue));
    } catch {
      /* Ignore unrelated/malformed signals. */
    }
  };
  const onLocalChange = () => {
    refresh();
    const signal = { userId, refresh: true };
    if (channel) channel.postMessage(signal);
    else
      try {
        // Removing after writing allows identical refresh signals without transmitting balances.
        localStorage.setItem(CHANNEL, JSON.stringify(signal));
        localStorage.removeItem(CHANNEL);
      } catch {
        /* Focus refresh still works when storage is unavailable. */
      }
  };
  const onFocus = () => refresh();
  const onVisibility = () => {
    if (document.visibilityState === "visible") refresh();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCAL_EVENT, onLocalChange);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
  users.set(userId, {
    users: 1,
    close: () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_EVENT, onLocalChange);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  });
  function release() {
    const current = users!.get(userId);
    if (current && --current.users === 0) {
      current.close();
      users!.delete(userId);
    }
  }
  return release;
}

/** One account-scoped balance/quota query shared by every Studio consumer. */
export function useStudioBalance(userId: string, enabled = true) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: studioBalanceKey(userId),
    queryFn: async ({ signal }) => {
      const access = await ctrApi.getQuota();
      if (signal.aborted) throw new Error("Superseded balance request");
      return access;
    },
    enabled,
    staleTime: 30_000,
    // A single subscription owns focus refresh across all observers.
    refetchOnWindowFocus: false,
    retry: 1,
  });
  useEffect(
    () => (enabled ? subscribe(client, userId) : undefined),
    [client, userId, enabled],
  );
  const refresh = useCallback(async () => {
    if (!enabled) return;
    notifyStudioUsageChanged();
  }, [enabled]);
  return {
    usageAccess: query.data ?? null,
    // First load only: background refreshes keep the last balance on screen
    // and must not flicker buttons into a loading state.
    isLoadingQuota: enabled && query.isLoading,
    refreshQuota: refresh,
    // A failed background refresh keeps the last balance and stays silent.
    balanceError: query.data === undefined ? query.error : null,
  };
}

/**
 * The first balance read for the current account failed, so no balance can be
 * shown; `retry` reads it again. Failed background refreshes keep the last
 * balance on screen and never report here.
 */
export function useStudioBalanceLoadFailure() {
  const account = useStudioAccount();
  const client = useQueryClient();
  const { balanceError } = useStudioBalance(account, account !== "anonymous");
  const retrying =
    useIsFetching({ queryKey: studioBalanceKey(account), exact: true }) > 0;
  const retry = useCallback(() => {
    void invalidateStudioBalance(client, account);
  }, [client, account]);
  return { failed: Boolean(balanceError), retrying, retry };
}

/** Available credits from the shared balance query, for Studio priced buttons. */
export function useStudioAvailableCredits(): number | undefined {
  const account = useStudioAccount();
  const { usageAccess } = useStudioBalance(account, account !== "anonymous");
  return usageAccess?.mode === "credits"
    ? usageAccess.creditInfo.available
    : undefined;
}
