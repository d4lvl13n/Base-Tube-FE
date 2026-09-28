import { useQuery } from "@tanstack/react-query";
import { thumbnailStudioApi } from "../api/thumbnailStudio";
import type { StudioStartUnavailableReason } from "../types/thumbnailStudio";
import type { CreditPricingCatalog } from "../types/ctr";
import { useStudioAccount } from "./useStudioAccount";
import { useStudioBalance } from "./useStudioBalance";
export function useStudioCapabilities(enabled = true) {
  return useQuery({
    queryKey: ["thumbnail-studio", "capabilities"],
    queryFn: thumbnailStudioApi.capabilities,
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
export function studioStartUnavailableMessage(
  reason: StudioStartUnavailableReason | null,
): string {
  return reason === "paused"
    ? "Starting new work is paused for now. Your work is saved; try again later."
    : "Starting new work is temporarily unavailable. Your work is saved; try again in a few minutes.";
}
/**
 * Whether new work can start right now. Only an explicit `available: false`
 * blocks Start; loading or failing capabilities never hide or block the Studio
 * (the server still refuses a paused start with 503).
 */
export function useStudioStartAvailability(enabled = true): {
  available: boolean;
  message: string | null;
} {
  const operations = useStudioCapabilities(enabled).data?.operations;
  return operations?.available === false
    ? { available: false, message: studioStartUnavailableMessage(operations.reason) }
    : { available: true, message: null };
}
/**
 * The catalog the server prices Studio work with, for the price on each button:
 * capabilities first, the shared balance read second. Null while neither has
 * loaded; a button then shows no price and the quote's price is confirmed once.
 */
export function useStudioPricing(): CreditPricingCatalog | null {
  const fromCapabilities = useStudioCapabilities().data?.pricing;
  const account = useStudioAccount();
  const { usageAccess } = useStudioBalance(account, account !== "anonymous");
  return (
    fromCapabilities ??
    (usageAccess?.mode === "credits" ? usageAccess.pricing : null) ??
    null
  );
}
