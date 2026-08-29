import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Trash2, X } from 'lucide-react';
import { BulkAction } from '../types';

interface BulkActionBarProps {
  count: number;
  busy: boolean;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
}

const ACTION =
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-300 ' +
  'transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed ' +
  'disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[#fa7517]/40';

/**
 * The bar that appears once anything is ticked.
 *
 * There is no bulk endpoint, so every button here fans out into one request
 * per video; the page reports the outcome as a single sentence rather than a
 * toast per row.
 */
export const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, busy, onAction, onClear }) => (
  <AnimatePresence>
    {count > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="sticky bottom-4 z-20 flex flex-wrap items-center gap-1 rounded-xl border
                   border-gray-800/60 bg-[#0f0f0f]/95 px-3 py-2 shadow-2xl backdrop-blur-md"
        role="region"
        aria-label="Bulk actions"
      >
        <span className="px-1.5 text-sm text-gray-100">{count} selected</span>
        <span className="px-1 text-gray-700" aria-hidden="true">
          ·
        </span>
        <button type="button" disabled={busy} onClick={() => onAction('make_public')} className={ACTION}>
          <Eye className="h-4 w-4" aria-hidden="true" />
          Make public
        </button>
        <button type="button" disabled={busy} onClick={() => onAction('make_private')} className={ACTION}>
          <EyeOff className="h-4 w-4" aria-hidden="true" />
          Make private
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction('delete')}
          className={`${ACTION} text-red-400 hover:bg-red-500/10 hover:text-red-300`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500
                     transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-[#fa7517]/40"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BulkActionBar;
