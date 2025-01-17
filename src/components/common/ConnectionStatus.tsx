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
    
    // Show the notification
    setIsVisible(true);

    // Hide after 5 seconds if it's a success state
    if (step === AuthenticationStep.COMPLETED) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [step]);

  if (step === AuthenticationStep.IDLE) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`
            fixed top-20 right-4 p-4 rounded-lg text-sm
            backdrop-blur-sm border border-gray-800/30
            transition-all duration-300
            ${step === AuthenticationStep.ERROR ? 'bg-red-500/10 text-red-400' : 
              step === AuthenticationStep.COMPLETED ? 'bg-green-500/10 text-green-400' :
              'bg-[#fa7517]/10 text-[#fa7517]'}
          `}
        >
          {step === AuthenticationStep.CONNECTING_WALLET && 'Connecting Wallet...'}
          {step === AuthenticationStep.CHECKING_NETWORK && 'Checking Network...'}
          {step === AuthenticationStep.CREATING_ACCOUNT && 'Creating Account...'}
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