// src/api/toolFunnel.ts
//
// Freemium funnel (Phase D) API client. Wraps the anonymous email gate, the
// verified-account confirm/grant callback, and the token-based unsubscribe.
// Uses the shared axios `api` instance (baseURL = REACT_APP_API_URL,
// withCredentials, Clerk-token interceptor). The email-capture endpoint is
// anonymous server-side; the confirm endpoint requires a Clerk session, which
// the interceptor attaches automatically.

import api from './index';
import type {
  EmailCaptureRequest,
  EmailCaptureData,
  ConfirmSignupRequest,
  ConfirmSignupData,
  UnsubscribeData,
  ToolFunnelEnvelope,
} from '../types/toolFunnel';

const BASE_PATH = '/api/v1/tool';
const FINGERPRINT_KEY = 'tool_fingerprint';

/**
 * Returns a stable, anonymous per-browser id used as an anti-farm signal on the
 * funnel + referral endpoints. Best-effort — never throws; falls back to a
 * time-seeded id if localStorage/crypto are unavailable.
 */
export const getToolFingerprint = (): string => {
  try {
    let fp = localStorage.getItem(FINGERPRINT_KEY);
    if (!fp) {
      const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
      fp = cryptoObj?.randomUUID
        ? cryptoObj.randomUUID()
        : `fp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(FINGERPRINT_KEY, fp);
    }
    return fp;
  } catch {
    return `fp_${Date.now()}`;
  }
};

/**
 * POST /api/v1/tool/email-capture (anonymous).
 * Stashes email + explicit marketing consent (+ optional referral ride-along).
 * Does NOT create an account — Clerk verification runs next on the FE.
 */
export const emailCapture = async (
  payload: EmailCaptureRequest
): Promise<EmailCaptureData> => {
  const response = await api.post<ToolFunnelEnvelope<EmailCaptureData>>(
    `${BASE_PATH}/email-capture`,
    {
      email: payload.email,
      marketingConsent: payload.marketingConsent === true,
      referralCode: payload.referralCode ?? undefined,
      fingerprint: payload.fingerprint ?? undefined,
    }
  );
  return response.data.data;
};

/**
 * POST /api/v1/tool/email-capture/confirm (authenticated).
 * Call the instant a Clerk session exists post-verification. Grants the
 * one-time +signup credits (idempotent), records consent, sends the welcome.
 */
export const confirmSignup = async (
  payload: ConfirmSignupRequest = {}
): Promise<ConfirmSignupData> => {
  const response = await api.post<ToolFunnelEnvelope<ConfirmSignupData>>(
    `${BASE_PATH}/email-capture/confirm`,
    {
      marketingConsent: payload.marketingConsent,
      referralCode: payload.referralCode ?? undefined,
      fingerprint: payload.fingerprint ?? undefined,
    }
  );
  return response.data.data;
};

/**
 * POST /api/v1/tool/unsubscribe (no auth). Token-based marketing unsubscribe.
 */
export const unsubscribe = async (token: string): Promise<UnsubscribeData> => {
  const response = await api.post<ToolFunnelEnvelope<UnsubscribeData>>(
    `${BASE_PATH}/unsubscribe`,
    { token }
  );
  return response.data.data;
};

export default { emailCapture, confirmSignup, unsubscribe, getToolFingerprint };
