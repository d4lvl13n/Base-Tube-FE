import { emptyStudioBrief } from "../types/thumbnailStudio";
import type { StudioDraft } from "./studioDraft";

export type StudioEntrySource = "idea" | "youtube" | "image" | "script";
export interface StudioEntryState {
  /**
   * The creator clicked "Generate N concepts · X credits" on the create form:
   * the project page starts that generation once on arrival (never after a
   * sign-in return, Back or a reload).
   */
  startGeneration?: boolean;
  /** The price that button showed; the quote must match it to start without another click. */
  generationCredits?: number | null;
  conceptCount?: number;
  quality?: "standard" | "high";
}
export function studioEntrySource(value: string | null): StudioEntrySource {
  return value === "youtube" || value === "image" || value === "script"
    ? value
    : "idea";
}
/** The brief a visitor wrote (utils/studioDraft) as the signed-in create form's brief. */
export function studioBriefFromDraft(draft: StudioDraft) {
  const brief = emptyStudioBrief();
  brief.videoTitle = draft.videoTitle;
  brief.summary = draft.description;
  brief.creatorHook = draft.creatorHook;
  brief.visualDirection = draft.direction;
  brief.outputFormat = draft.format === "short" ? "portrait" : "landscape";
  if (draft.layout) brief.layout = draft.layout;
  const mode =
    draft.textMode === "none"
      ? "none"
      : draft.headline.trim() && draft.textMode !== "suggest"
        ? "exact"
        : "suggest";
  brief.overrides.text = { mode, value: mode === "exact" ? draft.headline : "" };
  if (draft.niche)
    brief.overrides.rules = { additional: [`Channel topic: ${draft.niche}`] };
  return brief;
}
