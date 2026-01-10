import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, AlertTriangle } from 'lucide-react';

export interface TestnetModeBadgeProps {
  className?: string;
  /** Optional localStorage key override (mostly for testing). */
  storageKey?: string;
  /** Offset from the top of the viewport (in px) to sit below fixed headers. */
  topOffsetPx?: number;
}

const DEFAULT_STORAGE_KEY = 'basetube:testnet_notice_dismissed:v1';

const TestnetModeBadge: React.FC<TestnetModeBadgeProps> = ({
  className = '',
  storageKey = DEFAULT_STORAGE_KEY,
  topOffsetPx = 64,
}) => {
  const isTestnetModeEnabled = useMemo(
    () => process.env.REACT_APP_CRYPTO_USE_RELAYER === 'true',
    []
  );

  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (!isTestnetModeEnabled) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      setIsDismissed(raw === '1');
    } catch {
      // ignore
    }
  }, [isTestnetModeEnabled, storageKey]);

  if (!isTestnetModeEnabled || isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={[
        // Sticky “toast bar” that takes layout space but stays visible while scrolling
        'sticky z-40 w-full',
        'bg-gradient-to-r from-yellow-500/15 via-orange-500/15 to-yellow-500/15',
        'border-b border-yellow-500/30 backdrop-blur-md',
        className,
      ].join(' ')}
      style={{ top: topOffsetPx }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-3 text-yellow-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-2 font-semibold shrink-0">
            <AlertTriangle className="w-4 h-4" />
            <span className="uppercase tracking-wide text-xs">Test mode</span>
          </span>
          <span className="text-sm text-yellow-100/90 truncate">
            Blockchain transactions are on <strong>Base Sepolia</strong>. No real funds required.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide text-yellow-300 border border-yellow-500/30 bg-black/20"
            title="On-chain actions are running in test mode on Base Sepolia testnet."
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Sepolia</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
              try {
                window.localStorage.setItem(storageKey, '1');
              } catch {
                // ignore
              }
            }}
            className="rounded-md px-2 py-1 text-yellow-200/90 hover:text-yellow-50 hover:bg-black/20 transition-colors"
            aria-label="Dismiss test mode notice"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TestnetModeBadge;

