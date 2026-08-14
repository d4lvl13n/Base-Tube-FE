import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ChannelAuditRefreshActionProps {
  onRun?: () => void;
  isRunning?: boolean;
  className?: string;
}

/**
 * A fresh audit is intentionally a new historical report, not a mutation of the
 * report currently on screen. Keeping that distinction in the control itself
 * makes the action predictable before the creator spends time waiting for it.
 */
export const ChannelAuditRefreshAction: React.FC<ChannelAuditRefreshActionProps> = ({
  onRun,
  isRunning = false,
  className = '',
}) => {
  if (!onRun) return null;

  return (
    <div className={`flex flex-col items-start sm:items-end gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={onRun}
        disabled={isRunning}
        aria-busy={isRunning}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#fa7517]/35
                   bg-[#fa7517] px-4 py-2.5 text-sm font-semibold text-white
                   shadow-[0_14px_35px_-18px_rgba(250,117,23,0.9)] transition-all
                   hover:-translate-y-0.5 hover:bg-[#ff842f] hover:border-[#ff9a52]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/70 focus-visible:ring-offset-2
                   focus-visible:ring-offset-[#09090b] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-65"
      >
        <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isRunning ? 'Running fresh audit…' : 'Run fresh audit'}
      </button>
      <p className="text-[11px] leading-4 text-zinc-500">
        Creates a new report. This one stays in history.
      </p>
    </div>
  );
};

export default ChannelAuditRefreshAction;
