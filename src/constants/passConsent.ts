/**
 * Must match base-be `src/modules/pass/passConsent.ts`.
 * Prefer `pass.sale_consent` from the API when present.
 */
export const TERMS_VERSION = '2026-08-31.1';
export const WITHDRAWAL_VERSION = '2026-08-31.1';

export const TERMS_TEXT = 'I accept the Terms of Sale and the Creator Pass Terms.';

export const WITHDRAWAL_TEXT =
  'I expressly request immediate access to this digital content and acknowledge that, once delivery or streaming begins, I lose my 14-day right of withdrawal.';

export interface SaleConsentPayload {
  accepted_terms: boolean;
  accepted_withdrawal: boolean;
  terms_version: string;
  withdrawal_version: string;
  terms_hash?: string;
  withdrawal_hash?: string;
}

export interface SaleConsentPublic {
  terms_version: string;
  terms_hash: string;
  terms_text: string;
  withdrawal_version: string;
  withdrawal_hash: string;
  withdrawal_text: string;
}

export function saleConsentPayload(
  consent: SaleConsentPublic | undefined,
  acceptedTerms: boolean,
  acceptedWithdrawal: boolean
): SaleConsentPayload {
  return {
    accepted_terms: acceptedTerms,
    accepted_withdrawal: acceptedWithdrawal,
    terms_version: consent?.terms_version ?? TERMS_VERSION,
    withdrawal_version: consent?.withdrawal_version ?? WITHDRAWAL_VERSION,
    terms_hash: consent?.terms_hash,
    withdrawal_hash: consent?.withdrawal_hash,
  };
}
