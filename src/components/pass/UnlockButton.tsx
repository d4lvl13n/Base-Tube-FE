import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout, usePurchasedPasses } from '../../hooks/usePass';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import type { SaleConsentPayload } from '../../constants/passConsent';

interface UnlockButtonProps {
  passId: string;
  className?: string;
  onError?: (error: Error) => void;
  consent?: SaleConsentPayload;
  consentReady?: boolean;
  label?: string;
}

/**
 * UnlockButton handles authentication gating and kicks off the Stripe checkout
 * It also checks if the user already owns the pass to prevent redundant purchases
 */
export const UnlockButton: React.FC<UnlockButtonProps> = ({
  passId,
  className,
  onError,
  consent,
  consentReady = false,
  label = 'Buy with Card',
}) => {
  const requireAuth = useRequireAuth();
  const checkoutMutation = useCheckout();
  const { isPending: isCheckoutPending } = checkoutMutation;
  const navigate = useNavigate();
  
  const { data: purchasedPasses, isLoading: isPurchasedLoading } = usePurchasedPasses();
  
  const alreadyOwns = purchasedPasses?.some(pass => pass.id === passId);

  const handleClick = async () => {
    if (isCheckoutPending || isPurchasedLoading || !consentReady) return;

    const ok = await requireAuth();
    if (!ok) return;
    
    if (alreadyOwns) {
      navigate(`/watch/${passId}`);
      return;
    }

    checkoutMutation.mutate(
      { passId, consent },
      {
        onError: (err) => onError?.(err),
      }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCheckoutPending || isPurchasedLoading || !consentReady}
      className={className || 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition'}
    >
      {isCheckoutPending ? 'Redirecting…' : label}
    </button>
  );
};

export default UnlockButton;
