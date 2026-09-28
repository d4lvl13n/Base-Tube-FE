import { useStudioAccount } from "./useStudioAccount";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { thumbnailStudioApi, studioError } from "../api/thumbnailStudio";
import { STUDIO_GENERIC_ERROR_MESSAGES, studioStatusMessage } from "../api/studioErrors";
import type {
  StudioOperation,
  StudioQuoteInput,
} from "../types/thumbnailStudio";
import { notifyStudioUsageChanged } from "./useStudioBalance";
import { studioStartUnavailableMessage } from "./useStudioCapabilities";
import { studioOperationName, studioStateLabels } from "../utils/studioLabels";
/** Why a one-click action did not start, shown next to its button. */
export interface StudioStartProblem {
  kind: "credits" | "retired" | "unavailable" | "retry" | "other";
  message: string;
  /** The server's code and HTTP status, for the technical detail shown in development. */
  code?: string;
  status?: number;
}
/** Shown when the one transparent new attempt after BRIEF_CHANGED / QUOTE_EXPIRED also fails. */
export const STUDIO_START_FAILED = "Couldn't start — try again.";
/**
 * Map a refused start to what the creator can do next. Only network errors and
 * server failures say the same start can be retried: the persisted
 * Idempotency-Key makes that retry safe. `retired` (the brief changed, or the
 * quote expired) is never shown as such: the click prices the work again and
 * starts it once more.
 */
export function classifyStudioStartError(failure: unknown): StudioStartProblem {
  const response = (failure as {
    response?: {
      status?: number;
      data?: { error?: { code?: string; message?: string } };
    };
  })?.response;
  const status = response?.status;
  const code = response?.data?.error?.code;
  const problem = classifyStart(response, status, code);
  return {
    ...problem,
    ...(code ? { code } : {}),
    ...(typeof status === "number" ? { status } : {}),
  };
}
function classifyStart(
  response: { data?: { error?: { message?: string } } } | undefined,
  status: number | undefined,
  code: string | undefined,
): StudioStartProblem {
  // An INTERNAL_ERROR carries the server's internal text: never shown.
  const serverMessage = code === "INTERNAL_ERROR" ? undefined : response?.data?.error?.message;
  if (status === 402 || code === "INSUFFICIENT_CREDITS")
    return { kind: "credits", message: "You do not have enough credits for this." };
  if (code === "BRIEF_CHANGED" || code === "QUOTE_EXPIRED")
    return { kind: "retired", message: STUDIO_START_FAILED };
  if (code === "STUDIO_PAUSED")
    return { kind: "unavailable", message: studioStartUnavailableMessage("paused") };
  if (code === "STUDIO_UNAVAILABLE" || status === 503)
    return { kind: "unavailable", message: studioStartUnavailableMessage(null) };
  if (code === "OPERATION_ALREADY_STARTED")
    return { kind: "other", message: "This work has already started. Its progress is shown here." };
  // Generic refusals of shared services: sending the same start again does not help.
  if (code && STUDIO_GENERIC_ERROR_MESSAGES[code])
    return { kind: "other", message: STUDIO_GENERIC_ERROR_MESSAGES[code] };
  if (!status || status >= 500 || status === 429)
    return {
      kind: "retry",
      message: `${(response && serverMessage) || "This start could not be confirmed."} You can retry this same start safely.`,
    };
  return {
    kind: "other",
    message:
      serverMessage ||
      (status === 403 || status === 409 || status === 422
        ? studioStatusMessage(status)
        : "This start was refused. Your saved work is unchanged."),
  };
}
export const studioOperationKey = (id: string, account: string) =>
  ["thumbnail-studio", account, "operation", id] as const;
export const isStudioTerminal = (state: StudioOperation["state"]) =>
  ["succeeded", "partial", "failed", "expired"].includes(state);
const keyPrefix = "thumbnail-studio:start:v1:";
const START_KEY_TTL = 24 * 60 * 60 * 1000;
const START_KEY_LIMIT = 50;
function readStartKey(raw: string | null): { key: string; at: number } | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value && typeof value.key === "string" && Number.isFinite(value.at))
      return value;
  } catch {
    /* A plain key written before timestamps were stored. */
  }
  return { key: raw, at: Number.NaN };
}
/**
 * Idempotency keys (operation starts and channel handoffs) are durable before
 * the request is sent. A key is kept while its operation can still start or
 * run; the rest expire after 24 hours and at most 50 are kept.
 */
export function studioStartKey(operationId: string): string {
  const storageKey = keyPrefix + operationId;
  const stored = readStartKey(localStorage.getItem(storageKey));
  if (stored) return stored.key;
  const key = crypto.randomUUID();
  const value = JSON.stringify({ key, at: Date.now() });
  localStorage.setItem(storageKey, value);
  if (localStorage.getItem(storageKey) !== value)
    throw new Error(
      "Enable browser storage before starting. This keeps retries from charging twice.",
    );
  pruneStudioStartKeys();
  return key;
}
/** The operation reached a final state: its key can never be needed again. */
export function releaseStudioStartKey(operationId: string) {
  try {
    localStorage.removeItem(keyPrefix + operationId);
  } catch {
    /* Storage unavailable: nothing to release. */
  }
}
export function pruneStudioStartKeys(now = Date.now()) {
  try {
    const entries: Array<[string, number]> = [];
    for (let index = 0; index < localStorage.length; index++) {
      const name = localStorage.key(index);
      if (!name?.startsWith(keyPrefix)) continue;
      const raw = localStorage.getItem(name);
      const stored = readStartKey(raw);
      if (stored && Number.isNaN(stored.at)) {
        // Date an undated key now so it expires like the others.
        localStorage.setItem(name, JSON.stringify({ key: stored.key, at: now }));
        entries.push([name, now]);
      } else entries.push([name, stored?.at ?? 0]);
    }
    const keep = new Set(
      entries
        .filter(([, at]) => now - at < START_KEY_TTL)
        .sort((a, b) => b[1] - a[1])
        .slice(0, START_KEY_LIMIT)
        .map(([name]) => name),
    );
    for (const [name] of entries) if (!keep.has(name)) localStorage.removeItem(name);
  } catch {
    /* Storage unavailable: nothing to prune. */
  }
}
const notFound = (error: unknown) =>
  (error as { response?: { status?: number } } | null)?.response?.status === 404;
/**
 * Poll accepted work quickly, back off after failed reads (2 s, 10 s, then
 * 30 s) and stop for quotes that never started, finished work and operations
 * that no longer exist.
 */
export function studioOperationPollDelay(
  data: StudioOperation | undefined,
  failures: number,
  error: unknown,
  hidden: boolean,
): number | false {
  if (data && (isStudioTerminal(data.state) || data.state === "quoted"))
    return false;
  if (failures > 0 && notFound(error)) return false;
  const delay = failures > 0 ? [2_000, 10_000, 30_000][Math.min(failures, 3) - 1] : 2_000;
  return hidden ? Math.max(delay, 10_000) : delay;
}
/** Work that has ended, or a quote that can no longer start. */
export function isStudioOperationFinished(operation: StudioOperation, now = Date.now()) {
  return (
    isStudioTerminal(operation.state) ||
    (operation.state === "quoted" &&
      Boolean(operation.quoteExpiresAt) &&
      Date.parse(operation.quoteExpiresAt!) <= now)
  );
}
const finishedAt = (operation: StudioOperation) =>
  Date.parse(operation.finishedAt || operation.startedAt || "") || 0;
const latestOf = (operations: StudioOperation[]) =>
  operations.slice().sort((a, b) => finishedAt(b) - finishedAt(a))[0];
/** A started retry and the failed output it retries (fallback for servers without `retryOfItemId`). */
export interface StudioRetryLink {
  itemId: string;
  input: StudioQuoteInput;
}
/**
 * The operations shown: running work; the latest finished work; and finished
 * work holding a failed output that can be retried, until a retry of that
 * output has run or the creator dismisses it. A quote that never started is
 * never shown: pricing is part of one click, not something to review.
 */
export function visibleStudioOperations(
  loaded: StudioOperation[],
  retryLinks: Record<string, StudioRetryLink>,
): StudioOperation[] {
  const started = loaded.filter((operation) => operation.startedAt);
  const latestRan = latestOf(started.filter((operation) => isStudioTerminal(operation.state)));
  // A retry that ran to the end takes over: it succeeded, or it holds its own Retry.
  // The operation read names the output an item retries; this browser's links cover older servers.
  const ran = (operation: StudioOperation | undefined) =>
    Boolean(operation?.startedAt) && isStudioTerminal(operation!.state);
  const retried = new Set([
    ...Object.entries(retryLinks).flatMap(([id, link]) =>
      ran(started.find((operation) => operation.id === id)) ? [link.itemId] : [],
    ),
    ...started
      .filter(ran)
      .flatMap((operation) => operation.items.flatMap((item) => (item.retryOfItemId ? [item.retryOfItemId] : []))),
  ]);
  const holdsRetry = (operation: StudioOperation) =>
    isStudioTerminal(operation.state) &&
    operation.items.some((item) => item.retryable && !retried.has(item.id));
  return started.filter(
    (operation) =>
      !isStudioTerminal(operation.state) ||
      operation === latestRan ||
      holdsRetry(operation),
  );
}
const idPattern = /^[0-9a-f-]{36}$/i;
function readStoredIds(storageScope: string): string[] {
  try {
    const value = JSON.parse(
      localStorage.getItem(`thumbnail-studio:operations:${storageScope}`) || "[]",
    );
    return Array.isArray(value)
      ? value.filter((id) => typeof id === "string" && idPattern.test(id)).slice(-20)
      : [];
  } catch {
    return [];
  }
}
function readRetryLinks(storageScope: string): Record<string, StudioRetryLink> {
  try {
    const value = JSON.parse(
      localStorage.getItem(`thumbnail-studio:retries:${storageScope}`) || "{}",
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([id, link]) =>
          idPattern.test(id) &&
          typeof (link as StudioRetryLink)?.itemId === "string" &&
          Array.isArray((link as StudioRetryLink)?.input?.items),
      ),
    ) as Record<string, StudioRetryLink>;
  } catch {
    return {};
  }
}
export function mergeStudioOperation(
  previous: StudioOperation | undefined,
  next: StudioOperation,
): StudioOperation {
  if (!previous || previous.id !== next.id) return next;
  if (isStudioTerminal(previous.state) && !isStudioTerminal(next.state))
    return previous;
  if (previous.startedAt && !next.startedAt) return previous;
  if (
    next.capturedCredits < previous.capturedCredits ||
    next.releasedCredits < previous.releasedCredits
  )
    return previous;
  return {
    ...next,
    items: next.items.map((item) => {
      const old = previous.items.find((entry) => entry.id === item.id);
      return old &&
        ["succeeded", "failed"].includes(old.state) &&
        !["succeeded", "failed"].includes(item.state)
        ? old
        : item;
    }),
  };
}
/** One click on a priced button. */
export interface StudioRunOptions {
  /**
   * The action and its exact request (for example `generate:2:high`): its
   * refusal or changed price shows next to the button with the same key.
   */
  key: string;
  /** The price on the button; null when no price could be shown. */
  credits: number | null;
  /**
   * Builds the request against the current saved brief. Called again for the
   * one new attempt after BRIEF_CHANGED or QUOTE_EXPIRED.
   */
  request: () => Promise<StudioQuoteInput>;
  /** A new group replacing a failed preparation: the failed output it retries. */
  retryOf?: string;
  /** The control clicked (default: the focused element); focus follows the work only from there. */
  trigger?: Element | null;
}
export interface StudioActionState {
  problem?: StudioStartProblem;
  /**
   * The quote's price differs from the one on the button (or the button had
   * none): this quoted work starts only after one more click.
   */
  priceChange?: { credits: number };
}
type Held = { operation: StudioOperation; input: StudioQuoteInput; options: StudioRunOptions };
export function useStudioOperation(
  scope: string,
  serverIds: string[] = [],
  onChange?: () => void,
) {
  const account = useStudioAccount();
  const storageScope = `${account}:${scope}`;
  const client = useQueryClient();
  const [ids, setIds] = useState<string[]>(() => readStoredIds(storageScope));
  const [retryLinks, setRetryLinks] = useState<Record<string, StudioRetryLink>>(() =>
    readRetryLinks(storageScope),
  );
  useEffect(() => {
    setIds(readStoredIds(storageScope));
    setRetryLinks(readRetryLinks(storageScope));
  }, [storageScope]);
  const [actions, setActions] = useState<Record<string, StudioActionState>>({});
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [revealId, setRevealId] = useState<string | null>(null);
  const revealTrigger = useRef<Element | null>(null);
  // Read by a polite live region: operation state changes, not every poll.
  const [announcement, setAnnouncement] = useState("");
  const knownStates = useRef(new Map<string, string>());
  const inFlight = useRef(false);
  // A quote waiting for one more click after its price changed, per action key.
  const priceChanges = useRef(new Map<string, Held>());
  // A quote whose start could not be confirmed: the next click sends the same
  // start again (same operation, same Idempotency-Key), never a new quote.
  const unconfirmedStarts = useRef(new Map<string, Held>());
  const allIds = Array.from(new Set([...ids, ...serverIds]));
  const callback = useRef(onChange);
  callback.current = onChange;
  const signatures = useRef(new Map<string, string>());
  // Consecutive failed reads per operation, for polling backoff.
  const failures = useRef(new Map<string, number>());
  const queries = useQueries({
    queries: allIds.map((id) => ({
      queryKey: studioOperationKey(id, account),
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        let value: StudioOperation;
        try {
          value = await thumbnailStudioApi.operation(id);
        } catch (failure) {
          failures.current.set(id, (failures.current.get(id) || 0) + 1);
          throw failure;
        }
        failures.current.delete(id);
        if (signal.aborted) throw new Error("Superseded operation read");
        return mergeStudioOperation(
          client.getQueryData<StudioOperation>(studioOperationKey(id, account)),
          value,
        );
      },
      refetchInterval: (query: {
        state: { data: StudioOperation | undefined; error: unknown };
      }) =>
        studioOperationPollDelay(
          query.state.data,
          failures.current.get(id) || 0,
          query.state.error,
          document.visibilityState === "hidden",
        ),
      refetchIntervalInBackground: true,
      retry: false,
    })),
  });
  const loaded = queries.flatMap((query) => (query.data ? [query.data] : []));
  const missingIds = allIds.filter((_id, index) => notFound(queries[index]?.error));
  const operations = visibleStudioOperations(
    loaded.filter((operation) => !missingIds.includes(operation.id)),
    retryLinks,
  );
  useEffect(() => {
    for (const operation of operations) {
      const previousState = knownStates.current.get(operation.id);
      if (previousState && previousState !== operation.state)
        setAnnouncement(
          `${studioOperationName(operation.items)}: ${studioStateLabels[operation.state] || operation.state}.`,
        );
      knownStates.current.set(operation.id, operation.state);
      const signature = JSON.stringify([
        operation.state,
        operation.capturedCredits,
        operation.releasedCredits,
        operation.items.map((item) => [item.id, item.state]),
      ]);
      if (signatures.current.get(operation.id) !== signature) {
        signatures.current.set(operation.id, signature);
        notifyStudioUsageChanged();
        callback.current?.();
      }
    }
  }, [operations]);
  // Quotes that never started (stored by earlier versions of this page, or a
  // start that could not be confirmed and did not happen) are never shown and
  // leave storage once read.
  const hiddenKey = loaded
    .filter((operation) => !operations.includes(operation))
    .map((operation) => operation.id)
    .concat(missingIds)
    .join("|");
  const finishedKey = loaded
    .filter((operation) => isStudioOperationFinished(operation))
    .map((operation) => operation.id)
    .concat(missingIds)
    .join("|");
  useEffect(() => {
    // Keys are needed only while an operation can still start or run.
    for (const id of finishedKey.split("|").filter(Boolean)) releaseStudioStartKey(id);
  }, [finishedKey]);
  const updateIds = useCallback(
    (change: (previous: string[]) => string[]) =>
      setIds((previous) => {
        const next = change(previous);
        try {
          if (next.length)
            localStorage.setItem(
              `thumbnail-studio:operations:${storageScope}`,
              JSON.stringify(next),
            );
          else
            localStorage.removeItem(`thumbnail-studio:operations:${storageScope}`);
        } catch {
          /* Server retains accepted operations; storage is required separately before start. */
        }
        return next;
      }),
    [storageScope],
  );
  const remember = useCallback(
    (operation: StudioOperation) => {
      client.setQueryData(
        studioOperationKey(operation.id, account),
        (old: StudioOperation | undefined) =>
          mergeStudioOperation(old, operation),
      );
      updateIds((previous) =>
        Array.from(new Set([...previous, operation.id])).slice(-20),
      );
    },
    [client, account, updateIds],
  );
  const storeRetryLinks = useCallback(
    (change: (previous: Record<string, StudioRetryLink>) => Record<string, StudioRetryLink>) =>
      setRetryLinks((previous) => {
        const next = change(previous);
        if (next === previous) return previous;
        try {
          if (Object.keys(next).length)
            localStorage.setItem(`thumbnail-studio:retries:${storageScope}`, JSON.stringify(next));
          else localStorage.removeItem(`thumbnail-studio:retries:${storageScope}`);
        } catch {
          /* Storage unavailable: the link lasts while this page is open. */
        }
        return next;
      }),
    [storageScope],
  );
  useEffect(() => {
    // A retry link lives as long as its work is kept.
    storeRetryLinks((previous) =>
      Object.keys(previous).every((id) => ids.includes(id))
        ? previous
        : Object.fromEntries(Object.entries(previous).filter(([id]) => ids.includes(id))),
    );
  }, [ids, storeRetryLinks]);
  useEffect(() => {
    // Stored IDs keep only what is still shown.
    const hidden = hiddenKey.split("|").filter(Boolean);
    if (hidden.length)
      updateIds((previous) =>
        previous.some((id) => hidden.includes(id))
          ? previous.filter((id) => !hidden.includes(id))
          : previous,
      );
  }, [hiddenKey, updateIds]);
  useEffect(() => pruneStudioStartKeys(), []);
  const setAction = (key: string, state: StudioActionState | null) =>
    setActions((previous) => {
      if (!state && !previous[key]) return previous;
      const next = { ...previous };
      if (state) next[key] = state;
      else delete next[key];
      return next;
    });
  /** Stop showing finished work the creator dismissed. */
  const forget = useCallback(
    (id: string) => updateIds((previous) => previous.filter((value) => value !== id)),
    [updateIds],
  );
  /**
   * Start quoted work with the Idempotency-Key stored before the request.
   * `retired` means the quote can no longer start (the brief changed, or it
   * expired): the caller prices the same work once more.
   */
  const startQuoted = async (
    held: Held,
  ): Promise<"started" | "retired" | "refused"> => {
    const { operation, input, options } = held;
    let idempotencyKey: string;
    try {
      idempotencyKey = studioStartKey(operation.id); // durable before the HTTP write
    } catch (failure) {
      setAction(options.key, { problem: { kind: "other", message: (failure as Error).message } });
      return "refused";
    }
    await client.cancelQueries({ queryKey: studioOperationKey(operation.id, account) });
    try {
      const result = await thumbnailStudioApi.start(operation.id, idempotencyKey);
      unconfirmedStarts.current.delete(options.key);
      const retryOf = input.retryOfItemId || options.retryOf;
      if (retryOf)
        storeRetryLinks((previous) => ({ ...previous, [result.id]: { itemId: retryOf, input } }));
      remember(result);
      notifyStudioUsageChanged();
      setAnnouncement(`${studioOperationName(result.items)}: started.`);
      setRevealId(result.id);
      return "started";
    } catch (failure) {
      const problem = classifyStudioStartError(failure);
      if (problem.kind === "retired") {
        unconfirmedStarts.current.delete(options.key);
        return "retired";
      }
      if (problem.kind === "retry") unconfirmedStarts.current.set(options.key, held);
      else unconfirmedStarts.current.delete(options.key);
      setAction(options.key, { problem });
      // A refused start may mean the balance moved elsewhere; show the real one.
      if (problem.kind === "credits") notifyStudioUsageChanged();
      if (problem.kind === "unavailable")
        void client.invalidateQueries({ queryKey: ["thumbnail-studio", "capabilities"] });
      if (problem.kind === "retry" || problem.kind === "other") {
        // Read it once: work that did start (the answer was lost) appears.
        try {
          const read = await thumbnailStudioApi.operation(operation.id);
          if (read.startedAt) {
            unconfirmedStarts.current.delete(options.key);
            setAction(options.key, null);
            remember(read);
            return "started";
          }
        } catch {
          /* Unknown: the next click sends the same start again. */
        }
      }
      return "refused";
    }
  };
  const execute = async (options: StudioRunOptions, first?: Held): Promise<StudioOperation | undefined> => {
    if (inFlight.current) return;
    inFlight.current = true;
    revealTrigger.current =
      options.trigger !== undefined ? options.trigger : document.activeElement;
    setBusy(true);
    setWorking(options.key);
    setAction(options.key, null);
    priceChanges.current.delete(options.key);
    try {
      let held = first || unconfirmedStarts.current.get(options.key);
      for (let attempt = 0; ; attempt++) {
        if (!held) {
          let input: StudioQuoteInput;
          let quoted: StudioOperation;
          try {
            input = await options.request();
            quoted = await thumbnailStudioApi.quote(input);
          } catch (failure) {
            // The server's code and status go with it (development detail); a page error has none.
            const { message, code, status } = studioError(failure);
            setAction(options.key, { problem: { kind: "other", message, ...(status === undefined ? {} : { code, status }) } });
            return;
          }
          held = { operation: quoted, input, options };
          if (options.credits === null || quoted.quotedCredits !== options.credits) {
            priceChanges.current.set(options.key, held);
            setAction(options.key, { priceChange: { credits: quoted.quotedCredits } });
            setAnnouncement(`The price is now ${quoted.quotedCredits} credits.`);
            return;
          }
        }
        const outcome = await startQuoted(held);
        if (outcome === "started") return held.operation;
        if (outcome === "retired" && attempt === 0) {
          held = undefined;
          continue;
        }
        if (outcome === "retired")
          setAction(options.key, { problem: { kind: "other", message: STUDIO_START_FAILED } });
        return;
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
      setWorking(null);
    }
  };
  /**
   * One click: the page's request is quoted and, when the quote's price is the
   * one on the button, started at once. BRIEF_CHANGED or QUOTE_EXPIRED prices
   * the same work once more and starts it; a different price waits for one
   * more click (`confirm`). Resolves with the started work, if any.
   */
  const run = (options: StudioRunOptions) => execute(options);
  /** Start the work whose changed price is shown next to this action. */
  const confirm = (key: string) => {
    const held = priceChanges.current.get(key);
    if (!held) return Promise.resolve(undefined);
    return execute(
      { ...held.options, credits: held.operation.quotedCredits, trigger: undefined },
      held,
    );
  };
  useEffect(() => {
    if (!revealId) return;
    // Bring newly started work into view once and move focus to it, only if
    // focus is still on the control that started it (or nowhere). A creator
    // who moved on, for example typing in the brief, keeps focus; the live
    // region announces it.
    const timer = setTimeout(() => {
      const panel = document.getElementById(`studio-operation-${revealId}`);
      if (!panel) return;
      setRevealId(null);
      const active = document.activeElement;
      if (active && active !== document.body && active !== revealTrigger.current) return;
      panel.scrollIntoView?.({ behavior: "smooth", block: "center" });
      panel.querySelector<HTMLElement>("[data-studio-focus]")?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [revealId, operations.length]);
  return {
    operations,
    run,
    confirm,
    /** Refusals and changed prices, per action key. */
    actions,
    /** The action key whose click is being handled. */
    working,
    busy,
    forget,
    retryLinks,
    /** Operation IDs kept for this scope; page state tied to an operation is pruned with them. */
    trackedIds: ids,
    announcement,
    /** Status reads that failed (their message, code and HTTP status). */
    queryErrors: queries
      .filter((query) => query.error && !notFound(query.error))
      .map((query) => studioError(query.error)),
    remember,
  };
}
