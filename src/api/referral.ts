// src/api/referral.ts
//
// Referral loop (Phase D) API client. Single additive read:
// GET /api/v1/referrals/me → the caller's stable code + shareable link + stats.
// Uses the shared axios `api` instance (Clerk token attached by interceptor).

import api from './index';
import type { MyReferral, MyReferralEnvelope } from '../types/referral';

/** GET /api/v1/referrals/me — requires an authenticated session. */
export const getMyReferral = async (): Promise<MyReferral> => {
  const response = await api.get<MyReferralEnvelope>('/api/v1/referrals/me');
  return response.data.data;
};

export default { getMyReferral };
