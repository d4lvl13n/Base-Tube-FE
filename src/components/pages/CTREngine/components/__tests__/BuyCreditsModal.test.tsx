import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BuyCreditsModal, packYield } from "../BuyCreditsModal";
import { creditsApi } from "../../../../../api/credits";
import { subscriptionsApi } from "../../../../../api/subscriptions";
import { creditsReturnDestination, readPendingPaidAction } from "../../../../../utils/studioDraft";

jest.mock("../../../../../api/credits", () => ({
  creditsApi: { getPacks: jest.fn(), createCheckout: jest.fn() },
}));
jest.mock("../../../../../api/subscriptions", () => ({
  ...jest.requireActual("../../../../../api/subscriptions"),
  subscriptionsApi: {
    getPlans: jest.fn(),
    getMe: jest.fn(),
    createCheckout: jest.fn(),
    createPortal: jest.fn(),
    getUpgradePreview: jest.fn(),
    upgrade: jest.fn(),
  },
}));
const mockPricing = {
  ctr: { generatePerConcept: 15, audit: 2, auditWithPersonas: 5 },
  thumbnail: { generatePerImage: 15, editPerImage: 18, variationPerImage: 15 },
};
jest.mock("../../../../../hooks/useStudioCapabilities", () => ({ useStudioPricing: () => mockPricing }));
jest.mock("../../../../../hooks/useStudioAccount", () => ({ useStudioAccount: () => "clerk:alice" }));
jest.mock("../../../../../hooks/useStudioBalance", () => ({
  useStudioBalance: () => ({
    usageAccess: { mode: "credits", creditInfo: { available: 42, reserved: 0, balance: 42 }, pricing: null },
  }),
  notifyStudioUsageChanged: jest.fn(),
}));

const api = creditsApi as jest.Mocked<typeof creditsApi>;
const billing = subscriptionsApi as jest.Mocked<typeof subscriptionsApi>;
const packs = [
  { id: "starter", label: "Starter", credits: 100, priceCents: 999, currency: "usd" },
  { id: "pro", label: "Pro", credits: 200, priceCents: 1499, currency: "usd" },
];
const plan = (id: string, name: string, rank: number, videos: number, month: number, year: number, savings: number) => ({
  id, name, rank, videosPerMonth: videos, creditsPerMonth: videos * 90, channelProfiles: rank === 1 ? 1 : rank === 2 ? 3 : 10,
  highlights: [`${videos} videos`],
  prices: { month: { amountCents: month, currency: "usd" }, year: { amountCents: year, currency: "usd", monthlyEquivalentCents: Math.round(year / 12), savingsPercent: savings } },
});
const catalog = {
  videoCredits: 90,
  videoBreakdown: { concepts: 3, conceptCredits: 15, edits: 2, editCredits: 18, audits: 1, auditCredits: 2 },
  rolloverMonths: 1,
  free: { channelProfiles: 1 },
  plans: [plan("creator", "Creator", 1, 6, 2400, 19900, 31), plan("pro", "Pro", 2, 20, 4900, 39900, 32), plan("agency", "Agency", 3, 50, 9900, 79900, 33)],
};
const credits = { available: 42, subscription: { available: 0, expiresAt: null, lots: [] }, other: { available: 42 } };
const noPlan = { subscription: null, credits, videoCredits: 90, videosRemaining: 0, channelProfiles: { limit: 1, used: 0 }, canSubscribe: true, upgradeTo: null };
const onCreator = {
  ...noPlan,
  subscription: {
    planId: "creator", planName: "Creator", interval: "month", status: "active", currentPeriodStart: "2026-09-01T00:00:00Z",
    currentPeriodEnd: "2026-10-01T00:00:00Z", cancelAtPeriodEnd: false, nextInvoiceAt: "2026-10-01T00:00:00Z", amountCents: 2400, currency: "usd",
  },
  canSubscribe: false,
  upgradeTo: "pro",
};
const preview = { planId: "pro", interval: "month", amountDueCents: 1240, currency: "usd", prorationDate: 111, creditsAddedNow: 840 };
const generate = { id: "generate:3:high", label: "Generate 3 concepts", credits: 45 };

let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  api.getPacks.mockResolvedValue(packs);
  billing.getPlans.mockResolvedValue(catalog as any);
  billing.getMe.mockResolvedValue(noPlan as any);
  // setupTests replaces window.location with a writable object.
  Object.assign(window.location, { pathname: "/ai-thumbnails/settings/credits", search: "", href: "http://localhost:3000/ai-thumbnails/settings/credits" });
});
afterEach(() => {
  client.clear();
  Object.assign(window.location, { pathname: "/", search: "", href: "http://localhost:3000" });
});

const open = (props: Partial<React.ComponentProps<typeof BuyCreditsModal>> = {}) => {
  const onClose = jest.fn();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <div data-testid="page" style={{ transform: "scale(1)" }}>
          <BuyCreditsModal isOpen onClose={onClose} {...props} />
        </div>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onClose;
};

it("opens above the page in a portal with full pack names, what each buys and one checkout button with the price", async () => {
  open();
  const dialog = await screen.findByRole("dialog", { name: "Get more credits" });
  // Rendered on document.body, never inside the (transformed) page that opened it.
  expect(within(screen.getByTestId("page")).queryByRole("dialog")).not.toBeInTheDocument();
  expect(dialog).toHaveTextContent("You have 42 credits");
  const pro = await within(dialog).findByRole("radio", { name: /Pro/ });
  expect(pro).toHaveTextContent("Pro");
  expect(pro).toHaveTextContent("Best value");
  expect(pro).toHaveTextContent("≈ 13 concepts · 11 edits · 100 audits");
  expect(pro).toHaveTextContent("$0.075 / credit");
  // The best value pack starts selected, so the usual purchase is one click.
  expect(pro).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("button", { name: "Continue to secure checkout · $14.99" })).toBeEnabled();
  fireEvent.click(within(dialog).getByRole("radio", { name: /Starter/ }));
  expect(screen.getByRole("button", { name: "Continue to secure checkout · $9.99" })).toBeInTheDocument();
  expect(dialog).toHaveTextContent("Secure payment by Stripe. You'll come back to this page.");
});

it("starts Stripe Checkout for the selected pack and returns to the same page", async () => {
  api.createCheckout.mockResolvedValue({ sessionId: "cs_1", url: "https://checkout.stripe.test/cs_1", pack: packs[1] });
  open();
  fireEvent.click(await screen.findByRole("button", { name: /Continue to secure checkout · \$14\.99/ }));
  await waitFor(() => expect(api.createCheckout).toHaveBeenCalledWith("pro", "/ai-thumbnails/settings/credits"));
  await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.test/cs_1"));
  expect(creditsReturnDestination()).toBe("/ai-thumbnails/settings/credits");
  expect(screen.getByRole("button", { name: /Opening secure checkout/ })).toBeDisabled();
});

it("shows the server's reason when checkout does not open, never the HTTP wording", async () => {
  api.createCheckout.mockRejectedValue({
    isAxiosError: true,
    message: "Request failed with status code 503",
    response: { status: 503, data: { success: false, error: { code: "STRIPE_UNAVAILABLE", message: "Payments are paused for a few minutes." } } },
  });
  open();
  fireEvent.click(await screen.findByRole("button", { name: /Continue to secure checkout · \$14\.99/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Payments are paused for a few minutes.");
  expect(screen.queryByText(/status code/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Continue to secure checkout · \$14\.99/ })).toBeEnabled();
});

it("says in plain words when the packs do not load, and loads them again", async () => {
  api.getPacks.mockRejectedValueOnce({ isAxiosError: true, message: "Request failed with status code 500", response: { status: 500, data: {} } });
  open();
  expect(await screen.findByRole("alert")).toHaveTextContent("Credit packs did not load. Please try again.");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("radio", { name: /Pro/ })).toBeInTheDocument();
});

it("works out what a pack buys from the live prices only", () => {
  expect(packYield(200, mockPricing as any)).toBe("≈ 13 concepts · 11 edits · 100 audits");
  expect(packYield(15, mockPricing as any)).toBe("≈ 1 concept · 0 edits · 7 audits");
  expect(packYield(200, null)).toBeNull();
});

describe("not enough credits for an action", () => {
  beforeEach(() => {
    Object.assign(window.location, { pathname: "/ai-thumbnails/projects/project-1", search: "", href: "http://localhost:3000/ai-thumbnails/projects/project-1" });
  });

  it("offers the plans to an account without one, each a single click with its price, remembering the action to resume", async () => {
    billing.createCheckout.mockResolvedValue({ url: "https://checkout.stripe.test/sub_1", sessionId: "cs_sub" });
    open({ pendingAction: generate });
    const dialog = await screen.findByRole("dialog", { name: "Get more credits" });
    expect(dialog).toHaveTextContent("Generate 3 concepts costs 45.");
    expect(await within(dialog).findByRole("button", { name: "Start Creator · $24/month" })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "Start Pro · $49/month" })).toBeEnabled();
    // Packs stay offered below the plans.
    expect(within(dialog).getByRole("button", { name: /Continue to secure checkout · \$14\.99/ })).toBeInTheDocument();
    // Yearly shows the server's saving, not "2 months free".
    fireEvent.click(within(dialog).getByRole("button", { name: "Yearly · save up to 33%" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Start Creator · $199/year" }));
    await waitFor(() =>
      expect(billing.createCheckout).toHaveBeenCalledWith({ planId: "creator", interval: "year", returnPath: "/ai-thumbnails/projects/project-1" }),
    );
    await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.test/sub_1"));
    expect(creditsReturnDestination()).toBe("/ai-thumbnails/projects/project-1");
    expect(readPendingPaidAction("/ai-thumbnails/projects/project-1")).toEqual({ ...generate, availableBefore: 42 });
  });

  it("leads with the free trial for an account that never had a plan, one click to checkout, before the plans and packs", async () => {
    billing.getPlans.mockResolvedValue({ ...catalog, trial: { days: 7, videos: 2, credits: 180 } } as any);
    billing.getMe.mockResolvedValue({ ...noPlan, trialEligible: true } as any);
    billing.createCheckout.mockResolvedValue({ url: "https://checkout.stripe.test/trial_1", sessionId: "cs_trial", trialDays: 7 });
    open({ pendingAction: generate });
    const dialog = await screen.findByRole("dialog", { name: "Get more credits" });
    const trial = await within(dialog).findByRole("region", { name: "Try Creator free for 7 days" });
    expect(trial).toHaveTextContent("2 videos included. Then $24/month. Cancel before day 8 and you pay nothing.");
    // First in the window: before the plans and the packs.
    const sections = within(dialog).getAllByRole("region").map((section) => section.getAttribute("aria-labelledby"));
    expect(sections[0]).toBe(trial.getAttribute("aria-labelledby"));
    // Every plan starts with the trial too, its price after it.
    expect(within(dialog).getByRole("button", { name: "Start 7-day free trial · Pro" })).toBeEnabled();
    expect(dialog).toHaveTextContent("then $49/month");
    fireEvent.click(within(trial).getByRole("button", { name: "Start 7-day free trial" }));
    await waitFor(() =>
      expect(billing.createCheckout).toHaveBeenCalledWith({ planId: "creator", interval: "month", returnPath: "/ai-thumbnails/projects/project-1" }),
    );
    await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.test/trial_1"));
    expect(readPendingPaidAction("/ai-thumbnails/projects/project-1")).toEqual({ ...generate, availableBefore: 42 });
  });

  it("offers a subscriber the next plan with its charge read at once, upgrades in one click and hands the action back to the page", async () => {
    billing.getMe.mockResolvedValue(onCreator as any);
    billing.getUpgradePreview.mockResolvedValue(preview as any);
    billing.upgrade.mockResolvedValue({ ...onCreator, subscription: { ...onCreator.subscription, planId: "pro", planName: "Pro" }, upgradeTo: "agency" } as any);
    const onClose = open({ pendingAction: generate });
    const dialog = await screen.findByRole("dialog", { name: "Get more credits" });
    // No plan list for a subscriber, and no "get price" step: the charge is on the button.
    const upgrade = await within(dialog).findByRole("button", { name: "Upgrade to Pro · pay $12.40 now" });
    expect(billing.getUpgradePreview).toHaveBeenCalledWith("pro");
    expect(within(dialog).queryByRole("button", { name: /^Start / })).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent("Adds 840 credits now.");
    fireEvent.click(upgrade);
    await waitFor(() => expect(billing.upgrade).toHaveBeenCalledWith({ planId: "pro", prorationDate: 111 }));
    expect(billing.upgrade).toHaveBeenCalledTimes(1);
    // The window closes; the page's own button (not run here) is offered again.
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(readPendingPaidAction("/ai-thumbnails/projects/project-1")).toEqual({ ...generate, availableBefore: 42 });
  });

  it("shows a changed upgrade amount on the same button, and the next click pays that amount", async () => {
    billing.getMe.mockResolvedValue(onCreator as any);
    billing.getUpgradePreview.mockResolvedValue(preview as any);
    billing.upgrade.mockRejectedValueOnce({
      response: { status: 409, data: { success: false, error: { code: "PRICE_CHANGED", message: "The amount changed.", details: { amountDueCents: 1310, currency: "usd", prorationDate: 222 } } } },
    });
    billing.upgrade.mockResolvedValueOnce({ ...onCreator, upgradeTo: "agency" } as any);
    open({ pendingAction: generate });
    fireEvent.click(await screen.findByRole("button", { name: "Upgrade to Pro · pay $12.40 now" }));
    const changed = await screen.findByRole("button", { name: "Upgrade to Pro · pay $13.10 now" });
    expect(billing.upgrade).toHaveBeenCalledTimes(1);
    fireEvent.click(changed);
    await waitFor(() => expect(billing.upgrade).toHaveBeenLastCalledWith({ planId: "pro", prorationDate: 222 }));
  });

  it("says a declined card plainly and points to billing", async () => {
    billing.getMe.mockResolvedValue(onCreator as any);
    billing.getUpgradePreview.mockResolvedValue(preview as any);
    billing.upgrade.mockRejectedValue({ response: { status: 402, data: { success: false, error: { code: "PAYMENT_FAILED", message: "Card declined" } } } });
    const onClose = open({ pendingAction: generate });
    fireEvent.click(await screen.findByRole("button", { name: "Upgrade to Pro · pay $12.40 now" }));
    expect(await screen.findByText("Your card was declined. Update it in Manage billing.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage billing" })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
    expect(readPendingPaidAction("/ai-thumbnails/projects/project-1")).toBeNull();
  });
});
