import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AIThumbnailsSidebar from "../AIThumbnailsSidebar";
import { ctrApi } from "../../../../../api/ctr";
import { invalidateStudioBalance, useStudioBalance } from "../../../../../hooks/useStudioBalance";
jest.mock("../../../../../api/ctr", () => ({ ctrApi: { getQuota: jest.fn() }, formatQuotaLimit: (limit: number) => String(limit) }));
jest.mock("@clerk/clerk-react", () => ({ useAuth: () => ({ isSignedIn: true }) }));
jest.mock("../../../../../contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
jest.mock("../../../../../hooks/useStudioAccount", () => ({ useStudioAccount: () => "clerk:alice" }));
jest.mock("../ReferralPanel", () => ({ __esModule: true, default: () => null }));
// The plan (channel profile limit, videos left): not read in these tests.
jest.mock("../../../../../api/subscriptions", () => ({
  ...jest.requireActual("../../../../../api/subscriptions"),
  subscriptionsApi: { getMe: jest.fn(() => new Promise(() => undefined)), getPlans: jest.fn(() => new Promise(() => undefined)) },
}));
const getQuota = ctrApi.getQuota as jest.Mock;
const credits = (available: number) => ({ mode: "credits", creditInfo: { available, balance: available, reserved: 0 }, pricing: null });
let client: QueryClient;
// Pages hand the shared balance to the layout, which hands it to the sidebar.
function Page() {
  const { usageAccess, isLoadingQuota } = useStudioBalance("clerk:alice");
  return <AIThumbnailsSidebar usageAccess={usageAccess} isLoadingQuota={isLoadingQuota} />;
}
beforeEach(() => {
  jest.clearAllMocks();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(() => client.clear());
const show = () =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    </QueryClientProvider>,
  );
it("says when the first balance read fails and loads it again on Retry", async () => {
  getQuota.mockRejectedValue(new Error("Network Error"));
  show();
  expect(await screen.findByText(/Couldn't load your credit balance/, {}, { timeout: 4000 })).toBeInTheDocument();
  getQuota.mockResolvedValue(credits(42));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
  expect(screen.queryByText(/Couldn't load your credit balance/)).not.toBeInTheDocument();
});
it("keeps the last balance and says nothing when a background refresh fails", async () => {
  getQuota.mockResolvedValue(credits(42));
  show();
  await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
  getQuota.mockRejectedValue(new Error("Network Error"));
  await invalidateStudioBalance(client, "clerk:alice");
  // The refresh and its one retry both fail.
  await waitFor(() => expect(getQuota).toHaveBeenCalledTimes(3), { timeout: 4000 });
  await waitFor(() => expect(client.getQueryState(["thumbnail-studio", "usage", "clerk:alice"])?.status).toBe("error"));
  expect(screen.getByText("42")).toBeInTheDocument();
  expect(screen.queryByText(/Couldn't load your credit balance/)).not.toBeInTheDocument();
});
