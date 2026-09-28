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

/** The account's credit balance after the welcome grant. */
export interface ConfirmSignupBalance {
  balance: number;
  reserved: number;
  available: number;
}

/**
 * POST /api/v1/tool/email-capture/confirm (authenticated) → data. A repeat call
 * answers `granted: false, alreadyGranted: true`. When today's welcome credits
 * are all given: `granted: false, deferred: true` and the day they are added
 * (`grantOn`).
 */
export interface ConfirmSignupData {
  granted: boolean;
  alreadyGranted: boolean;
  /** Absent from older servers. */
  deferred?: boolean;
  /** When deferred credits are added (a date, or a date and time). */
  grantOn?: string | null;
  signupCredits: number;
  /** An object on current servers; a plain number on older ones. */
  balance: ConfirmSignupBalance | number | null;
  consentRecorded: boolean;
  welcomeSent: boolean;
}

/**
 * GET /api/v1/tool/welcome-offer (public) → data. What a new account receives
 * once its email is verified.
 */
export interface WelcomeOffer {
  credits: number;
  /** False when today's welcome credits are all given: new accounts get them the next day. */
  available: boolean;
  /** When the next day's welcome credits start. */
  resetsAt: string;
}

/** POST /api/v1/tool/unsubscribe → data. */
export interface UnsubscribeData {
  unsubscribed: boolean;
}
