import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  classifyStudioStartError,
  pruneStudioStartKeys,
  studioOperationPollDelay,
  studioStartKey,
  mergeStudioOperation,
  useStudioOperation,
  visibleStudioOperations,
  STUDIO_START_FAILED,
} from "../useStudioOperation";
import { notifyStudioUsageChanged } from "../useStudioBalance";
import { thumbnailStudioApi } from "../../api/thumbnailStudio";
import {
  studioOperation,
  operationId,
  projectId,
} from "../../tests/fixtures/studio";
import type { StudioQuoteInput } from "../../types/thumbnailStudio";
jest.mock("../useStudioAccount", () => ({
  useStudioAccount: () => "clerk:alice",
}));
jest.mock("../useStudioBalance", () => ({
  notifyStudioUsageChanged: jest.fn(),
}));
jest.mock("../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: {
    quote: jest.fn(),
    start: jest.fn(),
    operation: jest.fn(),
  },
  studioError: (e: any) => ({ code: "NETWORK_ERROR", message: e.message }),
}));
const api = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const running = (overrides = {}) =>
  studioOperation({ state: "running", startedAt: "2026-09-26T10:00:00Z", ...overrides });
const generateInput: StudioQuoteInput = {
  items: [{ projectId, revisionId: "revision-one", action: "generate", input: { conceptIndex: 0, conceptCount: 1, quality: "high" } }],
};
/** One click on "Generate 1 concept · 18 credits" (the fixture quote costs 18). */
const click = (overrides: Partial<Parameters<ReturnType<typeof useStudioOperation>["run"]>[0]> = {}) => ({
  key: "generate:1:high",
  credits: 18,
  request: jest.fn(async () => generateInput),
  ...overrides,
});
const startKey = () =>
  JSON.parse(localStorage.getItem("thumbnail-studio:start:v1:" + operationId)!).key;
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(global, "crypto", {
    configurable: true,
    value: { randomUUID: jest.fn(() => operationId) },
  });
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  api.operation.mockResolvedValue(studioOperation());
  api.quote.mockResolvedValue(studioOperation());
});
afterEach(() => client.clear());
it("persists the exact start key and reuses it after reload", () => {
  const key = studioStartKey(operationId);
  expect(JSON.parse(localStorage.getItem("thumbnail-studio:start:v1:" + operationId)!).key).toBe(
    key,
  );
  expect(studioStartKey(operationId)).toBe(key);
  expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
});
it("keeps terminal results and credit settlement when an older response arrives", () => {
  const completed = studioOperation({
    state: "succeeded",
    startedAt: "2026-09-26T10:00:00Z",
    capturedCredits: 18,
  });
  completed.items[0].state = "succeeded";
  expect(
    mergeStudioOperation(completed, studioOperation({ state: "running" })),
  ).toBe(completed);
  expect(
    mergeStudioOperation(
      completed,
      studioOperation({ state: "succeeded", startedAt: completed.startedAt }),
    ),
  ).toBe(completed);
});
it("quotes then starts in one click, with the Idempotency-Key stored before the start is sent", async () => {
  let storedAtStart: string | null = null;
  api.start.mockImplementation(async (_id, key) => {
    storedAtStart = localStorage.getItem("thumbnail-studio:start:v1:" + operationId);
    expect(JSON.parse(storedAtStart!).key).toBe(key);
    return running();
  });
  const options = click();
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  let started: unknown;
  await act(async () => { started = await result.current.run(options); });
  expect(options.request).toHaveBeenCalledTimes(1);
  expect(api.quote).toHaveBeenCalledWith(generateInput);
  expect(api.start).toHaveBeenCalledWith(operationId, startKey());
  expect(api.quote.mock.invocationCallOrder[0]).toBeLessThan(api.start.mock.invocationCallOrder[0]);
  expect(storedAtStart).not.toBeNull();
  expect(started).toMatchObject({ id: operationId });
  expect(result.current.actions).toEqual({});
  expect(notifyStudioUsageChanged).toHaveBeenCalled();
  await waitFor(() => expect(result.current.operations.map((op) => op.id)).toEqual([operationId]));
});
it("handles a double click once: one quote, one start", async () => {
  let finish!: (value: ReturnType<typeof studioOperation>) => void;
  api.start.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  let first!: Promise<unknown>;
  act(() => {
    first = result.current.run(click());
    void result.current.run(click());
  });
  await waitFor(() => expect(api.start).toHaveBeenCalledTimes(1));
  expect(result.current.working).toBe("generate:1:high");
  await act(async () => { finish(running()); await first; });
  expect(api.quote).toHaveBeenCalledTimes(1);
  expect(api.start).toHaveBeenCalledTimes(1);
  expect(result.current.busy).toBe(false);
});
it("sends a start whose answer was lost again with the same operation and key, never a new quote", async () => {
  api.start
    .mockRejectedValueOnce(new Error("Network Error"))
    .mockResolvedValue(running());
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => { await result.current.run(click()); });
  expect(result.current.actions["generate:1:high"].problem).toEqual({ kind: "retry", message: expect.stringMatching(/same start safely/) });
  await act(async () => { await result.current.run(click()); });
  expect(api.quote).toHaveBeenCalledTimes(1);
  expect(api.start).toHaveBeenCalledTimes(2);
  expect(api.start.mock.calls[0]).toEqual(api.start.mock.calls[1]);
  expect(api.start.mock.calls[0][1]).toBe(startKey());
  expect(result.current.actions["generate:1:high"]).toBeUndefined();
});
it("shows work whose start answer was lost but which did start", async () => {
  api.start.mockRejectedValue(new Error("Network Error"));
  api.operation.mockResolvedValue(running());
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => { await result.current.run(click()); });
  expect(result.current.actions["generate:1:high"]).toBeUndefined();
  await waitFor(() => expect(result.current.operations.map((op) => op.id)).toEqual([operationId]));
});
it("refuses to start when durable storage is unavailable", async () => {
  const spy = jest.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("Storage blocked");
  });
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => { await result.current.run(click()); });
  expect(api.start).not.toHaveBeenCalled();
  expect(result.current.actions["generate:1:high"].problem?.message).toBe("Storage blocked");
  spy.mockRestore();
});
it("waits for one more click when the quote's price is not the price on the button", async () => {
  api.quote.mockResolvedValue(studioOperation({ quotedCredits: 20 }));
  api.start.mockResolvedValue(running());
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => { await result.current.run(click()); });
  expect(api.start).not.toHaveBeenCalled();
  expect(result.current.actions["generate:1:high"]).toEqual({ priceChange: { credits: 20 } });
  expect(result.current.announcement).toBe("The price is now 20 credits.");
  let started: unknown;
  await act(async () => { started = await result.current.confirm("generate:1:high"); });
  expect(api.quote).toHaveBeenCalledTimes(1);
  expect(api.start).toHaveBeenCalledWith(operationId, startKey());
  expect(started).toMatchObject({ id: operationId });
  expect(result.current.actions["generate:1:high"]).toBeUndefined();
});
it("asks for one click at the quoted price when the button could show none", async () => {
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => { await result.current.run(click({ credits: null })); });
  expect(api.start).not.toHaveBeenCalled();
  expect(result.current.actions["generate:1:high"]).toEqual({ priceChange: { credits: 18 } });
});
it.each(["BRIEF_CHANGED", "QUOTE_EXPIRED"])("prices and starts the same work once more after %s, inside the same click", async (code) => {
  const newer = { ...generateInput, items: [{ ...generateInput.items[0], revisionId: "revision-two" }] };
  const options = click({ request: jest.fn().mockResolvedValueOnce(generateInput).mockResolvedValueOnce(newer) });
  api.start
    .mockRejectedValueOnce({ response: { status: 409, data: { error: { code } } } })
    .mockResolvedValue(running());
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  let started: unknown;
  await act(async () => { started = await result.current.run(options); });
  expect(options.request).toHaveBeenCalledTimes(2);
  expect(api.quote).toHaveBeenNthCalledWith(2, newer);
  expect(api.start).toHaveBeenCalledTimes(2);
  expect(started).toMatchObject({ id: operationId });
  expect(result.current.actions).toEqual({});
});
it("shows a plain error when the new attempt is refused again", async () => {
  api.start.mockRejectedValue({ response: { status: 409, data: { error: { code: "BRIEF_CHANGED", message: "The brief changed. Review a new quote." } } } });
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => { await result.current.run(click()); });
  expect(api.quote).toHaveBeenCalledTimes(2);
  expect(api.start).toHaveBeenCalledTimes(2);
  expect(result.current.actions["generate:1:high"].problem).toEqual({ kind: "other", message: STUDIO_START_FAILED });
  expect(STUDIO_START_FAILED).toBe("Couldn't start — try again.");
});
it("keeps a refused start next to its button and refreshes the balance after a 402", async () => {
  api.start.mockRejectedValue({ response: { status: 402, data: { error: { code: "INSUFFICIENT_CREDITS", message: "You do not have enough available credits." } } } });
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => { await result.current.run(click()); });
  expect(result.current.actions["generate:1:high"].problem?.kind).toBe("credits");
  expect(notifyStudioUsageChanged).toHaveBeenCalled();
  expect(api.start).toHaveBeenCalledTimes(1);
});
it("shows a request that could not be built or priced next to its button, without starting", async () => {
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => {
    await result.current.run(click({ request: jest.fn().mockRejectedValue(new Error("Save your instructions first")) }));
  });
  expect(api.quote).not.toHaveBeenCalled();
  expect(result.current.actions["generate:1:high"].problem).toEqual({ kind: "other", message: "Save your instructions first" });
});
it("restores only account-scoped valid operation IDs without starting anything", async () => {
  api.operation.mockResolvedValue(running());
  localStorage.setItem(
    "thumbnail-studio:operations:clerk:alice:" + projectId,
    JSON.stringify([operationId, "../../another"]),
  );
  localStorage.setItem(
    "thumbnail-studio:operations:clerk:bob:" + projectId,
    JSON.stringify(["33333333-3333-4333-8333-333333333333"]),
  );
  const { result } = renderHook(() => useStudioOperation(projectId), {
    wrapper,
  });
  await waitFor(() => expect(result.current.operations).toHaveLength(1));
  expect(api.operation).toHaveBeenCalledWith(operationId);
  expect(api.start).not.toHaveBeenCalled();
  expect(api.operation).toHaveBeenCalledTimes(1);
});
it("never shows a stored quote that did not start and removes it from storage", async () => {
  const storageKey = "thumbnail-studio:operations:clerk:alice:" + projectId;
  localStorage.setItem(storageKey, JSON.stringify([operationId]));
  api.operation.mockResolvedValue(studioOperation());
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await waitFor(() => expect(localStorage.getItem(storageKey)).toBeNull());
  expect(result.current.operations).toEqual([]);
  expect(api.start).not.toHaveBeenCalled();
});
const refused = (status: number, code?: string, message?: string) => ({ response: { status, data: { error: { code, message } } } });
it.each([
  ["a 402", refused(402, "INSUFFICIENT_CREDITS"), "credits", /enough credits/],
  ["a changed brief", refused(409, "BRIEF_CHANGED"), "retired", /^Couldn't start — try again\.$/],
  ["an expired quote", refused(409, "QUOTE_EXPIRED"), "retired", /^Couldn't start — try again\.$/],
  ["a paused Studio", refused(503, "STUDIO_PAUSED"), "unavailable", /paused for now. Your work is saved/],
  ["an unavailable worker", refused(503, "STUDIO_UNAVAILABLE"), "unavailable", /temporarily unavailable. Your work is saved/],
  ["today's AI capacity reached", refused(503, "AI_DAILY_CAPACITY"), "unavailable", /^AI Thumbnails has reached today's capacity\. Try again after midnight UTC\. No credits were used\.$/],
  ["a lost connection", new Error("Network Error"), "retry", /could not be confirmed. You can retry this same start safely/],
  ["a server failure", refused(500, "INTERNAL_ERROR", "The studio could not complete this request."), "retry", /same start safely/],
  ["a refused account", refused(403, "FORBIDDEN", "This account cannot perform this action."), "other", /^This account cannot do this\. Your saved work is unchanged\.$/],
  ["a conflicting change", refused(409, "CONFLICT", "This changed in the meantime. Reload and try again."), "other", /^This changed in the meantime\. Reload the page, then try again\.$/],
  ["an unprocessable request", refused(422, "UNPROCESSABLE_REQUEST", "The studio cannot process this request."), "other", /^The Studio cannot process this request\./],
  ["a 409 without a message", refused(409), "other", /Reload the page, then try again/],
] as const)("maps %s to what the creator can do next", (_label, failure, kind, message) => {
  const problem = classifyStudioStartError(failure);
  expect(problem.kind).toBe(kind);
  expect(problem.message).toMatch(message);
  expect(problem.message).not.toMatch(/price/i);
  if (kind !== "retry") expect(problem.message).not.toMatch(/retry this same start/);
});
it.each([
  ["running work", "running", 0, undefined, false, 2_000],
  ["a first failed read", "running", 1, new Error("Network Error"), false, 2_000],
  ["a second failed read", "running", 2, new Error("Network Error"), false, 10_000],
  ["repeated failed reads", "running", 5, new Error("Network Error"), false, 30_000],
  ["a background tab", "running", 0, undefined, true, 10_000],
  ["an operation that no longer exists", "running", 1, { response: { status: 404 } }, false, false],
  ["a quote that never started", "quoted", 0, undefined, false, false],
  ["finished work", "succeeded", 0, undefined, false, false],
] as const)("polls %s at the expected pace", (_label, state, failures, error, hidden, delay) => {
  expect(studioOperationPollDelay(studioOperation({ state }), failures, error, hidden)).toBe(delay);
});
it("stops reading an operation that no longer exists and forgets it", async () => {
  const storageKey = "thumbnail-studio:operations:clerk:alice:" + projectId;
  localStorage.setItem(storageKey, JSON.stringify([operationId]));
  localStorage.setItem("thumbnail-studio:start:v1:" + operationId, JSON.stringify({ key: "old", at: Date.now() }));
  api.operation.mockRejectedValue({ response: { status: 404, data: { error: { code: "NOT_FOUND", message: "Gone" } } } });
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await waitFor(() => expect(localStorage.getItem(storageKey)).toBeNull());
  expect(localStorage.getItem("thumbnail-studio:start:v1:" + operationId)).toBeNull();
  expect(result.current.queryErrors).toEqual([]);
  expect(result.current.operations).toEqual([]);
  expect(api.operation).toHaveBeenCalledTimes(1);
});
it("shows active work and only the latest finished operation, pruning the rest from storage", async () => {
  const ids = ["aaaaaaaa-0000-4000-8000-000000000001", "aaaaaaaa-0000-4000-8000-000000000002", "aaaaaaaa-0000-4000-8000-000000000003"];
  const older = studioOperation({ id: ids[0], state: "succeeded", startedAt: "2026-09-26T09:00:00Z", finishedAt: "2026-09-26T09:05:00Z" });
  const latest = studioOperation({ id: ids[1], state: "failed", startedAt: "2026-09-26T10:00:00Z", finishedAt: "2026-09-26T10:05:00Z" });
  const active = studioOperation({ id: ids[2], state: "running", startedAt: "2026-09-26T11:00:00Z" });
  const byId = new Map([older, latest, active].map(operation => [operation.id, operation]));
  api.operation.mockImplementation(async id => byId.get(id)!);
  const storageKey = "thumbnail-studio:operations:clerk:alice:" + projectId;
  localStorage.setItem(storageKey, JSON.stringify(ids));
  for (const id of ids) localStorage.setItem("thumbnail-studio:start:v1:" + id, JSON.stringify({ key: id, at: Date.now() }));
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await waitFor(() => expect(result.current.operations.map(operation => operation.id)).toEqual([ids[1], ids[2]]));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual([ids[1], ids[2]]));
  expect(localStorage.getItem("thumbnail-studio:start:v1:" + ids[0])).toBeNull();
  expect(localStorage.getItem("thumbnail-studio:start:v1:" + ids[1])).toBeNull();
  expect(localStorage.getItem("thumbnail-studio:start:v1:" + ids[2])).not.toBeNull();
});
it("expires and caps stored idempotency keys, dating keys written without a date", () => {
  const now = Date.parse("2026-09-26T12:00:00Z");
  localStorage.setItem("thumbnail-studio:start:v1:expired", JSON.stringify({ key: "a", at: now - 25 * 60 * 60 * 1000 }));
  localStorage.setItem("thumbnail-studio:start:v1:undated", "plain-key");
  for (let index = 0; index < 55; index++) localStorage.setItem(`thumbnail-studio:start:v1:recent-${index}`, JSON.stringify({ key: String(index), at: now - index * 1000 }));
  pruneStudioStartKeys(now);
  expect(localStorage.getItem("thumbnail-studio:start:v1:expired")).toBeNull();
  expect(JSON.parse(localStorage.getItem("thumbnail-studio:start:v1:undated")!)).toEqual({ key: "plain-key", at: now });
  const kept = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)!).filter(name => name.startsWith("thumbnail-studio:start:v1:"));
  expect(kept).toHaveLength(50);
  expect(kept).toContain("thumbnail-studio:start:v1:recent-0");
  expect(kept).not.toContain("thumbnail-studio:start:v1:recent-54");
});
it("announces a start and later state changes for a live region", async () => {
  api.start.mockResolvedValue(running());
  const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
  await act(async () => { await result.current.run(click()); });
  expect(result.current.announcement).toBe("1 concept: started.");
  api.operation.mockResolvedValue(studioOperation({ state: "succeeded", startedAt: "2026-09-26T10:00:00Z", finishedAt: "2026-09-26T10:01:00Z" }));
  await act(async () => { await client.invalidateQueries(); });
  await waitFor(() => expect(result.current.announcement).toBe("1 concept: Ready."));
});
describe("retries keep their entry point", () => {
  const at = (offset: number) => new Date(Date.now() + offset).toISOString();
  const ids = {
    failed: "bbbbbbbb-0000-4000-8000-000000000001",
    retry: "bbbbbbbb-0000-4000-8000-000000000002",
    other: "bbbbbbbb-0000-4000-8000-000000000003",
  };
  // Concept 2 of 3 failed; the others are ready.
  const failedWork = () => {
    const op = studioOperation({ id: ids.failed, state: "partial", startedAt: at(-600_000), finishedAt: at(-300_000) });
    op.items = [0, 1, 2].map((index) => ({
      ...op.items[0],
      id: `concept-${index}`,
      input: { conceptIndex: index, conceptCount: 3, quality: "high" as const },
      state: index === 1 ? ("failed" as const) : ("succeeded" as const),
      retryable: index === 1,
      retryMode: index === 1 ? ("identical_item" as const) : null,
      preparedConcept: { name: `Concept ${index + 1}` },
    }));
    return op;
  };
  const retryInput = {
    items: [{ projectId, revisionId: "revision-one", action: "generate" as const, input: { conceptIndex: 1, conceptCount: 3, quality: "high" as const } }],
    retryOfItemId: "concept-1",
  };
  const links = { [ids.retry]: { itemId: "concept-1", input: retryInput } };
  it("never shows a quote that did not start, however recent", () => {
    const failed = failedWork();
    const quote = studioOperation({ id: ids.retry });
    const expired = studioOperation({ id: ids.other, state: "expired", quoteExpiresAt: at(-1_000) });
    expect(visibleStudioOperations([failed, quote, expired], links).map((op) => op.id)).toEqual([ids.failed]);
  });
  it("keeps failed work in view while its retry runs, and lets it go once the retry has run", () => {
    const failed = failedWork();
    const retrying = studioOperation({ id: ids.retry, state: "running", startedAt: at(-1_000) });
    expect(visibleStudioOperations([failed, retrying], links).map((op) => op.id)).toEqual([ids.failed, ids.retry]);
    const succeeded = studioOperation({ id: ids.retry, state: "succeeded", startedAt: at(-1_000), finishedAt: at(-500) });
    succeeded.items[0] = { ...succeeded.items[0], state: "succeeded" };
    expect(visibleStudioOperations([failed, succeeded], links).map((op) => op.id)).toEqual([ids.retry]);
    // A retry that failed again holds its own Retry entry instead.
    const failedAgain = studioOperation({ id: ids.retry, state: "failed", startedAt: at(-1_000), finishedAt: at(-500) });
    failedAgain.items[0] = { ...failedAgain.items[0], state: "failed", retryable: true, retryMode: "identical_item" };
    expect(visibleStudioOperations([failed, failedAgain], links).map((op) => op.id)).toEqual([ids.retry]);
  });
  it("reads which output a retry retries from the operation, without a link stored in this browser", () => {
    const failed = failedWork();
    const retryItem = (op: ReturnType<typeof studioOperation>) => ({ ...op.items[0], ...retryInput.items[0], id: "retry-item", retryOfItemId: "concept-1" });
    const retrying = studioOperation({ id: ids.retry, state: "running", startedAt: at(-1_000) });
    retrying.items = [retryItem(retrying)];
    expect(visibleStudioOperations([failed, retrying], {}).map((op) => op.id)).toEqual([ids.failed, ids.retry]);
    const succeeded = studioOperation({ id: ids.retry, state: "succeeded", startedAt: at(-1_000), finishedAt: at(-500) });
    succeeded.items = [{ ...retryItem(succeeded), state: "succeeded" }];
    expect(visibleStudioOperations([failed, succeeded], {}).map((op) => op.id)).toEqual([ids.retry]);
  });
  it("links a started retry to its failed output in storage and drops the link with the work", async () => {
    api.quote.mockResolvedValue(studioOperation({ id: ids.retry }));
    api.start.mockResolvedValue(studioOperation({ id: ids.retry, state: "running", startedAt: at(-1_000) }));
    api.operation.mockResolvedValue(studioOperation({ id: ids.retry, state: "running", startedAt: at(-1_000) }));
    const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
    await act(async () => {
      await result.current.run({ key: "retry:concept-1", credits: 18, request: async () => retryInput });
    });
    const stored = "thumbnail-studio:retries:clerk:alice:" + projectId;
    expect(result.current.retryLinks[ids.retry]).toEqual({ itemId: "concept-1", input: retryInput });
    expect(JSON.parse(localStorage.getItem(stored)!)).toEqual(links);
    act(() => result.current.forget(ids.retry));
    await waitFor(() => expect(localStorage.getItem(stored)).toBeNull());
    expect(result.current.retryLinks).toEqual({});
  });
});
describe("started work and focus", () => {
  const added: HTMLElement[] = [];
  const add = <T extends HTMLElement>(element: T) => {
    document.body.appendChild(element);
    added.push(element);
    return element;
  };
  const workPanel = () => {
    const panel = add(document.createElement("section"));
    panel.id = `studio-operation-${operationId}`;
    panel.scrollIntoView = jest.fn();
    const heading = document.createElement("h3");
    heading.tabIndex = -1;
    heading.setAttribute("data-studio-focus", "");
    panel.appendChild(heading);
    return { panel, heading };
  };
  afterEach(() => added.splice(0).forEach((element) => element.remove()));
  it("moves focus to the started work when focus is still on the button that started it", async () => {
    const button = add(document.createElement("button"));
    button.focus();
    const { panel, heading } = workPanel();
    api.start.mockResolvedValue(running());
    const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
    await act(async () => { await result.current.run(click()); });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(panel.scrollIntoView).toHaveBeenCalled();
  });
  it("leaves focus where the creator is typing and announces the start instead", async () => {
    const button = add(document.createElement("button"));
    const brief = add(document.createElement("textarea"));
    button.focus();
    const { panel, heading } = workPanel();
    let resolve!: (value: ReturnType<typeof studioOperation>) => void;
    api.start.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const { result } = renderHook(() => useStudioOperation(projectId), { wrapper });
    let pending!: Promise<unknown>;
    act(() => { pending = result.current.run(click()); });
    await waitFor(() => expect(api.start).toHaveBeenCalled());
    brief.focus();
    await act(async () => { resolve(running()); await pending; });
    await act(async () => { await new Promise((done) => setTimeout(done, 20)); });
    expect(brief).toHaveFocus();
    expect(heading).not.toHaveFocus();
    expect(panel.scrollIntoView).not.toHaveBeenCalled();
    expect(result.current.announcement).toBe("1 concept: started.");
  });
});
