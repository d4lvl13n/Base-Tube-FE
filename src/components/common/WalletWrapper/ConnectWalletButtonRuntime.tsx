import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthenticationStep } from '../../../types/auth';
import WalletWrapper from './WalletWrapper';
import { connectWalletButtonStyles } from './connectWalletButtonStyles';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConnectWalletButtonProps {
  className?: string;
  customText?: string;
  openOnMount?: boolean;
}

export default function ConnectWalletButton({
  className,
  customText,
  openOnMount = false
}: ConnectWalletButtonProps) {
  const { connect, isAuthenticated, step } = useAuth();
  const control = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (!openOnMount || opened.current || isAuthenticated) return;
    opened.current = true;
    control.current?.querySelector<HTMLButtonElement>('button')?.click();
  }, [openOnMount, isAuthenticated]);

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
      ref={control}
      whileHover={{
        scale: 1.05,
        translateY: -1
      }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <WalletWrapper
        text={buttonText}
        className={`${connectWalletButtonStyles} ${className || ''}`}
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
