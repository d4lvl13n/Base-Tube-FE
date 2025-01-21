import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthenticationStep } from '../../../types/auth';
import WalletWrapper from './WalletWrapper';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConnectWalletButtonProps {
  className?: string;
  customText?: string;
}

export default function ConnectWalletButton({
  className,
  customText
}: ConnectWalletButtonProps) {
  const { connect, isAuthenticated, step } = useAuth();

  const buttonText = customText ?? (
    isAuthenticated 
      ? localStorage.getItem('wallet_username') || 'My Wallet'
      : step === AuthenticationStep.IDLE 
        ? 'Connect Wallet' 
        : 'Connecting...'
  );

  const handleConnect = async () => {
    if (isAuthenticated) return;
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        translateY: -1
      }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <WalletWrapper
        text={buttonText}
        className={`
          relative group overflow-hidden
          bg-black/70
          backdrop-blur-sm
          border border-white/5
          hover:border-[#fa7517]/20
          text-white/70
          hover:text-white
          transition-all duration-300

          /* Gradient effect */
          before:absolute before:inset-0 
          before:bg-gradient-to-r before:from-[#fa7517] before:to-orange-400 
          before:opacity-0 before:hover:opacity-10
          before:transition-opacity before:duration-300

          /* Mobile Styles */
          md:hidden
          rounded-full
          w-10 h-10
          flex items-center justify-center

          /* Desktop Styles */
          md:flex md:items-center md:gap-2
          md:rounded-lg md:px-4 md:h-10
          md:bg-gradient-to-r md:from-black/70 md:to-black/60
          md:hover:from-[#fa7517]/20 md:hover:to-transparent
          
          /* Shadow effects */
          shadow-[0_0_30px_-15px] shadow-black
          hover:shadow-[0_0_30px_-10px] hover:shadow-[#fa7517]/20
          ${className}
        `}
        onConnect={handleConnect}
        withWalletAggregator={!isAuthenticated}
        icon={
          <div className="opacity-70 group-hover:opacity-100 transition-opacity md:mr-2">
            <Wallet className="w-5 h-5 md:w-4 md:h-4" />
          </div>
        }
      >
        <span className="hidden md:inline">{buttonText}</span>
      </WalletWrapper>
    </motion.div>
  );
} 