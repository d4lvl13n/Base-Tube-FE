import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useChannelSubscription } from '../../../hooks/useChannelSubscription';
import { useChannelData } from '../../../hooks/useChannelData';
import { toast } from 'react-toastify';

interface SubscribeButtonProps {
  channelId: string;
  className?: string;
}

export const SubscribeButton: React.FC<SubscribeButtonProps> = ({
  channelId,
  className = ''
}) => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const { subscribe, unsubscribe, isLoading } = useChannelSubscription();
  const { channel, isLoading: isChannelLoading } = useChannelData(channelId);

  const handleSubscribe = async (event: React.MouseEvent) => {
    event.stopPropagation();

    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate('/sign-in', { state: { from: window.location.pathname } });
      return;
    }

    try {
      if (channel?.isSubscribed) {
        await unsubscribe.mutateAsync(channelId);
        toast.success('Successfully unsubscribed from channel');
      } else {
        await subscribe.mutateAsync(channelId);
        toast.success('Successfully subscribed to channel');
      }
      // The subscription status will update via React Query cache
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to update subscription');
    }
  };

  return (
    <motion.button
      className={`px-4 py-2 rounded-full font-bold ${
        channel?.isSubscribed
          ? 'bg-gray-700 text-white hover:bg-gray-600'
          : 'bg-[#fa7517] text-black hover:bg-[#ff8c3a]'
      } ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSubscribe}
      disabled={isLoading || !isLoaded || isChannelLoading}
    >
      {isLoading || isChannelLoading ? (
        'Loading...'
      ) : channel?.isSubscribed ? (
        <>
          <CheckCircle className="inline-block mr-2" size={18} />
          Subscribed
        </>
      ) : (
        'Subscribe'
      )}
    </motion.button>
  );
};