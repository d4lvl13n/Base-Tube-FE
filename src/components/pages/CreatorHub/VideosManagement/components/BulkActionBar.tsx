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
        className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border
                   border-gray-800/50 bg-black/80 px-4 py-3 backdrop-blur-md"
        role="region"
        aria-label="Bulk actions"
      >
        <span className="text-sm font-medium text-white">
          {count} selected
        </span>
        <span className="text-gray-700" aria-hidden="true">·</span>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction('make_public')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-300
                     transition-colors hover:bg-gray-800/60 hover:text-white
                     disabled:cursor-not-allowed disabled:opacity-50
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Make public
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction('make_private')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-300
                     transition-colors hover:bg-gray-800/60 hover:text-white
                     disabled:cursor-not-allowed disabled:opacity-50
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60"
        >
          <EyeOff className="h-4 w-4" aria-hidden="true" />
          Make private
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction('delete')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-400
                     transition-colors hover:bg-red-500/10 hover:text-red-300
                     disabled:cursor-not-allowed disabled:opacity-50
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500/60"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-auto rounded-lg p-1.5 text-gray-500 transition-colors hover:text-white
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BulkActionBar;
