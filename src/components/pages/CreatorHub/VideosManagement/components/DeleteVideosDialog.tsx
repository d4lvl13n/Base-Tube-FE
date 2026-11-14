import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { button, form, sheet } from '../../Business/businessStyles';

interface DeleteVideosDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

/**
 * The delete confirmation of the Videos screens, in the hub's black sheet.
 *
 * Same contract and behaviour as `common/DeleteConfirmationDialog` (which the
 * rest of the app keeps): a click outside or on Cancel closes it, Delete
 * confirms. Only the look changed: black sheet, hairline border, one red
 * button, a quiet Cancel.
 */
const DeleteVideosDialog: React.FC<DeleteVideosDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
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
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-videos-title"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="relative w-full max-w-md rounded-2xl border border-gray-800/70 bg-black p-6 text-white shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10"
                aria-hidden="true"
              >
                <AlertTriangle className="h-5 w-5 text-red-300" />
              </span>
              <div className="min-w-0 pt-1.5">
                <h2 id="delete-videos-title" className={sheet.title}>
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-800/50 pt-5">
              <button type="button" onClick={onClose} className={form.ghostButton}>
                Cancel
              </button>
              <button type="button" onClick={onConfirm} className={button.danger}>
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteVideosDialog;
