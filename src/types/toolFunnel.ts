// src/types/toolFunnel.ts
//
// Freemium funnel (Phase D) API shapes. Mirrors the backend contract in
// base-be/src/controllers/tool/EmailCaptureController.ts. Additive only — these
// types are new and do not alter any existing tool/CTR types.

/** Generic envelope returned by the tool funnel endpoints. */
export interface ToolFunnelEnvelope<T> {
  success: boolean;
  data: T;
}

/** POST /api/v1/tool/email-capture (anonymous) request body. */
export interface EmailCaptureRequest {
  email: string;
  /** Explicit opt-in. Never pre-checked on the UI. */
  marketingConsent: boolean;
  /** Ride-along referral code (from the pending-referral store), if any. */
  referralCode?: string | null;
  /** Stable anonymous client id, if any. */
  fingerprint?: string | null;
}

/** POST /api/v1/tool/email-capture (anonymous) → data. */
export interface EmailCaptureData {
  email: string;
  gated: boolean;
  marketingConsent: boolean;
  /** Always 'verify_email' today; typed loosely for forward-compat. */
  nextStep: 'verify_email' | string;
}

/** POST /api/v1/tool/email-capture/confirm (authenticated) request body. */
export interface ConfirmSignupRequest {
  marketingConsent?: boolean;
  referralCode?: string | null;
  fingerprint?: string | null;
}

/** POST /api/v1/tool/email-capture/confirm (authenticated) → data. */
export interface ConfirmSignupData {
  granted: boolean;
  alreadyGranted: boolean;
  signupCredits: number;
  balance: number | null;
  consentRecorded: boolean;
  welcomeSent: boolean;
}

/** POST /api/v1/tool/unsubscribe → data. */
export interface UnsubscribeData {
  unsubscribed: boolean;
}
