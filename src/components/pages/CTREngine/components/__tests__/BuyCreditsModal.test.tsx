import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BuyCreditsModal, packYield } from "../BuyCreditsModal";
import { creditsApi } from "../../../../../api/credits";
import { creditsReturnDestination } from "../../../../../utils/studioDraft";

jest.mock("../../../../../api/credits", () => ({
  creditsApi: { getPacks: jest.fn(), createCheckout: jest.fn() },
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
}));

const api = creditsApi as jest.Mocked<typeof creditsApi>;
const packs = [
  { id: "starter", label: "Starter", credits: 100, priceCents: 999, currency: "usd" },
  { id: "pro", label: "Pro", credits: 200, priceCents: 1499, currency: "usd" },
];

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  api.getPacks.mockResolvedValue(packs);
  // setupTests replaces window.location with a writable object.
  Object.assign(window.location, { pathname: "/ai-thumbnails/settings/credits", search: "", href: "http://localhost:3000/ai-thumbnails/settings/credits" });
});
afterEach(() => {
  Object.assign(window.location, { pathname: "/", search: "", href: "http://localhost:3000" });
});

const open = () => render(<div data-testid="page" style={{ transform: "scale(1)" }}><BuyCreditsModal isOpen onClose={jest.fn()} /></div>);

it("opens above the page in a portal with full pack names, what each buys and one checkout button with the price", async () => {
  open();
  const dialog = await screen.findByRole("dialog", { name: "Buy credits" });
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
  await waitFor(() => expect(api.createCheckout).toHaveBeenCalledWith("pro"));
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
