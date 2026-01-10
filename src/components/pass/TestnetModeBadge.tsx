import React from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, AlertTriangle } from 'lucide-react';

export interface TestnetModeBadgeProps {
  className?: string;
  label?: string;
  variant?: 'badge' | 'banner';
}

const isTestnetModeEnabled = process.env.REACT_APP_CRYPTO_USE_RELAYER === 'true';

const TestnetModeBadge: React.FC<TestnetModeBadgeProps> = ({
  className = '',
  label = 'Testnet',
  variant = 'badge',
}) => {
  if (!isTestnetModeEnabled) return null;

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          w-full py-2 px-4
          bg-gradient-to-r from-yellow-500/15 via-orange-500/15 to-yellow-500/15
          border-b border-yellow-500/30
          flex items-center justify-center gap-2
          text-yellow-400 text-sm
          ${className}
        `}
      >
        <AlertTriangle className="w-4 h-4" />
        <span>
          <strong>Test Mode:</strong> Blockchain transactions are on Base Sepolia testnet. No real funds required.
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
        'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
        'border border-yellow-500/40',
        'text-xs font-bold tracking-wide text-yellow-400',
        'backdrop-blur-sm shadow-lg shadow-yellow-500/10',
        'cursor-default',
        className,
      ].join(' ')}
      title="On-chain actions are running in test mode on Base Sepolia testnet. No real funds required."
    >
      <FlaskConical className="w-3.5 h-3.5" />
      <span className="uppercase">{label}</span>
      <span className="text-yellow-500/60 text-[10px] font-medium normal-case">(Sepolia)</span>
    </motion.div>
  );
};

export default TestnetModeBadge;

