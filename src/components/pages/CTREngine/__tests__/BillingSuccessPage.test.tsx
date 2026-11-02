import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BillingSuccessPage, { BILLING_MAX_POLLS, BILLING_POLL_INTERVAL_MS } from "../BillingSuccessPage";
import { subscriptionsApi } from "../../../../api/subscriptions";
import { notifyStudioUsageChanged } from "../../../../hooks/useStudioBalance";

jest.mock("../../../../api/subscriptions", () => ({ subscriptionsApi: { getMe: jest.fn() } }));
let mockGenerationCredits: number | null = 15;
jest.mock("../../../../hooks/useCTREngine", () => ({ __esModule: true, default: () => ({ usageAccess: mockGenerationCredits === null ? null : { mode: "credits", pricing: { ctr: { generatePerConcept: mockGenerationCredits } } }, isLoadingQuota: false }) }));
jest.mock("../AIThumbnailsLayout", () => ({ __esModule: true, default: ({ children }: any) => <main>{children}</main> }));
jest.mock("../../../../hooks/useStudioAccount", () => ({
  useStudioAccountState: () => ({ account: "clerk:alice", resolved: true, email: null }),
  useStudioAccount: () => "clerk:alice",
}));
jest.mock("../../../../hooks/useStudioBalance", () => ({ notifyStudioUsageChanged: jest.fn() }));

const getMe = subscriptionsApi.getMe as jest.Mock;
const subscription = (status: string) => ({
  planId: "creator", planName: "Creator", interval: "month", status, currentPeriodStart: "2026-09-29T00:00:00Z",
  currentPeriodEnd: "2026-10-29T00:00:00Z", cancelAtPeriodEnd: false, nextInvoiceAt: "2026-10-29T00:00:00Z", amountCents: 2400, currency: "usd",
});
const me = (status: string | null, planCredits: number) => ({
  subscription: status ? subscription(status) : null,
  credits: { available: planCredits, subscription: { available: planCredits, expiresAt: planCredits ? "2026-10-29T00:00:00Z" : null, lots: [] }, other: { available: 0 } },
  videoCredits: 90,
  videosRemaining: Math.floor(planCredits / 90),
  channelProfiles: { limit: 1, used: 0 },
  canSubscribe: status === null,
  upgradeTo: "pro",
});

let client: QueryClient;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockGenerationCredits = 15;
  sessionStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  jest.useRealTimers();
  client.clear();
});
const ReturnedBrief = () => <output data-testid="returned-brief">{useLocation().search}</output>;
const show = (url: string) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/ai-thumbnails/generate" element={<ReturnedBrief />} />
          <Route path="/ai-thumbnails/billing/success" element={<BillingSuccessPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
/** Let pending reads answer. */
const settle = () =>
  act(async () => {
    for (let tick = 0; tick < 5; tick++) await Promise.resolve();
  });
/** Let the pending read answer, then wait one poll interval. */
const nextPoll = async () => {
  await settle();
  await act(async () => {
    jest.advanceTimersByTime(BILLING_POLL_INTERVAL_MS);
  });
};

it("reads the plan every 2 seconds until it is active with its credits, then says so and goes back to the page", async () => {
  getMe
    .mockResolvedValueOnce(me(null, 0)) // the webhook has not landed yet
    .mockResolvedValueOnce(me("active", 0)) // plan on, credits not allocated yet
    .mockResolvedValueOnce(me("active", 540));
  show(`/ai-thumbnails/billing/success?session_id=cs_1&return=${encodeURIComponent("/ai-thumbnails/projects/project-1")}`);
  expect(screen.getByRole("heading")).toHaveTextContent("Confirming your plan…");
  await nextPoll();
  await nextPoll();
  await settle();
  expect(screen.getByRole("heading", { name: "You're on Creator" })).toBeInTheDocument();
  expect(screen.getByText("Up to 36 AI thumbnails if used only for generation.")).toBeInTheDocument();
  expect(getMe).toHaveBeenCalledTimes(3);
  expect(notifyStudioUsageChanged).toHaveBeenCalled();
  expect(screen.getByRole("link", { name: /Back to where you were/ })).toHaveAttribute("href", "/ai-thumbnails/projects/project-1");
  // No more reads once confirmed.
  await nextPoll();
  expect(getMe).toHaveBeenCalledTimes(3);
});

it("after about a minute reports pending activation without promising a payment or delivery time", async () => {
  getMe.mockResolvedValue(me("active", 0));
  show("/ai-thumbnails/billing/success?session_id=cs_1");
  for (let poll = 0; poll < BILLING_MAX_POLLS; poll++) await nextPoll();
  await settle();
  expect(screen.getByRole("heading", { name: "Still waiting for your plan" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Your plan and credits have not appeared yet.");
  expect(screen.getByRole("status")).toHaveTextContent("Do not start another checkout.");
  expect(getMe).toHaveBeenCalledTimes(BILLING_MAX_POLLS);
  // Without a return page, the way on is the projects list.
  expect(screen.getByRole("link", { name: /Go to your projects/ })).toHaveAttribute("href", "/ai-thumbnails/projects");

  getMe.mockResolvedValue(me("active", 540));
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  await settle();
  expect(screen.getByRole("heading", { name: "You're on Creator" })).toBeInTheDocument();
});

it("a free trial counts as ready: says what it includes and that nothing is charged before it ends", async () => {
  getMe.mockResolvedValue({ ...me("trialing", 180), credits: { ...me("trialing", 180).credits, available: 448, other: { available: 268 } }, trialEndsAt: "2026-10-06T12:00:00Z" });
  show("/ai-thumbnails/billing/success?session_id=cs_trial");
  await settle();
  expect(screen.getByRole("heading", { name: "Your free trial of Creator has started" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(/^Nothing is charged before Oct 6\. Cancel before Oct 6 in Settings › Subscription and you pay nothing\./);
  expect(screen.getByText('180 shared credits available from your trial.')).toBeInTheDocument();
  expect(screen.getByText('Up to 12 AI thumbnails if used only for generation.')).toBeInTheDocument();
  expect(screen.getByText('AI edits and audits use the same credits.')).toBeInTheDocument();
  expect(screen.queryByText(/29 AI thumbnails|videos to use/)).not.toBeInTheDocument();
  expect(getMe).toHaveBeenCalledTimes(1);
});

it("returns automatically to the draft only after trial credits are ready", async () => {
  getMe.mockResolvedValueOnce(me("trialing", 0)).mockResolvedValue(me("trialing", 180));
  show(`/ai-thumbnails/billing/success?session_id=cs_test_draft&return=${encodeURIComponent('/ai-thumbnails/generate?draft=visitor-idea')}`);
  await settle();
  expect(screen.queryByTestId('returned-brief')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Back to where you were/ })).toHaveAttribute('href', '/ai-thumbnails/generate?draft=visitor-idea');
  await nextPoll();
  await settle();
  expect(screen.getByTestId('returned-brief')).toHaveTextContent('?draft=visitor-idea');
});


it('shows credits without inventing a thumbnail count while pricing is unavailable', async () => {
  mockGenerationCredits = null;
  getMe.mockResolvedValue(me('trialing', 180));
  show('/ai-thumbnails/billing/success?session_id=cs_trial');
  await settle();
  expect(screen.getByText('180 shared credits available from your trial.')).toBeInTheDocument();
  expect(screen.queryByText(/AI thumbnails if/)).not.toBeInTheDocument();
});

it('does not confirm delivery from a stale video equivalence when actual subscription credits are zero', async () => {
  getMe.mockResolvedValue({ ...me('trialing', 0), videosRemaining: 2 });
  show('/ai-thumbnails/billing/success?session_id=cs_trial');
  await settle();
  expect(screen.getByRole('heading', { name: 'Confirming your plan…' })).toBeInTheDocument();
  expect(screen.queryByText(/has started/)).not.toBeInTheDocument();
});
