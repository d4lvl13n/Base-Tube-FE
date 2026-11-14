import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Trash2, X } from 'lucide-react';
import { BulkAction } from '../types';
import { button, cx } from '../../Business/businessStyles';

interface BulkActionBarProps {
  count: number;
  busy: boolean;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
}

const ACTION = cx(button.ghost, 'text-gray-200');
const DANGER = cx(button.ghost, 'text-red-300 hover:bg-red-500/10 hover:text-red-200');

/**
 * The bar that appears once anything is ticked.
 *
 * There is no bulk endpoint, so every button here fans out into one request
 * per video; the page reports the outcome as a single sentence rather than a
 * toast per row.
 */
export const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, busy, onAction, onClear }) => {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          transition={{ duration: reduceMotion ? 0 : 0.15, ease: 'easeOut' }}
          className="sticky bottom-4 z-20 flex flex-wrap items-center gap-1 rounded-xl border
                     border-gray-800/70 bg-black/90 px-3 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-md"
          role="region"
          aria-label="Bulk actions"
        >
          <span className="px-1.5 text-sm font-medium tabular-nums text-white">{count} selected</span>
          <span className="px-1 text-gray-500" aria-hidden="true">
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
          <button type="button" disabled={busy} onClick={() => onAction('delete')} className={DANGER}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
          <button type="button" onClick={onClear} aria-label="Clear selection" className={cx(button.icon, 'ml-auto')}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionBar;
