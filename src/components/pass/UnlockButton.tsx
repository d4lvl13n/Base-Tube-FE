import React from 'react';
import { useCheckout } from '../../hooks/usePass';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import type { SaleConsentPayload } from '../../constants/passConsent';

interface UnlockButtonProps {
  passId: string;
  className?: string;
  onError?: (error: Error) => void;
  consent?: SaleConsentPayload;
  consentReady?: boolean;
  label?: string;
  quantity?: number;
}

/**
 * UnlockButton handles authentication gating and kicks off the Stripe checkout.
 * Quantity is optional (default 1); owners can buy more of the same pass.
 */
export const UnlockButton: React.FC<UnlockButtonProps> = ({
  passId,
  className,
  onError,
  consent,
  consentReady = false,
  label = 'Buy with Card',
  quantity = 1,
}) => {
  const requireAuth = useRequireAuth();
  const checkoutMutation = useCheckout();
  const { isPending: isCheckoutPending } = checkoutMutation;

  const handleClick = async () => {
    if (isCheckoutPending || !consentReady) return;

    const ok = await requireAuth();
    if (!ok) return;

    checkoutMutation.mutate(
      { passId, consent, quantity },
      {
        onError: (err) => onError?.(err),
      }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCheckoutPending || !consentReady}
      className={className || 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition'}
    >
      {isCheckoutPending ? 'Redirecting…' : label}
    </button>
  );
};

export default UnlockButton;
