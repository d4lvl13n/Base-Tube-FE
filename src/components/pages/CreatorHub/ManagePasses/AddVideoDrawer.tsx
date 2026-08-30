// src/components/pages/CreatorHub/ManagePasses/AddVideoDrawer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Loader2, Plus, Trash2, X } from 'lucide-react';
import { getYouTubeID, youtubeApi } from '../../../../api/youtube';
import { cx, form, list } from '../shared/hubStyles';

interface VideoRow {
  value: string;
  title?: string;
  loading?: boolean;
  error?: string | null;
}

interface AddVideoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videos: { url: string; title?: string }[]) => void;
  isLoading: boolean; // overall loading while submitting
  passTitle?: string;
}

/**
 * The right-hand drawer that adds videos to a pass, in the hub's register:
 * a `#0f0f0f` sheet behind a hairline, a 56 px header bar, the form fields
 * from the edit page, and orange on the one button that commits.
 */
const AddVideoDrawer: React.FC<AddVideoDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  passTitle = 'Content Pass',
}) => {
  const [rows, setRows] = useState<VideoRow[]>([{ value: '' }]);
  const processedUrls = useRef<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Reset drawer state when opened
  useEffect(() => {
    if (isOpen) {
      setRows([{ value: '' }]);
      processedUrls.current.clear();
      setShowConfirmation(false);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Metadata fetching per row
  useEffect(() => {
    rows.forEach((row, idx) => {
      if (!row.value || row.loading || row.title || row.error) return;
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(row.value)) {
        if (row.value) updateRow(idx, { error: 'Invalid URL' });
        return;
      }
      if (processedUrls.current.has(row.value)) return;
      processedUrls.current.add(row.value);
      updateRow(idx, { loading: true, error: null });
      youtubeApi
        .getVideoMetadata(row.value)
        .then((meta) => {
          updateRow(idx, { title: meta.title || '', loading: false });
        })
        .catch(() => {
          updateRow(idx, { loading: false, error: 'Failed to fetch metadata' });
        });
    });
  }, [rows]);

  const updateRow = (index: number, patch: Partial<VideoRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((r) => [...r, { value: '' }]);
  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx));

  const allValid = rows.some((r) => r.value && !r.loading && !r.error);
  const pendingCount = rows.filter((r) => r.value).length;

  const handlePrimary = () => {
    setShowConfirmation(true);
  };

  const confirmAdd = () => {
    setShowConfirmation(false);
    const payload = rows
      .filter((r) => r.value && !r.loading && !r.error)
      .map((r) => ({ url: r.value, title: r.title }));
    if (payload.length) onSubmit(payload);
  };

  // success toast after submission done
  useEffect(() => {
    if (!isLoading && !showConfirmation && rows.length > 0) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  const slide = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { type: 'tween', duration: 0.25, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-gray-800/60 bg-[#0f0f0f] text-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-video-drawer-title"
            {...slide}
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-800/60 px-4 md:px-5">
              <div className="min-w-0 flex-1">
                <h2 id="add-video-drawer-title" className={form.panelTitle}>
                  Add videos
                </h2>
                <p className={list.preview}>to {passTitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={cx(form.ghostButton, 'w-8 px-0')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* body - scrollable area */}
            <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-5">
              {rows.map((row, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`add-video-url-${idx}`} className={form.fieldLabel}>
                      {rows.length > 1 ? `Video ${idx + 1}` : 'Video URL'}
                    </label>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        aria-label={`Remove video ${idx + 1}`}
                        className={cx(list.actionButton, 'h-7 w-7')}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <input
                    id={`add-video-url-${idx}`}
                    value={row.value}
                    onChange={(e) => updateRow(idx, { value: e.target.value, title: undefined, error: null })}
                    placeholder="https://youtube.com/watch?v=…"
                    className={form.input}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {row.loading && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Fetching details…
                    </p>
                  )}
                  {row.error && <p className={form.errorText}>{row.error}</p>}
                  {row.title && !row.loading && (
                    <>
                      <label htmlFor={`add-video-title-${idx}`} className={cx(form.fieldLabel, 'pt-1')}>
                        Title
                      </label>
                      <input
                        id={`add-video-title-${idx}`}
                        value={row.title}
                        onChange={(e) => updateRow(idx, { title: e.target.value })}
                        className={form.input}
                      />
                    </>
                  )}
                  {row.value && !row.loading && !row.error && (
                    <div className={cx(form.frame, 'mt-1')}>
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeID(row.value)}`}
                        className="absolute inset-0 h-full w-full"
                        title={row.title ? `Preview: ${row.title}` : 'Video preview'}
                      />
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={addRow} className={form.inlineAction}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add another video
              </button>
            </div>

            {/* footer - fixed at bottom */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-800/60 px-4 py-3 md:px-5">
              <button type="button" onClick={onClose} className={form.ghostButton}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrimary}
                disabled={!allValid || isLoading || rows.some((r) => r.loading)}
                className={form.primaryButton}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Adding…
                  </>
                ) : (
                  `Add ${pendingCount > 1 ? `${pendingCount} videos` : 'video'}`
                )}
              </button>
            </div>

            {/* Confirmation overlay */}
            <AnimatePresence>
              {showConfirmation && (
                <motion.div
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className={cx(form.panel, 'w-full max-w-sm')}
                    role="alertdialog"
                    aria-labelledby="add-video-confirm-title"
                  >
                    <h3 id="add-video-confirm-title" className={form.panelTitle}>
                      Add {pendingCount} {pendingCount === 1 ? 'video' : 'videos'} to this pass?
                    </h3>
                    <ul className={cx(list.divider, 'mt-3 max-h-40 overflow-y-auto')}>
                      {rows
                        .filter((r) => r.value)
                        .map((r, i) => (
                          <li key={i} className="truncate py-1.5 text-sm text-gray-400" title={r.title || r.value}>
                            {r.title || r.value}
                          </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setShowConfirmation(false)} className={form.ghostButton}>
                        Cancel
                      </button>
                      <button type="button" onClick={confirmAdd} className={form.primaryButton}>
                        Confirm
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success note */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                  transition={{ duration: 0.15 }}
                  role="status"
                  className="absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-md border border-emerald-500/25 bg-[#0f0f0f] px-3 py-1.5 text-xs text-emerald-400"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Videos added
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddVideoDrawer;
