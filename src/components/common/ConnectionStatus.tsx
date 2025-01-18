import React, { useEffect, useState } from 'react';
import { AuthenticationStep } from '../../types/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectionStatusProps {
  step: AuthenticationStep;
  isCorrectNetwork: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ step, isCorrectNetwork }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (step === AuthenticationStep.IDLE) return;
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2
                     bg-black/80 backdrop-blur-sm
                     px-4 py-2 rounded-lg
                     border border-white/10
                     text-sm text-white
                     shadow-lg shadow-black/20
                     z-50"
        >
          {step === AuthenticationStep.CONNECTING_WALLET && '🔄 Connecting Wallet...'}
          {step === AuthenticationStep.CHECKING_NETWORK && '🌐 Checking Network...'}
          {step === AuthenticationStep.CREATING_ACCOUNT && '✨ Creating Account...'}
          {step === AuthenticationStep.COMPLETED && '✓ Connected'}
          {step === AuthenticationStep.ERROR && '❌ Connection Failed'}
          
          {!isCorrectNetwork && (
            <div className="mt-2 text-yellow-500">
              Please switch to Base Sepolia
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus; 