import type { CreditPricingCatalog } from "../types/ctr";
import type { StudioAction, StudioItemInput } from "../types/thumbnailStudio";

/**
 * What the server charges for one Studio output, from the pricing catalog
 * (`GET /capabilities`): a concept is `ctr.generatePerConcept` at any quality,
 * an AI edit `thumbnail.editPerImage`, an audit `ctr.audit` or
 * `ctr.auditWithPersonas`. Text changes and text assists are free. Null while
 * the catalog is unknown.
 */
export function studioItemCredits(
  pricing: CreditPricingCatalog | null | undefined,
  action: StudioAction,
  input: StudioItemInput = {},
): number | null {
  if (action !== "generate" && action !== "edit" && action !== "audit") return 0;
  if (!pricing) return null;
  if (action === "generate") return pricing.ctr.generatePerConcept;
  if (action === "edit") return pricing.thumbnail.editPerImage;
  return input.includePersonas ? pricing.ctr.auditWithPersonas : pricing.ctr.audit;
}

/** "30 credits", "1 credit" or "free". */
export function studioCreditsLabel(credits: number): string {
  return credits === 0 ? "free" : `${credits} credit${credits === 1 ? "" : "s"}`;
}
