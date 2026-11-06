import React, { lazy, Suspense, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { WalletFeature } from '../../../contexts/wallet/WalletFeature';
import { connectWalletButtonStyles } from './connectWalletButtonStyles';

export default function ConnectWalletButton({ className, customText }: { className?: string; customText?: string }) {
  const { isAuthenticated, isRestoring, enableWallet } = useAuth();
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const WalletButton = useMemo(() => lazy(() => import('./ConnectWalletButtonRuntime')), [attempt]);
  const buttonText = requested ? 'Loading wallet…' : customText || 'Connect Wallet';
  const placeholder = <motion.div className="relative" whileHover={{ scale: 1.05, translateY: -1 }} whileTap={{ scale: 0.95 }}>
    <button type="button" aria-label={buttonText} onClick={() => { enableWallet?.(); setRequested(true); }}
      className={`${connectWalletButtonStyles} ${className || ''}`}>
      <div className="opacity-70 group-hover:opacity-100 transition-opacity md:mr-2"><Wallet className="w-5 h-5 md:w-4 md:h-4" /></div>
      <span className="hidden md:inline">{buttonText}</span>
    </button>
  </motion.div>;
  if (!requested && !isAuthenticated && !isRestoring) return placeholder;
  return <WalletFeature fallback={placeholder} onRetry={() => setAttempt(n => n + 1)}><Suspense fallback={placeholder}><WalletButton className={className} customText={customText} openOnMount={requested} /></Suspense></WalletFeature>;
}
