import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthenticationStep } from '../../../types/auth';
import WalletWrapper from './WalletWrapper';

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
      ? 'My Wallet' 
      : step === AuthenticationStep.IDLE 
        ? 'Connect Wallet' 
        : 'Connecting...'
  );

  const handleConnect = async () => {
    if (isAuthenticated) return; // Don't trigger connect if already authenticated
    
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <WalletWrapper
      text={buttonText}
      className={className}
      onConnect={handleConnect}
    />
  );
} 