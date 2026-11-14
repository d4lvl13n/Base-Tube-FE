/**
 * Must match base-be `src/modules/pass/passConsent.ts`.
 * Prefer `pass.sale_consent` from the API when present.
 */
export const TERMS_VERSION = '2026-08-31.1';
export const WITHDRAWAL_VERSION = '2026-08-31.1';

export const TERMS_TEXT = 'I accept the Terms of Sale and the Creator Pass Terms.';

export const WITHDRAWAL_TEXT =
  'I expressly request immediate access to this digital content and acknowledge that, once delivery or streaming begins, I lose my 14-day right of withdrawal.';

/**
 * Buyer disclosure (always shown near Buy, not a checkbox) and the optional
 * creator-contact checkbox. Bump the version whenever a sentence changes:
 * the purchase stores the version the buyer saw.
 */
export const PASS_BUYER_DISCLOSURE_VERSION = '2026-11-13';
export const CREATOR_CONTACT_CONSENT_VERSION = '2026-11-13';

export const PASS_BUYER_DISCLOSURE_TEXT =
  'When you buy, the creator sees that you bought this pass, your name, your email address and whether you have opened each video, so they can give you access and support.';

export const creatorContactConsentText = (creatorName?: string | null) =>
  `Optional: let ${creatorName?.trim() || 'this creator'} email me about new releases. I can withdraw this at any time in My Passes.`;

/** Where the privacy page explains what creators see. */
export const PASSES_PRIVACY_ANCHOR = '/privacy#passes-and-creators';
export const PASS_TERMS_OF_SALE_PATH = '/terms/content-passes';
export const CREATOR_PASS_TERMS_PATH = '/terms/creator-passes';

export interface SaleConsentPayload {
  accepted_terms: boolean;
  accepted_withdrawal: boolean;
  terms_version: string;
  withdrawal_version: string;
  terms_hash?: string;
  withdrawal_hash?: string;
  /** Optional additions (creator business contract). Old servers ignore them. */
  attribution?: import('../utils/attribution').AttributionPayload;
  creatorContactConsent?: boolean;
  creatorContactConsentVersion?: string;
  disclosureVersion?: string;
}

/**
 * Card checkout and crypto purchase start share one body: the two required
 * boxes, plus the disclosure version shown, the optional contact choice and
 * where the buyer came from (omitted when the browser asks not to be tracked).
 */
export function passCheckoutPayload(
  consent: SaleConsentPublic | undefined,
  acceptedTerms: boolean,
  acceptedWithdrawal: boolean,
  extras: {
    creatorContactConsent: boolean;
    attribution?: import('../utils/attribution').AttributionPayload;
  }
): SaleConsentPayload {
  return {
    ...saleConsentPayload(consent, acceptedTerms, acceptedWithdrawal),
    disclosureVersion: PASS_BUYER_DISCLOSURE_VERSION,
    creatorContactConsent: extras.creatorContactConsent,
    creatorContactConsentVersion: CREATOR_CONTACT_CONSENT_VERSION,
    ...(extras.attribution ? { attribution: extras.attribution } : {}),
  };
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
