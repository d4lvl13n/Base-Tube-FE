import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStudioPricing, useStudioStartAvailability } from "../useStudioCapabilities";
import { thumbnailStudioApi } from "../../api/thumbnailStudio";
import { ctrApi } from "../../api/ctr";
jest.mock("../../api/thumbnailStudio", () => ({
  thumbnailStudioApi: { capabilities: jest.fn() },
}));
jest.mock("../../api/ctr", () => ({ ctrApi: { getQuota: jest.fn() } }));
jest.mock("../useStudioAccount", () => ({ useStudioAccount: () => "clerk:alice" }));
const capabilities = thumbnailStudioApi.capabilities as jest.Mock;
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(() => client.clear());
it("never blocks starts while capabilities load or when they fail", async () => {
  capabilities.mockRejectedValue(new Error("Network Error"));
  const { result } = renderHook(() => useStudioStartAvailability(), { wrapper });
  expect(result.current).toEqual({ available: true, message: null });
  await waitFor(() => expect(capabilities).toHaveBeenCalled());
  await waitFor(() => expect(client.getQueryState(["thumbnail-studio", "capabilities"])?.status).toBe("error"));
  expect(result.current).toEqual({ available: true, message: null });
});
it.each([
  ["paused", /paused for now/],
  ["worker_unavailable", /temporarily unavailable/],
] as const)("explains a %s server without hiding saved work", async (reason, message) => {
  capabilities.mockResolvedValue({ operations: { available: false, reason }, validation: false });
  const { result } = renderHook(() => useStudioStartAvailability(), { wrapper });
  await waitFor(() => expect(result.current.available).toBe(false));
  expect(result.current.message).toMatch(message);
  expect(result.current.message).toMatch(/Your work is saved/);
});
const catalog = (generatePerConcept: number) => ({
  thumbnail: { generatePerImage: 12, editPerImage: 18, variationPerImage: 8 },
  ctr: { audit: 2, auditWithPersonas: 3, generatePerConcept },
});
it("prices buttons from the capabilities catalog, and from the balance read while capabilities are unavailable", async () => {
  (ctrApi.getQuota as jest.Mock).mockResolvedValue({ mode: "credits", creditInfo: { balance: 10, reserved: 0, available: 10 }, pricing: catalog(14) });
  capabilities.mockRejectedValue(new Error("Network Error"));
  const { result } = renderHook(() => useStudioPricing(), { wrapper });
  await waitFor(() => expect(result.current?.ctr.generatePerConcept).toBe(14));
  capabilities.mockResolvedValue({ operations: { available: true, reason: null }, validation: true, pricing: catalog(15) });
  await client.refetchQueries({ queryKey: ["thumbnail-studio", "capabilities"] });
  await waitFor(() => expect(result.current?.ctr.generatePerConcept).toBe(15));
});
