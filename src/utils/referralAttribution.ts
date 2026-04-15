export const PENDING_REFERRAL_CODE_KEY = 'pending_referral_code';

export const storePendingReferralCode = (code: string | null | undefined) => {
  const normalizedCode = code?.trim();
  if (!normalizedCode) {
    return;
  }

  localStorage.setItem(PENDING_REFERRAL_CODE_KEY, normalizedCode);
};

export const getPendingReferralCode = () => {
  return localStorage.getItem(PENDING_REFERRAL_CODE_KEY)?.trim() || null;
};

export const clearPendingReferralCode = () => {
  localStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
};

