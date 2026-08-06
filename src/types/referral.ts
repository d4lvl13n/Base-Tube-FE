// src/types/referral.ts
//
// Referral loop (Phase D) API shapes. Mirrors the backend contract in
// base-be/src/controllers/tool/ReferralController.ts (GET /api/v1/referrals/me).
// Additive only.

export interface ReferralStats {
  pending: number;
  rewarded: number;
  rejected: number;
  total: number;
}

export interface MyReferral {
  referral_code: string;
  referral_link: string;
  stats: ReferralStats;
}

export interface MyReferralEnvelope {
  success: boolean;
  data: MyReferral;
}
