import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { button, form, sheet } from '../../Business/businessStyles';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  /** Stay on the page. */
  onCancel: () => void;
  /** Leave, losing the edits. */
  onConfirm: () => void;
}

/**
 * "You have unsaved changes."
 *
 * Not `window.confirm`: that blocks the page thread, cannot be styled or read
 * on our terms, and stops browser automation dead. Same black sheet as the
 * Videos delete dialog, with the two buttons this question actually has.
 */
export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Unsaved changes"
            className="relative w-full max-w-sm rounded-2xl border border-gray-800/70 bg-black p-6 text-white shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10"
                aria-hidden="true"
              >
                <AlertTriangle className="h-4 w-4 text-amber-300" />
              </span>
              <div className="min-w-0 pt-1">
                <h2 className={sheet.title}>Unsaved changes</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  Leave this page and your edits to this video are lost.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-gray-800/50 pt-5">
              <button type="button" onClick={onCancel} className={form.secondaryButton}>
                Keep editing
              </button>
              <button type="button" onClick={onConfirm} className={button.danger}>
                Discard changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UnsavedChangesDialog;
