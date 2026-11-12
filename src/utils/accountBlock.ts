/**
 * "This account is suspended / banned" — noticed once, centrally.
 *
 * The backend refuses every AUTHENTICATED request of a blocked account with
 * HTTP 403 and `{ success: false, error: { code: 'ACCOUNT_SUSPENDED' | 'ACCOUNT_BANNED' } }`.
 * Public routes still answer such a caller, as an anonymous visitor, so a
 * signed-out visitor can never receive these codes.
 *
 * Both HTTP clients of the web (the shared axios instance in `src/api/index.ts`
 * and the SDK client in `src/lib/basetubeClient.ts`) report refusals here; the
 * one `AccountBlockedNotice` component reads the state. It lives at module
 * level, not in React state, because an account change remounts the app tree
 * (see `AuthQueryContext`) and the notice must survive that.
 */

export type AccountBlock = 'suspended' | 'banned';

const CODE_TO_BLOCK: Record<string, AccountBlock> = {
  ACCOUNT_SUSPENDED: 'suspended',
  ACCOUNT_BANNED: 'banned',
};

const fromCode = (code: unknown): AccountBlock | null =>
  typeof code === 'string' && Object.prototype.hasOwnProperty.call(CODE_TO_BLOCK, code)
    ? CODE_TO_BLOCK[code]
    : null;

/** `'suspended'` / `'banned'` when the error is the backend refusing a blocked account, else null. */
export function accountBlockOf(error: unknown): AccountBlock | null {
  if (!error || typeof error !== 'object') return null;
  const response = (error as { response?: { status?: unknown; data?: unknown } }).response;
  if (!response || response.status !== 403) return null;
  const body = response.data as { error?: { code?: unknown }; code?: unknown } | null | undefined;
  return fromCode(body?.error?.code) ?? fromCode(body?.code);
}

let current: AccountBlock | null = null;
const listeners = new Set<() => void>();

/** Called by the HTTP clients on every failed response. Ignores anything that is not a block. */
export function noteAccountBlock(error: unknown): void {
  const block = accountBlockOf(error);
  if (!block || block === current) return;
  // A ban is final; a later "suspended" answer (e.g. a request already in
  // flight) must not soften the message.
  if (current === 'banned') return;
  current = block;
  listeners.forEach((listener) => listener());
}

export function subscribeAccountBlock(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAccountBlock(): AccountBlock | null {
  return current;
}
