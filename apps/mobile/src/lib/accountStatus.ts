import { useSyncExternalStore } from 'react';
import type { AccountRestriction } from '@basetube/api';

/**
 * Suspended / banned account state, fed by the SDK's `onAccountRestricted`
 * (wired in src/lib/client.ts) and read by `AccountGate` in app/_layout.tsx.
 *
 * The backend still answers public routes for such an account (as anonymous),
 * so the "Account suspended" screen is not a dead end: "Keep watching" closes
 * it, and it only comes back when the person tries a signed-in action again.
 *
 * Loop guards:
 *   - `presented`: the screen is on top; further refusals change nothing.
 *   - `dismissed`: the person closed it (any way: button, back gesture). Only
 *     `reopen()` — called for a refused USER ACTION — shows it again; background
 *     loads that keep getting 403 never do.
 *
 * It clears on sign-out, on a sign-in / account switch, and when the account
 * endpoint answers again (`clear()`, see src/lib/query.ts).
 */
export interface AccountStatusState {
  restriction: AccountRestriction | null;
  presented: boolean;
  dismissed: boolean;
}

const EMPTY: AccountStatusState = { restriction: null, presented: false, dismissed: false };

let state: AccountStatusState = EMPTY;
/** Clerk user id of the current session; null while signed out. */
let sessionUserId: string | null = null;
const listeners = new Set<() => void>();

function set(next: AccountStatusState) {
  if (
    next.restriction === state.restriction &&
    next.presented === state.presented &&
    next.dismissed === state.dismissed
  ) {
    return;
  }
  state = next;
  listeners.forEach((listener) => listener());
}

/** SDK callback: a request was refused with ACCOUNT_SUSPENDED / ACCOUNT_BANNED. */
export function reportAccountRestriction(restriction: AccountRestriction): void {
  // Never for a signed-out app (e.g. a late response after sign-out).
  if (!sessionUserId) return;
  if (state.restriction === null) {
    set({ restriction, presented: false, dismissed: false });
  } else if (state.restriction !== restriction) {
    set({ ...state, restriction });
  }
}

/** A signed-in action was refused: show the screen again if it was closed. */
export function reopenAccountRestriction(): void {
  if (state.restriction && state.dismissed) {
    set({ ...state, presented: false, dismissed: false });
  }
}

export function markAccountScreenPresented(): void {
  if (state.restriction && !state.presented) set({ ...state, presented: true });
}

export function markAccountScreenDismissed(): void {
  if (!state.restriction) return;
  set({ ...state, presented: false, dismissed: true });
}

/** The account answered normally again (or the session changed). */
export function clearAccountRestriction(): void {
  set(EMPTY);
}

/** Called by AccountGate on every Clerk session change. */
export function setAccountSession(userId: string | null): void {
  if (userId === sessionUserId) return;
  sessionUserId = userId;
  clearAccountRestriction();
}

export function getAccountStatus(): AccountStatusState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAccountStatus(): AccountStatusState {
  return useSyncExternalStore(subscribe, getAccountStatus, getAccountStatus);
}
