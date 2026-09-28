import React from "react";
import type { StudioBrief, StudioItemInput } from "../../../../../types/thumbnailStudio";
import type { ThumbnailEditTarget } from "../../../../common/PreciseThumbnailEditor";

export type StudioEditKind = ThumbnailEditTarget | "overlay" | "correction";
export interface StudioEditRequest {
  kind: StudioEditKind;
  /** The creator's own words: requested change, exact headline or correction text. */
  text: string;
}
/** An edit and the version it changes, as the creator asked for it. */
export interface StudioEditReview {
  versionId: string;
  request: StudioEditRequest;
}
const editKinds: StudioEditKind[] = ["custom", "background", "framing", "expression", "headline", "overlay", "correction"];
const reviewsKey = (account: string, projectId: string) =>
  `thumbnail-studio:edit-reviews:v1:${account}:${projectId}`;
/**
 * What each started edit asked for survives a reload in this tab
 * (sessionStorage, per account and project), keyed by operation ID.
 */
export function loadStudioEditReviews(account: string, projectId: string): Record<string, StudioEditReview> {
  try {
    const value = JSON.parse(sessionStorage.getItem(reviewsKey(account, projectId)) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([, review]) => {
        const entry = review as StudioEditReview;
        return (
          typeof entry?.versionId === "string" &&
          editKinds.includes(entry.request?.kind) &&
          typeof entry.request?.text === "string"
        );
      }),
    ) as Record<string, StudioEditReview>;
  } catch {
    return {};
  }
}
export function saveStudioEditReviews(
  account: string,
  projectId: string,
  reviews: Record<string, StudioEditReview>,
) {
  try {
    if (Object.keys(reviews).length)
      sessionStorage.setItem(reviewsKey(account, projectId), JSON.stringify(reviews));
    else sessionStorage.removeItem(reviewsKey(account, projectId));
  } catch {
    /* Storage unavailable: the review is rebuilt from the operation. */
  }
}
/** Without a saved review (another tab), rebuild what the edit asks from its input. */
export function studioEditRequestFromItem(item: { action: string; input: StudioItemInput }): StudioEditRequest {
  if (item.action === "overlay") return { kind: "overlay", text: item.input.text || "" };
  if (item.input.selectedFindingIds?.length)
    return { kind: "correction", text: item.input.instruction || "" };
  return { kind: "custom", text: item.input.instruction || "" };
}
const kept: Record<StudioEditKind, string> = {
  custom: "Everything the request does not ask to change",
  background: "The subject, its expression and position, and the existing text",
  framing: "The subject, its expression, the background style and the existing text",
  expression: "The person, their clothing, the background, the composition and the existing text",
  headline: "The subject, background, composition, colours and all other text",
  overlay: "The image itself: only the separate headline layer changes",
  correction: "Everything the selected corrections do not mention",
};
/** Spec §8: before an edit starts, say what changes, what is kept, and the rules that still apply. */
export function studioEditSummary(brief: StudioBrief, request: StudioEditRequest) {
  const text = request.text.trim();
  const change =
    request.kind === "headline"
      ? text
        ? `Replace the headline with “${text}”.`
        : "Remove the added headline and captions."
      : request.kind === "overlay"
        ? text
          ? `Set the headline text to “${text}”.`
          : "Remove the headline text."
        : text;
  const keep = [kept[request.kind]];
  const changesText = request.kind === "headline" || request.kind === "overlay";
  if (!changesText && brief.text.mode === "exact" && brief.text.value)
    keep.push(`Exact text: “${brief.text.value}”`);
  if (brief.logoAssetId && brief.rules.logos === "allow") keep.push("Your logo");
  const forbidden = (["faces", "logos", "prices"] as const).filter(
    (key) => brief.rules[key] === "forbid",
  );
  return { change, keep, forbidden, rules: brief.rules.additional };
}
/**
 * Spec §8, compact: right above the button (or under running work), what
 * changes, then what is kept with the rules that still apply — two short lines.
 */
export function StudioEditSummary({
  brief,
  request,
}: {
  brief: StudioBrief;
  request: StudioEditRequest;
}) {
  const summary = studioEditSummary(brief, request);
  const kept = [
    summary.keep.join("; "),
    summary.forbidden.length ? `Not added: ${summary.forbidden.join(", ")}` : "",
    summary.rules.length ? `Your rules: ${summary.rules.join("; ")}` : "",
  ].filter(Boolean).join(" · ");
  return (
    <div className="min-w-0 space-y-0.5 text-xs leading-5">
      <p className="line-clamp-2" title={summary.change}>
        <span className="font-medium text-orange-300">What changes</span>{" "}
        <span className="text-zinc-100">{summary.change}</span>
      </p>
      <p className="text-zinc-400">
        <span className="font-medium text-zinc-300">What is kept</span> {kept}
      </p>
    </div>
  );
}
