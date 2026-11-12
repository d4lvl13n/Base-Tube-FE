/**
 * "This account is suspended / banned" — told apart from every other refusal.
 *
 * The backend's mandatory auth middleware refuses every authenticated request
 * of a blocked account with HTTP 403 and the standard error envelope:
 *
 *   { success: false, error: { code: 'ACCOUNT_SUSPENDED' | 'ACCOUNT_BANNED', message } }
 *
 * Public routes (optional auth) still answer such a caller, as anonymous.
 *
 * The SDK does not replace the error callers receive (they keep getting the
 * same axios error, with `response.status` / `response.data` intact); the
 * transport only stamps `accountRestriction` on it and tells the app through
 * `onAccountRestricted`. Any other 403 — or an unknown future code — is NOT a
 * restriction and keeps flowing through the caller's generic handling.
 */

export type AccountRestriction = 'suspended' | 'banned';

const CODE_TO_RESTRICTION: Record<string, AccountRestriction> = {
  ACCOUNT_SUSPENDED: 'suspended',
  ACCOUNT_BANNED: 'banned',
};

/**
 * Shape of an error that went through the SDK transport: the original error
 * (usually the axios error) with the restriction stamped on it.
 */
export type AccountRestrictedError = Error & { accountRestriction: AccountRestriction };

interface ErrorLike {
  accountRestriction?: unknown;
  /** `UploadApiError` / other SDK error classes: already-parsed status + code. */
  status?: unknown;
  code?: unknown;
  response?: {
    status?: unknown;
    data?: unknown;
  };
}

const fromCode = (code: unknown): AccountRestriction | null =>
  typeof code === 'string' && Object.prototype.hasOwnProperty.call(CODE_TO_RESTRICTION, code)
    ? CODE_TO_RESTRICTION[code]
    : null;

/**
 * Returns `'suspended'` / `'banned'` when `error` is the backend refusing a
 * blocked account, otherwise `null`. Accepts anything thrown by the SDK.
 */
export function accountRestrictionOf(error: unknown): AccountRestriction | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as ErrorLike;

  if (candidate.accountRestriction === 'suspended' || candidate.accountRestriction === 'banned') {
    return candidate.accountRestriction;
  }

  const response = candidate.response;
  if (response && response.status === 403) {
    const body = response.data as { error?: { code?: unknown }; code?: unknown } | null | undefined;
    return fromCode(body?.error?.code) ?? fromCode(body?.code);
  }

  if (candidate.status === 403) return fromCode(candidate.code);
  return null;
}

/** True when `error` is the backend refusing a suspended / banned account. */
export function isAccountRestrictedError(error: unknown): boolean {
  return accountRestrictionOf(error) !== null;
}
