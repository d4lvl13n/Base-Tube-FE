import { AI_DAILY_CAPACITY_MESSAGE } from "./plainApiError";

/** Public-facing names for the small server provenance vocabulary. */
export function studioSourceLabels(fields: string[]): string {
  const names: Record<string, string> = {
    title: "video title",
    description: "public description",
    public_video_title: "public video title",
    independent_visual_observations: "visual observations",
    script: "provided script",
    image: "provided image",
    thumbnail: "video thumbnail",
  };
  return fields
    .map((field) => names[field] || field.replaceAll("_", " "))
    .join(", ");
}
export const studioLanguages = [
  ["en", "English"],
  ["fr", "Français"],
  ["es", "Español"],
  ["de", "Deutsch"],
  ["it", "Italiano"],
  ["pt", "Português"],
  ["nl", "Nederlands"],
  ["pl", "Polski"],
  ["ja", "日本語"],
  ["ko", "한국어"],
  ["zh", "中文"],
  ["ar", "العربية"],
  ["hi", "हिन्दी"],
] as const;
/** Started work and its outputs as creators read them. A quote is never shown. */
export const studioStateLabels: Record<string, string> = {
  queued: "Waiting",
  preparing: "Preparing concepts",
  dispatching: "Creating",
  finalizing: "Saving result",
  outcome_unknown: "Checking whether the result can be recovered",
  succeeded: "Ready",
  failed: "Failed",
  running: "In progress",
  partial: "Some results are ready",
};
export const studioActionNames: Record<string, string> = {
  generate: "Concept",
  edit: "Image edit",
  overlay: "Text change",
  audit: "Thumbnail audit",
  prepare_brief: "Suggested brief",
  suggest_titles: "Title suggestions",
  describe_style: "Style suggestions",
};
/** A short name for an operation, used in announcements. */
export function studioOperationName(items: Array<{ action: string }>): string {
  const action = items[0]?.action;
  if (action === "generate")
    return `${items.length} concept${items.length === 1 ? "" : "s"}`;
  return (action && studioActionNames[action]) || "Your request";
}
/**
 * Why an output failed, from the item error code of the operation read.
 */
export function studioItemFailureMessage(errorCode: string | null): string {
  if (errorCode === "AI_DAILY_CAPACITY") return AI_DAILY_CAPACITY_MESSAGE;
  if (errorCode === "PROVIDER_NOT_REACHED")
    return "The image service could not be reached, so nothing was created and the credits for this result were released. You can retry it.";
  return "This result could not be completed. Other ready results are kept.";
}
