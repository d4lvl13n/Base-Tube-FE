import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout, usePurchasedPasses } from '../../hooks/usePass';
import { useRequireAuth } from '../../hooks/useRequireAuth';

interface UnlockButtonProps {
  passId: string;
  className?: string;
}

/**
 * UnlockButton handles authentication gating and kicks off the Stripe checkout
 * It also checks if the user already owns the pass to prevent redundant purchases
 */
export const UnlockButton: React.FC<UnlockButtonProps> = ({ passId, className }) => {
  const requireAuth = useRequireAuth();
  const checkoutMutation = useCheckout();
  const { isPending: isCheckoutPending } = checkoutMutation;
  const navigate = useNavigate();
  
  // Fetch user's purchased passes to check ownership
  const { data: purchasedPasses, isLoading: isPurchasedLoading } = usePurchasedPasses();
  
  // Check if user already owns this pass
  const alreadyOwns = purchasedPasses?.some(pass => pass.id === passId);

  const handleClick = async () => {
    if (isCheckoutPending || isPurchasedLoading) return;

    const ok = await requireAuth();
    if (!ok) return; // user aborted or auth failed
    
    // After authentication, check if user owns the pass
    if (alreadyOwns) {
      navigate(`/watch/${passId}`);
      return;
    }

    // If doesn't own, proceed with checkout
    checkoutMutation.mutate(passId);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCheckoutPending || isPurchasedLoading}
      className={className || 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition'}
    >
      {isCheckoutPending ? 'Redirecting…' : isPurchasedLoading ? 'Checking...' : 'Unlock'}
    </button>
  );
};

export default UnlockButton; 