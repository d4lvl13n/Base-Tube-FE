import React from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useConfig } from '../../../../contexts/ConfigContext';
import { PASS_PLAYS_NOTE, viewCountingText } from './metrics';

/**
 * "How views are counted" — the one place a screen states the view rule,
 * from the server's `countingRules` (GET /config/view-config). Cards do not
 * repeat it.
 */
const HowViewsAreCounted: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { viewConfig } = useConfig();
  return (
    <details className={`group rounded-lg border border-gray-800/50 bg-black/30 px-4 py-3 text-sm ${className}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-gray-300 [&::-webkit-details-marker]:hidden">
        <Info className="h-4 w-4 text-gray-500" aria-hidden="true" />
        How views are counted
      </summary>
      <div className="mt-2 space-y-2 text-xs leading-relaxed text-gray-400">
        <p>{viewCountingText(viewConfig.countingRules)}</p>
        <p>
          {PASS_PLAYS_NOTE}{' '}
          <Link to="/creator-hub/passes" className="text-[#fa7517] hover:text-[#ff8c3a]">
            Passes
          </Link>
          {' '}→ open a pass.
        </p>
      </div>
    </details>
  );
};

export default HowViewsAreCounted;
