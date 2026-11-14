// Pure rules behind the creator's pass actions (pause / resume a sale, remove
// a video): which control a pass shows, what the confirmations say, and how
// an answer from the server is written into the cached business screens so
// they change at once. No React here: unit-tested on its own.

import type {
  CreatorBusinessErrorBody,
  PassRow,
  PassSummary,
  SalePause,
} from '../../../../types/creatorBusiness';

/** The fields of a pass the controls read (a PassRow, a PassSummary or the pass of a detail answer). */
export type SaleSubject = Pick<PassSummary, 'passId' | 'title' | 'status' | 'purchaseBlock' | 'salePause'>;

export type SaleControl =
  /** Sales are on (or blocked only by something else): the creator may pause them. */
  | { kind: 'pause' }
  /** The creator paused them: they may resume. */
  | { kind: 'resume' }
  /** BaseTube paused them: nothing the creator can press; say who and why. */
  | { kind: 'basetube'; reason: string | null }
  /** Not published yet (draft, publishing, failed): there is no sale to pause. */
  | { kind: 'none' };

const UNPUBLISHED: ReadonlyArray<PassSummary['status']> = ['draft', 'publishing', 'publish_failed'];

export function saleControl(pass: SaleSubject): SaleControl {
  if (pass.salePause?.by === 'basetube') return { kind: 'basetube', reason: pass.salePause.reason };
  if (pass.salePause?.by === 'you') return { kind: 'resume' };
  if (UNPUBLISHED.includes(pass.status) || pass.purchaseBlock.code === 'PASS_NOT_PUBLISHED') return { kind: 'none' };
  return { kind: 'pause' };
}

/** What "Pause sales" does, said before the creator confirms. */
export const PAUSE_CONFIRM_LINES: readonly string[] = [
  'New buyers cannot buy this pass. Its page says that sales are paused.',
  'Everyone who holds this pass keeps access to every video.',
  'A checkout that is already paid still goes through.',
  'You can resume sales at any time.',
];

/**
 * "1 person holds" / "3 people hold". Access belongs to whoever holds the pass
 * now (a pass can be resold), so sentences about access say "hold", not "bought".
 */
export const holdersText = (n: number): string =>
  n === 1 ? '1 person holds' : `${n.toLocaleString('en-US')} people hold`;

/** The confirmation of a video removal, from the number of people who can watch it now. */
export function removeConfirmLines(buyersWithAccess: number): string[] {
  const common = [
    'The video stays on YouTube; it only leaves this pass.',
    'Purchases, play history and statistics are kept. Nothing is refunded.',
    'You can add it back later.',
  ];
  if (buyersWithAccess <= 0) return ['Nobody holds this pass yet, so nobody loses anything.', ...common];
  return [
    `${holdersText(buyersWithAccess)} this pass. This video no longer plays for them; removing it takes it out of the pass they hold.`,
    'Replacing it instead gives them a working video in its place.',
    'Their purchase and the other videos of the pass stay as they are.',
    ...common,
  ];
}

/** The checkbox the creator ticks before removing a video people paid for. */
export const removeAcknowledgement = (buyersWithAccess: number): string =>
  `I understand that this video leaves the pass ${holdersText(buyersWithAccess)}.`;

/** The words of a refused resume: the server's sentence, then each thing to fix. */
export function resumeRefusalLines(error: CreatorBusinessErrorBody | null): string[] {
  if (!error) return [];
  if (error.code === 'SALE_CANNOT_RESUME' && error.blockers?.length) return error.blockers.map((b) => b.reason);
  return [error.message];
}

// --- Writing an answer into the cached screens ----------------------------------------

type WithItems = { items: PassRow[] };
type WithPass = { pass: { passId: string } };

const isWithItems = (data: unknown): data is WithItems =>
  !!data && typeof data === 'object' && Array.isArray((data as WithItems).items) && (data as WithItems).items.every((i) => i && typeof i === 'object' && 'passId' in i);
const isWithPass = (data: unknown): data is WithPass =>
  !!data && typeof data === 'object' && !!(data as WithPass).pass && typeof (data as WithPass).pass === 'object' && typeof (data as WithPass).pass.passId === 'string';

/**
 * A cached business answer with this pass's new state (status, label, block,
 * pause) in every place it appears: list rows (`items`) and single-pass
 * answers (`pass`). Anything else is returned unchanged (same object).
 */
export function applyPassSummary<T>(data: T, summary: PassSummary): T {
  if (isWithItems(data)) {
    let changed = false;
    const items = data.items.map((row) => {
      if (row.passId !== summary.passId) return row;
      changed = true;
      return { ...row, ...summary };
    });
    return changed ? ({ ...data, items } as T) : data;
  }
  if (isWithPass(data) && data.pass.passId === summary.passId) {
    return { ...data, pass: { ...data.pass, ...summary } } as T;
  }
  return data;
}

/** Finds this pass's current summary in a cached answer (to build the optimistic one). */
export function findPassSummary(data: unknown, passId: string): PassSummary | null {
  if (isWithItems(data)) return (data.items.find((row) => row.passId === passId) as PassSummary | undefined) ?? null;
  if (isWithPass(data) && data.pass.passId === passId) return data.pass as unknown as PassSummary;
  return null;
}

const CREATOR_PAUSE_REASON =
  'You paused the sales of this pass. Nobody new can buy it until you resume them; people who hold it keep their access.';

/**
 * What a pass looks like the moment the creator confirms "Pause sales",
 * before the server answers. Only a pass that could be bought turns to
 * "Sales paused"; one blocked by something else keeps that reason (the
 * server says the same: its first block wins).
 */
export function optimisticPaused(summary: PassSummary, now: Date = new Date()): PassSummary {
  const salePause: SalePause = { by: 'you', at: now.toISOString(), reason: null, canResume: true };
  if (!summary.purchaseBlock.canPurchase && summary.status !== 'sales_off') return { ...summary, salePause };
  return {
    ...summary,
    status: 'paused',
    statusLabel: 'Sales paused',
    purchaseBlock: { canPurchase: false, code: 'PASS_SALE_INACTIVE', reason: CREATOR_PAUSE_REASON },
    salePause,
  };
}
