import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLinkWallet } from '../../../hooks/useLinkWallet';

interface LinkWalletButtonProps {
  className?: string;
  onSuccess?: () => void;
}

export const LinkWalletButton: React.FC<LinkWalletButtonProps> = ({
  className,
  onSuccess
}) => {
  const { isLinking, linkWallet } = useLinkWallet();
  const queryClient = useQueryClient();

  const handleClick = async () => {
    try {
      const response = await linkWallet();
      if (response) {
        // Force refresh all relevant caches
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['wallet'] }),
          queryClient.invalidateQueries({ queryKey: ['profile'] }),
          queryClient.refetchQueries({ queryKey: ['wallet'] }),
          queryClient.refetchQueries({ queryKey: ['profile'] })
        ]);
        
        onSuccess?.();
      }
    } catch (err) {
      // Error is now handled in the hook via modalState
      console.error('Failed to link wallet:', err);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLinking}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex items-center justify-center gap-2
        px-4 py-2 rounded-lg
        bg-gradient-to-r from-[#fa7517]/10 to-transparent
        hover:from-[#fa7517]/20
        border border-[#fa7517]/20
        text-white
        transition-all duration-300
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      <Wallet className="w-4 h-4 text-[#fa7517]" />
      <span>
        {isLinking ? 'Linking Wallet...' : 'Link Wallet'}
      </span>
    </motion.button>
  );
}; 