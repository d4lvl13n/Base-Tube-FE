import React, { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useOnchainKit } from '@coinbase/onchainkit';
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
  const { status } = useAccount();
  const { config } = useOnchainKit();
  const display = config?.wallet?.display;
  const control = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (!openOnMount || opened.current || isAuthenticated || status !== 'disconnected' || display !== 'modal') return;
    const container = control.current;
    if (!container) return;

    // OnchainKit 0.36 Wallet renders null until its own mounted effect. Preserve
    // the user's click until its actual control exists; never call connect/sign.
    const observer = new MutationObserver(openChooserWhenReady);
    function openChooserWhenReady() {
      if (opened.current) return;
      const button = container?.querySelector<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      opened.current = true;
      observer.disconnect();
      button.click();
    }
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    openChooserWhenReady();
    return () => observer.disconnect();
  }, [openOnMount, isAuthenticated, status, display]);

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
