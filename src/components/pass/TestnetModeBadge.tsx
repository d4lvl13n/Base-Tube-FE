import React from 'react';
import { FlaskConical } from 'lucide-react';

export interface TestnetModeBadgeProps {
  className?: string;
  label?: string;
}

const isTestnetModeEnabled = process.env.REACT_APP_CRYPTO_USE_RELAYER === 'true';

const TestnetModeBadge: React.FC<TestnetModeBadgeProps> = ({
  className = '',
  label = 'Testnet mode',
}) => {
  if (!isTestnetModeEnabled) return null;

  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        'bg-[#fa7517]/10 border border-[#fa7517]/25 backdrop-blur-sm',
        'text-xs font-semibold tracking-wide text-orange-200',
        className,
      ].join(' ')}
      title="On-chain actions are running in test mode (testnet)."
    >
      <FlaskConical className="w-3.5 h-3.5 text-[#fa7517]" />
      <span className="uppercase">{label}</span>
    </div>
  );
};

export default TestnetModeBadge;

