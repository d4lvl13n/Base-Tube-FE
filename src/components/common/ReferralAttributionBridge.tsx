import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApplyReferralCode } from '../../hooks/useProfileData';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
  storePendingReferralCode,
} from '../../utils/referralAttribution';

const isTerminalReferralError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already applied') ||
    normalized.includes('not found') ||
    normalized.includes('self-referral') ||
    normalized.includes('self referral')
  );
};

const ReferralAttributionBridge: React.FC = () => {
  const location = useLocation();
  const { isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { isAuthenticated: isWeb3Authenticated } = useAuth();
  const applyReferral = useApplyReferralCode();
  const attemptedCodeRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referralCode = params.get('ref')?.trim();
    if (!referralCode) {
      return;
    }

    storePendingReferralCode(referralCode);
  }, [location.search]);

  React.useEffect(() => {
    const pendingCode = getPendingReferralCode();
    if (!pendingCode) {
      attemptedCodeRef.current = null;
      return;
    }

    const hasAuthenticatedSession = isSignedIn || isWeb3Authenticated;
    if (!hasAuthenticatedSession) {
      return;
    }

    if (!isWeb3Authenticated && !isClerkLoaded) {
      return;
    }

    if (applyReferral.isPending || attemptedCodeRef.current === pendingCode) {
      return;
    }

    attemptedCodeRef.current = pendingCode;

    applyReferral.mutate(pendingCode, {
      onSuccess: () => {
        clearPendingReferralCode();
        attemptedCodeRef.current = null;
      },
      onError: (error) => {
        if (isTerminalReferralError(error.message)) {
          clearPendingReferralCode();
        }
      },
    });
  }, [applyReferral, isClerkLoaded, isSignedIn, isWeb3Authenticated]);

  return null;
};

export default ReferralAttributionBridge;
