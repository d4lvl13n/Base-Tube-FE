import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SettingsPage from "../SettingsPage";
import useCTREngine from "../../../../hooks/useCTREngine";
import { thumbnailStudioApi } from "../../../../api/thumbnailStudio";
import { creditsApi } from "../../../../api/credits";
import { defaultStudioSettings } from "../../../../types/thumbnailStudio";

jest.mock("@clerk/clerk-react", () => ({ useUser: () => ({ user: { primaryEmailAddress: { emailAddress: "alice@example.com" } } }) }));
jest.mock("../../../../hooks/useCTREngine", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../../../hooks/useStudioAccount", () => ({ useStudioAccount: () => "clerk:alice" }));
jest.mock("../../../../hooks/useStudioCapabilities", () => ({
  useStudioPricing: () => ({
    ctr: { generatePerConcept: 15, audit: 2, auditWithPersonas: 5 },
    thumbnail: { generatePerImage: 15, editPerImage: 18, variationPerImage: 15 },
  }),
}));
jest.mock("../../../../hooks/useStudioBalance", () => ({
  useStudioBalanceLoadFailure: () => ({ failed: false, retrying: false, retry: jest.fn() }),
}));
jest.mock("../AIThumbnailsLayout", () => ({ __esModule: true, default: ({ children }: any) => <main>{children}</main> }));
jest.mock("../components/BuyCreditsModal", () => ({
  BuyCreditsModal: ({ isOpen }: any) => (isOpen ? <p>Credit packs</p> : null),
  formatMoney: (cents: number) => `$${(cents / 100).toFixed(2)}`,
}));
jest.mock("../../../common/ThumbnailPackaging", () => ({ ThumbnailStylePicker: () => null }));
jest.mock("../../../../api/thumbnailPackaging", () => ({ thumbnailPackagingApi: { list: jest.fn().mockResolvedValue([]), remove: jest.fn() } }));
jest.mock("../../../../api/credits", () => ({ creditsApi: { getCreditLedger: jest.fn() } }));
// The plan (channel profile limit): no plan read in these tests.
jest.mock("../../../../api/subscriptions", () => ({
  ...jest.requireActual("../../../../api/subscriptions"),
  subscriptionsApi: { getMe: jest.fn(() => new Promise(() => undefined)), getPlans: jest.fn(() => new Promise(() => undefined)) },
}));
jest.mock("../../../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: { profiles: jest.fn(), patchProfile: jest.fn(), createProfile: jest.fn(), upload: jest.fn(), asset: jest.fn() },
  studioError: (e: any) => e?.response?.data?.error || { message: e?.message || "Failed" },
}));

const studio = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
const credits = creditsApi as jest.Mocked<typeof creditsApi>;
const profile = (overrides: Record<string, unknown> = {}) => ({
  id: "profile-1",
  version: 3,
  name: "Gaming",
  youtubeChannelId: null,
  settings: { ...defaultStudioSettings(), language: "fr", logoAssetId: "logo-1" },
  isDefault: true,
  archived: false,
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-01T10:00:00Z",
  ...overrides,
});
let engine: any;
let client: QueryClient;
const Location = () => <output data-testid="location">{useLocation().pathname + useLocation().search}</output>;
const show = (url: string) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/ai-thumbnails/settings" element={<><SettingsPage /><Location /></>} />
          <Route path="/ai-thumbnails/settings/:section" element={<><SettingsPage /><Location /></>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  engine = {
    isAuthenticated: true,
    isAnonymous: false,
    usageAccess: { mode: "credits", creditInfo: { available: 120, reserved: 15, balance: 135 }, pricing: null },
    isLoadingQuota: false,
    faceReference: null,
    isLoadingFaceReference: false,
    isUploadingFaceReference: false,
    uploadFaceReference: jest.fn(),
    deleteFaceReference: jest.fn(),
    error: null,
    errorDetail: null,
    clearError: jest.fn(),
  };
  (useCTREngine as jest.Mock).mockImplementation(() => engine);
  studio.profiles.mockResolvedValue({ items: [profile()], nextCursor: null });
  studio.asset.mockResolvedValue({ id: "logo-1", url: "https://cdn.test/logo.png", originalName: "logo.png", urlExpiresAt: "2099-01-01T00:00:00Z" } as any);
});
afterEach(() => client.clear());

it("puts every creator setting in one place, opening on Channel style", async () => {
  show("/ai-thumbnails/settings");
  const nav = screen.getByRole("navigation", { name: "Settings sections" });
  expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Channel style",
    "Logos",
    "Face reference",
    "Preferences",
    "Credits120",
    "Subscription",
    "Account",
  ]);
  expect(within(nav).getByRole("link", { name: "Channel style" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("heading", { name: "Channel style" })).toBeInTheDocument();
  // The channel profiles, brought in from the old projects/profiles page.
  expect(await screen.findByRole("button", { name: "Edit Gaming" })).toBeInTheDocument();
  expect(screen.getByText("Français · DejaVu Sans · Suggested text")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "New profile" })).toBeInTheDocument();
});

it("opens the profile a Preferences row points to", async () => {
  show("/ai-thumbnails/settings/preferences");
  const row = await screen.findByRole("link", { name: "Edit Gaming preferences" });
  expect(row.closest("li")).toHaveTextContent("LanguageFrançais");
  expect(row.closest("li")).toHaveTextContent("PricesNot included");
  fireEvent.click(row);
  expect(screen.getByTestId("location")).toHaveTextContent("/ai-thumbnails/settings/style?profile=profile-1");
  expect(await screen.findByLabelText("Profile name")).toHaveValue("Gaming");
});

it("shows the balance, live prices, top-ups and Buy credits", async () => {
  credits.getCreditLedger.mockResolvedValue([
    { id: 3, type: "capture", balanceDelta: -15, createdAt: "2026-09-20T10:00:00Z" },
    { id: 2, type: "purchase", balanceDelta: 200, createdAt: "2026-09-19T10:00:00Z", metadata: { priceCents: 1499, currency: "usd" } },
    { id: 1, type: "grant", balanceDelta: 20, createdAt: "2026-09-18T10:00:00Z", metadata: { source: "referral" } },
  ]);
  show("/ai-thumbnails/settings/credits");
  expect(screen.getByText("Available").nextSibling).toHaveTextContent("120");
  expect(screen.getByText("Reserved").nextSibling).toHaveTextContent("15");
  expect(screen.getByText("New concept").nextSibling).toHaveTextContent("15 credits");
  expect(screen.getByText("AI edit").nextSibling).toHaveTextContent("18 credits");
  expect(screen.getByText("Text change").nextSibling).toHaveTextContent("Free");
  expect(credits.getCreditLedger).toHaveBeenCalledWith({ limit: 100 });
  const purchase = (await screen.findByText("Credit purchase")).closest("li")!;
  expect(purchase).toHaveTextContent("$14.99");
  expect(purchase).toHaveTextContent("+200");
  expect(screen.getByText("Referral reward")).toBeInTheDocument();
  // Credits reserved and spent by work are not purchases.
  expect(screen.queryByText("−15")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Buy credits" }));
  expect(screen.getByText("Credit packs")).toBeInTheDocument();
});

it("replaces a profile's logo with the existing upload and profile endpoints", async () => {
  studio.upload.mockResolvedValue({ id: "logo-2" } as any);
  studio.patchProfile.mockResolvedValue(profile() as any);
  show("/ai-thumbnails/settings/logos");
  expect(await screen.findByRole("img", { name: "Gaming logo" })).toHaveAttribute("src", expect.stringContaining("logo.png"));
  const file = new File(["png"], "new-logo.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Gaming logo file"), { target: { files: [file] } });
  await waitFor(() => expect(studio.upload).toHaveBeenCalledWith(file, "logo"));
  await waitFor(() =>
    expect(studio.patchProfile).toHaveBeenCalledWith("profile-1", 3, {
      settings: expect.objectContaining({ logoAssetId: "logo-2", language: "fr" }),
    }),
  );
});

it("links to the general base.tube account instead of repeating it", () => {
  show("/ai-thumbnails/settings/account");
  expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Open your profile/ })).toHaveAttribute("href", "/profile");
  expect(screen.getByRole("link", { name: /Email and security/ })).toHaveAttribute("href", "/profile/settings");
});

it("shows a face upload failure in plain words, without the technical status outside development", () => {
  engine.error = "Your face photo was not saved. Please try again.";
  engine.errorDetail = "HTTP 503";
  show("/ai-thumbnails/settings/face");
  expect(screen.getByRole("alert")).toHaveTextContent("Your face photo was not saved. Please try again.");
  // The technical status is for development only.
  expect(screen.queryByText(/HTTP 503/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Upload a face photo/ })).toBeInTheDocument();
});

it("sends an unknown section back to the settings hub", () => {
  show("/ai-thumbnails/settings/billing");
  expect(screen.getByTestId("location")).toHaveTextContent(/^\/ai-thumbnails\/settings$/);
});
