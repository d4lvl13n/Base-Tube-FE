/**
 * Pure helpers for draft autosave. No network, no storage, no clock.
 *
 * The workspace keeps three things per draft:
 *   - `desired`  — what the creator sees and typed (always wins on screen);
 *   - `pending`  — the subset of `desired` the server has not acknowledged;
 *   - `server`   — the last projection the server committed.
 *
 * The rules that keep typing safe (UP-UX §7):
 *   - an acknowledgement retires a pending field only if it still holds the
 *     value that was SENT — text typed while the request was on the wire stays
 *     pending and is never replaced by the older response;
 *   - nothing here merges a conflict: `DRAFT_REVISION_CONFLICT` is resolved by
 *     the creator, never by these functions.
 */
import type { CreatorDraftView } from './contracts';

/** Same limits as the Upload V2 metadata schema (UP-BE §5: "limites identiques"). */
export const DRAFT_TITLE_MAX = 255;
export const DRAFT_DESCRIPTION_MAX = 5_000;
export const DRAFT_TAGS_MAX = 20;
export const DRAFT_TAG_MAX = 64;

export interface DraftEditableFields {
  title: string;
  description: string | null;
  tags: string[] | null;
}

export type DraftFieldPatch = Partial<DraftEditableFields>;

const FIELDS: readonly (keyof DraftEditableFields)[] = ['title', 'description', 'tags'];

export function sameFieldValue<K extends keyof DraftEditableFields>(
  key: K,
  a: DraftEditableFields[K] | undefined,
  b: DraftEditableFields[K] | undefined,
): boolean {
  if (key !== 'tags') return a === b;
  const left = (a as string[] | null | undefined) ?? null;
  const right = (b as string[] | null | undefined) ?? null;
  if (left === null || right === null) return left === right;
  return left.length === right.length && left.every((tag, index) => tag === right[index]);
}

export function hasPendingEdits(pending: DraftFieldPatch | null | undefined): boolean {
  return !!pending && FIELDS.some((key) => key in pending);
}

/** Folds a new edit into the pending set; the newest value of a field wins. */
export function mergePendingEdits(
  pending: DraftFieldPatch | null | undefined,
  patch: DraftFieldPatch,
): DraftFieldPatch {
  const merged: DraftFieldPatch = { ...(pending ?? {}) };
  for (const key of FIELDS) {
    if (key in patch) (merged as Record<string, unknown>)[key] = patch[key];
  }
  return merged;
}

/**
 * What remains pending after the server acknowledged `sent`.
 *
 * A field is retired only when the pending value is still the one sent. If the
 * creator typed again meanwhile, the newer value stays pending for the next save.
 */
export function remainingAfterAck(
  pending: DraftFieldPatch | null | undefined,
  sent: DraftFieldPatch,
): DraftFieldPatch | null {
  if (!pending) return null;
  const remaining: DraftFieldPatch = {};
  for (const key of FIELDS) {
    if (!(key in pending)) continue;
    const stillSent = key in sent && sameFieldValue(key, pending[key], sent[key]);
    if (!stillSent) (remaining as Record<string, unknown>)[key] = pending[key];
  }
  return hasPendingEdits(remaining) ? remaining : null;
}

/** The fields of `desired` that differ from what the server holds. */
export function diffAgainstServer(
  desired: DraftEditableFields,
  server: Pick<CreatorDraftView, 'title' | 'description' | 'tags'>,
): DraftFieldPatch | null {
  const patch: DraftFieldPatch = {};
  for (const key of FIELDS) {
    if (!sameFieldValue(key, desired[key], server[key])) {
      (patch as Record<string, unknown>)[key] = desired[key];
    }
  }
  return hasPendingEdits(patch) ? patch : null;
}

/**
 * What the editor shows after a server answer: pending fields keep the local
 * value, every other field takes the committed server value (which may have
 * been normalised, e.g. trimmed).
 */
export function visibleFields(
  server: Pick<CreatorDraftView, 'title' | 'description' | 'tags'>,
  pending: DraftFieldPatch | null | undefined,
): DraftEditableFields {
  return {
    title: pending && 'title' in pending ? (pending.title as string) : server.title,
    description:
      pending && 'description' in pending ? (pending.description ?? null) : server.description,
    tags: pending && 'tags' in pending ? (pending.tags ?? null) : server.tags,
  };
}

export type DraftFieldProblem =
  | 'TITLE_REQUIRED'
  | 'TITLE_TOO_LONG'
  | 'DESCRIPTION_TOO_LONG'
  | 'TOO_MANY_TAGS'
  | 'TAG_TOO_LONG';

/** Client-side checks mirroring the server schema, so a save is not sent to be refused. */
export function validateDraftFields(fields: DraftEditableFields): DraftFieldProblem[] {
  const problems: DraftFieldProblem[] = [];
  const title = fields.title.trim();
  if (title.length === 0) problems.push('TITLE_REQUIRED');
  if (title.length > DRAFT_TITLE_MAX) problems.push('TITLE_TOO_LONG');
  if ((fields.description ?? '').length > DRAFT_DESCRIPTION_MAX) problems.push('DESCRIPTION_TOO_LONG');
  const tags = fields.tags ?? [];
  if (tags.length > DRAFT_TAGS_MAX) problems.push('TOO_MANY_TAGS');
  if (tags.some((tag) => tag.trim().length > DRAFT_TAG_MAX)) problems.push('TAG_TOO_LONG');
  return problems;
}

/** `PATCH` body for a pending set at a given revision. */
export function patchBodyFor(pending: DraftFieldPatch, expectedRevision: number) {
  const body: { expectedRevision: number } & DraftFieldPatch = { expectedRevision };
  for (const key of FIELDS) {
    if (key in pending) (body as Record<string, unknown>)[key] = pending[key];
  }
  if (body.title !== undefined) body.title = body.title.trim();
  return body;
}
