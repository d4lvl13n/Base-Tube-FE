import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudioCreditsScope, StudioPaidAction } from "../studio/StudioPaidAction";
import { creditsApi } from "../../../../../api/credits";
import { subscriptionsApi } from "../../../../../api/subscriptions";
import { ctrApi } from "../../../../../api/ctr";
import { readPendingPaidAction } from "../../../../../utils/studioDraft";

// The whole path of a priced action the credits did not cover: the server
// refuses it (402), the creator gets credits in the same window (a pack on
// Stripe, or an upgrade in place), and back on the page the same action is
// offered as its one priced button. It never runs without that click.

jest.mock("../../../../../api/credits", () => ({ creditsApi: { getPacks: jest.fn(), createCheckout: jest.fn() } }));
jest.mock("../../../../../api/ctr", () => ({ ctrApi: { getQuota: jest.fn() } }));
jest.mock("../../../../../api/subscriptions", () => ({
  ...jest.requireActual("../../../../../api/subscriptions"),
  subscriptionsApi: { getPlans: jest.fn(), getMe: jest.fn(), createCheckout: jest.fn(), createPortal: jest.fn(), getUpgradePreview: jest.fn(), upgrade: jest.fn() },
}));
jest.mock("../../../../../hooks/useStudioCapabilities", () => ({ useStudioPricing: () => null }));
jest.mock("../../../../../hooks/useStudioAccount", () => ({ useStudioAccount: () => "clerk:alice" }));

const packs = creditsApi as jest.Mocked<typeof creditsApi>;
const billing = subscriptionsApi as jest.Mocked<typeof subscriptionsApi>;
const PAGE = "/ai-thumbnails/projects/project-1";
const credits = (available: number) => ({ mode: "credits", creditInfo: { available, balance: available, reserved: 0 }, pricing: null });
const breakdown = { available: 50, subscription: { available: 0, expiresAt: null, lots: [] }, other: { available: 50 } };
const catalog = {
  videoCredits: 90,
  videoBreakdown: { concepts: 3, conceptCredits: 15, edits: 2, editCredits: 18, audits: 1, auditCredits: 2 },
  rolloverMonths: 1,
  free: { channelProfiles: 1 },
  plans: [
    { id: "creator", name: "Creator", rank: 1, videosPerMonth: 6, creditsPerMonth: 540, channelProfiles: 1, highlights: [], prices: { month: { amountCents: 2400, currency: "usd" }, year: { amountCents: 19900, currency: "usd", monthlyEquivalentCents: 1658, savingsPercent: 31 } } },
    { id: "pro", name: "Pro", rank: 2, videosPerMonth: 20, creditsPerMonth: 1800, channelProfiles: 3, highlights: [], prices: { month: { amountCents: 4900, currency: "usd" }, year: { amountCents: 39900, currency: "usd", monthlyEquivalentCents: 3325, savingsPercent: 32 } } },
  ],
};
const noPlan = { subscription: null, credits: breakdown, videoCredits: 90, videosRemaining: 0, channelProfiles: { limit: 1, used: 0 }, canSubscribe: true, upgradeTo: null };
const onCreator = {
  ...noPlan,
  subscription: { planId: "creator", planName: "Creator", interval: "month", status: "active", currentPeriodStart: "2026-09-01T00:00:00Z", currentPeriodEnd: "2026-10-01T00:00:00Z", cancelAtPeriodEnd: false, nextInvoiceAt: "2026-10-01T00:00:00Z", amountCents: 2400, currency: "usd" },
  canSubscribe: false,
  upgradeTo: "pro",
};
const refused = { problem: { kind: "credits" as const, message: "You do not have enough credits for this." } };

let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (ctrApi.getQuota as jest.Mock).mockResolvedValue(credits(50));
  packs.getPacks.mockResolvedValue([{ id: "pro", label: "Pro pack", credits: 200, priceCents: 1499, currency: "usd" }]);
  billing.getPlans.mockResolvedValue(catalog as any);
  billing.getMe.mockResolvedValue(noPlan as any);
  Object.assign(window.location, { pathname: PAGE, search: "", href: `http://localhost:3000${PAGE}` });
});
afterEach(() => {
  client.clear();
  Object.assign(window.location, { pathname: "/", search: "", href: "http://localhost:3000" });
});

/** The project page's generate step: one priced button inside its credits scope. */
function Step({ available, state, onRun }: { available: number; state?: typeof refused; onRun: () => void }) {
  return (
    <StudioCreditsScope availableCredits={available}>
      <StudioPaidAction label="Generate 3 concepts" credits={45} actionKey="generate:3:high" availableCredits={available} state={state} onRun={onRun} />
    </StudioCreditsScope>
  );
}
const page = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[PAGE]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );

it("after a pack bought on Stripe, offers the refused action again as one priced button that runs only on click", async () => {
  packs.createCheckout.mockResolvedValue({ sessionId: "cs_1", url: "https://checkout.stripe.test/cs_1", pack: {} as any });
  const onRun = jest.fn();
  const { unmount } = page(<Step available={50} state={refused} onRun={onRun} />);
  fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "Buy credits" }));
  const dialog = await screen.findByRole("dialog", { name: "Get more credits" });
  fireEvent.click(await within(dialog).findByRole("button", { name: /Continue to secure checkout · \$14\.99/ }));
  await waitFor(() => expect(packs.createCheckout).toHaveBeenCalledWith("pro", PAGE, undefined));
  await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.test/cs_1"));
  expect(readPendingPaidAction(PAGE)).toEqual({ id: "generate:3:high", label: "Generate 3 concepts", credits: 45, availableBefore: 50 });
  unmount();

  // Back from Stripe: the page loads again with the new balance.
  page(<Step available={250} onRun={onRun} />);
  expect(screen.getByRole("status")).toHaveTextContent("Your credits arrived —");
  const button = screen.getByRole("button", { name: "Generate 3 concepts · 45 credits" });
  expect(onRun).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(onRun).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Your credits arrived —")).not.toBeInTheDocument();
  expect(readPendingPaidAction(PAGE)).toBeNull();
});

it("says nothing arrived when the balance is not higher (checkout cancelled)", () => {
  sessionStorage.setItem(
    "thumbnail-studio:pending-action:v1",
    JSON.stringify({ id: "generate:3:high", label: "Generate 3 concepts", credits: 45, path: PAGE, availableBefore: 50, at: Date.now() }),
  );
  page(<Step available={50} onRun={jest.fn()} />);
  expect(screen.queryByText("Your credits arrived —")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Generate 3 concepts · 45 credits" })).toBeEnabled();
});

it("after an upgrade in the same window, closes it and gives the action's own button back without running it", async () => {
  billing.getMe.mockResolvedValue(onCreator as any);
  billing.getUpgradePreview.mockResolvedValue({ planId: "pro", interval: "month", amountDueCents: 1240, currency: "usd", prorationDate: 111, creditsAddedNow: 840 } as any);
  billing.upgrade.mockResolvedValue({ ...onCreator, upgradeTo: null } as any);
  const onRun = jest.fn();
  const view = page(<Step available={50} state={refused} onRun={onRun} />);
  fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "Buy credits" }));
  fireEvent.click(await screen.findByRole("button", { name: "Upgrade to Pro · pay $12.40 now" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(billing.upgrade).toHaveBeenCalledWith({ planId: "pro", prorationDate: 111 });

  // The balance read after the upgrade: the refusal notice gives way to the action.
  view.rerender(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[PAGE]}>
        <Step available={890} state={refused} onRun={onRun} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Your credits arrived —")).toBeInTheDocument();
  expect(screen.queryByText(/Not enough credits/)).not.toBeInTheDocument();
  expect(onRun).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Generate 3 concepts · 45 credits" }));
  expect(onRun).toHaveBeenCalledTimes(1);
});
