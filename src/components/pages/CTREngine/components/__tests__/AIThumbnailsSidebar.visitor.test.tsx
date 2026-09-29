import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AIThumbnailsSidebar from "../AIThumbnailsSidebar";
import { getWelcomeOffer } from "../../../../../api/toolFunnel";
import { ctrApi } from "../../../../../api/ctr";
import { subscriptionsApi } from "../../../../../api/subscriptions";
import { STUDIO_AUTH_ORIGIN_KEY } from "../../../../../utils/studioAuth";
import { readPlanIntent } from "../../../../../utils/studioDraft";
import type { CTRUsageAccess } from "../../../../../types/ctr";

const clerk = { isSignedIn: false, isLoaded: true };
jest.mock("@clerk/clerk-react", () => ({ useAuth: () => clerk }));
jest.mock("../../../../../contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: false, isRestoring: false }) }));
jest.mock("../../../../../hooks/useStudioAccount", () => ({ useStudioAccount: () => (clerk.isSignedIn ? "clerk:alice" : "anonymous") }));
jest.mock("../../../../../api/ctr", () => ({ ctrApi: { getQuota: jest.fn() }, formatQuotaLimit: (limit: number) => String(limit) }));
jest.mock("../../../../../api/toolFunnel", () => ({ getWelcomeOffer: jest.fn() }));
jest.mock("../../../../../api/subscriptions", () => ({
  ...jest.requireActual("../../../../../api/subscriptions"),
  subscriptionsApi: { getPlans: jest.fn(), getMe: jest.fn() },
}));
jest.mock("../ReferralPanel", () => ({ __esModule: true, default: () => null }));

const quota = (auditUsed: number, generateLimit: number): CTRUsageAccess => ({
  mode: "quota",
  quota: {
    audit: { used: auditUsed, limit: 3, remaining: 3 - auditUsed, resetsAt: "" },
    generate: { used: 0, limit: generateLimit, remaining: generateLimit, resetsAt: "" },
    tier: "anonymous",
    isAnonymous: true,
    limits: { audit: { anonymous: 3, free: 0, pro: 0, enterprise: 0 }, generate: { anonymous: 0, free: 0, pro: 0, enterprise: 0 } },
  },
});
let client: QueryClient;
const show = (usageAccess: CTRUsageAccess, isCollapsed = false) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/ai-thumbnails/audit"]}>
        <AIThumbnailsSidebar usageAccess={usageAccess} isLoadingQuota={false} isCollapsed={isCollapsed} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  clerk.isSignedIn = false;
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() });
  (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 50, available: true });
  (subscriptionsApi.getPlans as jest.Mock).mockResolvedValue({
    videoCredits: 90,
    videoBreakdown: { concepts: 3, conceptCredits: 15, edits: 2, editCredits: 18, audits: 1, auditCredits: 2 },
    rolloverMonths: 1,
    free: { channelProfiles: 1 },
    trial: { days: 7, videos: 2, credits: 180 },
    plans: [{ id: "creator", name: "Creator", rank: 1, videosPerMonth: 6, creditsPerMonth: 540, channelProfiles: 1, highlights: [], prices: { month: { amountCents: 2400, currency: "usd" }, year: { amountCents: 19900, currency: "usd", monthlyEquivalentCents: 1658, savingsPercent: 31 } } }],
  });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(() => client.clear());

it("a visitor sees the free audits and a free account with its welcome credits, never a create allowance", async () => {
  show(quota(1, 0));
  const link = await screen.findByRole("link", { name: "Create a free account — 50 free credits" });
  expect(screen.getByText("3 free audits a day")).toBeInTheDocument();
  expect(screen.getByText("2 left today")).toBeInTheDocument();
  expect(screen.queryByText(/Creates/)).not.toBeInTheDocument();
  expect(link).toHaveAttribute("href", "/ai-thumbnails/sign-up");
  fireEvent.click(link);
  expect(JSON.parse(sessionStorage.getItem(STUDIO_AUTH_ORIGIN_KEY)!)).toMatchObject({ intent: "sign-up", destination: "/ai-thumbnails/audit" });
});

it("collapsed, a visitor's account link keeps the offer and the tooltip names only the audits", async () => {
  show(quota(0, 0), true);
  expect(await screen.findByRole("link", { name: "Create a free account — 50 free credits" })).toBeInTheDocument();
  expect(screen.getByText("3 free audits a day")).toBeInTheDocument();
  expect(screen.queryByText(/Creates/)).not.toBeInTheDocument();
});

it("when today's welcome credits are all given, the link promises no credits and says when they come", async () => {
  (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 50, available: false });
  show(quota(0, 0));
  expect(await screen.findByText(/Today’s welcome credits are all given/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Create a free account" })).toBeInTheDocument();
});

it("a signed-in account keeps its own allowance and gets no visitor offer", () => {
  clerk.isSignedIn = true;
  (ctrApi.getQuota as jest.Mock).mockResolvedValue(quota(1, 10));
  show(quota(1, 10));
  expect(screen.getByText("Creates")).toBeInTheDocument();
  expect(screen.queryByText(/Create a free account/)).not.toBeInTheDocument();
  expect(screen.queryByText("3 free audits a day")).not.toBeInTheDocument();
});

it("without the welcome gift (the default), a visitor is offered the free trial first, then a free account", async () => {
  (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 0, available: false });
  show(quota(0, 0));
  const trial = await screen.findByRole("link", { name: "Start 7-day free trial" });
  expect(screen.getByText(/2 videos free, then \$24\/month\./)).toBeInTheDocument();
  expect(screen.queryByText(/credits/)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Or create a free account" })).toHaveAttribute("href", "/ai-thumbnails/sign-up");
  fireEvent.click(trial);
  expect(readPlanIntent()).toEqual({ planId: "creator", interval: "month", trial: true });
});
