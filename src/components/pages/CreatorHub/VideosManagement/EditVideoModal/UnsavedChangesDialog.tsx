import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

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
 * on our terms, and stops browser automation dead. The app has a delete
 * dialog and a heavily-decorated confirmation modal, neither of which says the
 * right words here — this is the same shape as the delete dialog with the two
 * buttons this question actually has.
 */
export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          role="dialog"
          aria-modal="true"
          aria-label="Unsaved changes"
          className="relative w-full max-w-sm rounded-xl border border-gray-800/60 bg-[#0f0f0f] p-5"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-[#fa7517]/10 p-2">
              <AlertTriangle className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-medium text-gray-100">Unsaved changes</h2>
          </div>
          <p className="mb-5 text-sm text-gray-500">
            Leave this page and your edits to this video are lost.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-8 items-center rounded-md border border-gray-800/60 bg-white/5
                         px-3 text-sm text-gray-300 transition-colors hover:border-gray-700
                         hover:text-white focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[#fa7517]/40"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-8 items-center rounded-md bg-red-500/90 px-3 text-sm
                         font-medium text-white transition-colors hover:bg-red-500
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            >
              Discard changes
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default UnsavedChangesDialog;
