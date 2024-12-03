import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useChannelSubscription } from '../../../hooks/useChannelSubscription';
import { useChannelData } from '../../../hooks/useChannelData';
import { toast } from 'react-toastify';

interface SubscribeButtonProps {
  channelId: number;
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
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to update subscription');
    }
  };

  return (
    <motion.button
      className={`px-4 py-2 rounded-full font-bold overflow-hidden relative ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSubscribe}
      disabled={isLoading || !isLoaded || isChannelLoading}
      layout
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={channel?.isSubscribed ? 'subscribed' : 'unsubscribed'}
          className={`absolute inset-0 ${
            channel?.isSubscribed
              ? 'bg-gray-700'
              : 'bg-[#fa7517]'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isLoading || isChannelLoading ? (
          <motion.div
            key="loading"
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          </motion.div>
        ) : (
          <motion.div
            key={channel?.isSubscribed ? 'subscribed' : 'unsubscribed'}
            className={`relative flex items-center justify-center ${
              channel?.isSubscribed ? 'text-white' : 'text-black'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {channel?.isSubscribed ? (
              <>
                <CheckCircle className="inline-block mr-2" size={18} />
                <span>Subscribed</span>
              </>
            ) : (
              <span>Subscribe</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};