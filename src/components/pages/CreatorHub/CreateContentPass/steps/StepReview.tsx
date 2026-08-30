import React, { useState } from 'react';
import { UseFormWatch } from 'react-hook-form';
import { cx, form, list, page } from '../../shared/hubStyles';
import { FormData } from '../types';
import { X, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ContentPassSuccessAnimation from '../../../../animations/ContentPassSuccessAnimation';

interface StepReviewProps {
  watch: UseFormWatch<FormData>;
  onConfirm?: () => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  onContinue?: () => void;
  submitError?: string | null;
  submitErrorAction?: 'link-youtube' | 'verify-channel' | 'link-wallet' | null;
  onStartOAuth?: () => void;
  onBackToVideos?: () => void;
}

// Helper to format currency (can be moved to utils)
const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
  if (amount === undefined) amount = 0;
  if (currency === undefined) currency = 'USD';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  // Assuming price is stored in cents, convert to dollars for display
  return formatter.format(amount / 100);
};

// Helper to extract YouTube video ID (can be moved to utils)
function getYouTubeID(url: string | undefined): string {
  if (!url) return '';
  const regExpWatch = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const regExpShort = /^.*(youtu.be\/)([^#&?]*).*/;
  let match = url.match(regExpWatch);
  if (match && match[2].length === 11) return match[2];
  match = url.match(regExpShort);
  if (match && match[2].length === 11) return match[2];
  return '';
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return 'Duration unavailable';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getThumbnailUrl = (url?: string, thumbnailUrl?: string) => {
  if (thumbnailUrl) return thumbnailUrl;
  const videoId = getYouTubeID(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
};

const getSourceLabel = (url?: string) => {
  if (!url) return 'Source unavailable';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'youtube.com';
  }
};

/** Basic rich-text rendering for the description preview, without a typography plugin. */
const richText = `
  max-h-48 overflow-y-auto text-sm leading-6 text-gray-300
  [&_h1]:text-base [&_h1]:font-medium [&_h1]:text-gray-100 [&_h1]:mt-3 [&_h1]:mb-1
  [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-gray-100 [&_h2]:mt-3 [&_h2]:mb-1
  [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-gray-100 [&_h3]:mt-3 [&_h3]:mb-1
  [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5
  [&_a]:text-[#fa7517] [&_strong]:text-gray-100
`;

const StepReview: React.FC<StepReviewProps> = ({
  watch,
  onConfirm,
  isLoading,
  isSuccess,
  onContinue,
  submitError,
  submitErrorAction,
  onStartOAuth,
  onBackToVideos
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const watchedFields = watch();
  const validUrls = watchedFields.src_urls?.filter(u => u?.value?.trim()?.length > 0 && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(u.value)) || [];

  // Format the price for display
  const formattedPrice = formatCurrency(watchedFields.price_cents, watchedFields.currency || 'USD');

  // Handle the confirm button click
  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (onConfirm) onConfirm();
    // After successful creation (controlled by parent via isSuccess prop)
    // the animation will be shown
  };

  // Show success animation when isSuccess changes to true
  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccessAnimation(true);
    }
  }, [isSuccess]);

  // Handler for when the success animation completes
  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    if (onContinue) onContinue();
  };

  const supplyLabel = watchedFields.supply_cap
    ? `${watchedFields.supply_cap} ${Number(watchedFields.supply_cap) === 1 ? 'pass' : 'passes'}`
    : 'Unlimited';

  return (
    <>
      {/* Show success animation when submission is successful */}
      {showSuccessAnimation && (
        <ContentPassSuccessAnimation
          onComplete={handleAnimationComplete}
          passTitle={watchedFields.title || 'Premium Content Pass'}
          passPrice={formattedPrice}
        />
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-white">Review your draft</h2>
          <p className="mt-1 text-sm text-gray-500">
            This saves the pass. It is not for sale until you publish on the next step.
          </p>
        </div>

        <div className={form.grid}>
          {/* ── Summary ──────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <section className={cx(form.panel, 'space-y-4')} aria-label="Pass details">
              <h3 className={form.panelTitle}>Pass details</h3>
              <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2">
                <dt className={page.eyebrow}>Title</dt>
                <dd className="text-sm text-gray-100">{watchedFields.title || 'Untitled Pass'}</dd>
                <dt className={page.eyebrow}>Price</dt>
                <dd className="text-sm tabular-nums text-gray-100">{formattedPrice}</dd>
                <dt className={page.eyebrow}>Supply cap</dt>
                <dd className="text-sm tabular-nums text-gray-100">{supplyLabel}</dd>
                <dt className={page.eyebrow}>Content</dt>
                <dd className="text-sm tabular-nums text-gray-100">
                  {validUrls.length} video{validUrls.length !== 1 ? 's' : ''} included
                </dd>
              </dl>
            </section>

            {watchedFields.description && (
              <section className={cx(form.panel, 'space-y-3')} aria-label="Description">
                <h3 className={form.panelTitle}>Description</h3>
                <div
                  className={richText}
                  dangerouslySetInnerHTML={{ __html: watchedFields.description }}
                />
              </section>
            )}
          </div>

          {/* ── Videos ───────────────────────────────────────────────────── */}
          <section className={list.panel} aria-label="Premium content">
            <div className="border-b border-gray-800/60 px-4 py-3">
              <h3 className={form.panelTitle}>Premium content</h3>
              <p className="mt-1 text-xs text-gray-500">
                Final review uses lightweight source cards. Ownership and unlisted checks still happen when you launch.
              </p>
            </div>
            {validUrls.length > 0 ? (
              <ul className={list.divider}>
                {validUrls.map((urlObj, idx) => {
                  const thumb = getThumbnailUrl(urlObj.value, urlObj.thumbnail_url);
                  const label = urlObj.title || `Video ${idx + 1}`;
                  return (
                    <li key={`preview-${idx}`} className={cx(list.table.row, 'flex items-center gap-3 px-4 py-3')}>
                      <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md border border-gray-800/60 bg-black">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-600">No preview</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-100">{label}</p>
                        <p className={cx(list.preview, 'mt-0.5 tabular-nums')}>
                          {getSourceLabel(urlObj.value)} · {formatDuration(urlObj.duration)}
                        </p>
                      </div>
                      <a
                        href={urlObj.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open source"
                        aria-label={`Open ${label} on YouTube`}
                        className={list.actionButton}
                      >
                        <ExternalLink className={list.actionIcon} aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className={list.emptyState.wrapper}>
                <p className={list.emptyState.title}>No valid video URLs provided.</p>
              </div>
            )}
          </section>
        </div>

        {submitError && (
          <div className={form.errorNote} role="alert">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-medium">Could not save draft</p>
                <p className="mt-0.5 text-red-300/90">{submitError}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {submitErrorAction === 'link-youtube' && onStartOAuth && (
                  <button type="button" onClick={onStartOAuth} className={form.inlineAction}>
                    Connect YouTube
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
                {submitErrorAction === 'verify-channel' && (
                  <a href="/creator-hub/channels" className={form.inlineAction}>
                    Check channel status
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                {submitErrorAction === 'link-wallet' && (
                  <a href="/profile" className={form.inlineAction}>
                    Connect wallet
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                <button type="button" onClick={onBackToVideos} className={form.ghostButton}>
                  Back to videos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Commit ───────────────────────────────────────────────────── */}
        <section className={cx(form.panel, 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between')} aria-label="Save draft">
          <div className="space-y-1.5">
            <p className={page.eyebrow}>What happens next</p>
            <ol className="list-decimal space-y-0.5 pl-5 text-sm text-gray-400">
              <li>We save a draft and attach the videos you selected.</li>
              <li>We check that every video belongs to your linked channel and is unlisted.</li>
              <li>Next you choose how you get paid and publish. Fans cannot buy a draft.</li>
            </ol>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isLoading}
            className={cx(form.primaryButton, 'shrink-0')}
          >
            {isLoading ? 'Saving draft…' : 'Save draft'}
            {!isLoading && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </section>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-draft-title"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className={cx(form.panel, 'w-full max-w-md space-y-4 shadow-2xl')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="confirm-draft-title" className="text-base font-medium text-white">Save this as a draft?</h3>
                  <p className="mt-1 text-sm text-gray-500">This will not go on sale yet.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  aria-label="Close"
                  className={list.actionButton}
                >
                  <X className={list.actionIcon} aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-gray-300">
                We will save <strong className="font-medium text-gray-100">"{watchedFields.title}"</strong> at{' '}
                <strong className="font-medium tabular-nums text-gray-100">{formattedPrice}</strong>. You choose how you get paid and publish on the next screen.
              </p>

              <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-1.5 border-t border-gray-800/60 pt-4">
                <dt className={page.eyebrow}>Supply</dt>
                <dd className="text-sm tabular-nums text-gray-100">
                  Limited to {watchedFields.supply_cap || 'unlimited'} passes
                </dd>
                <dt className={page.eyebrow}>Content</dt>
                <dd className="text-sm tabular-nums text-gray-100">
                  {validUrls.length} premium video{validUrls.length !== 1 ? 's' : ''}
                </dd>
              </dl>

              <div className="flex items-center justify-end gap-2 border-t border-gray-800/60 pt-4">
                <button type="button" onClick={() => setShowConfirmModal(false)} className={form.ghostButton}>
                  Not yet
                </button>
                <button type="button" onClick={handleConfirm} disabled={isLoading} className={form.primaryButton}>
                  {isLoading ? 'Saving draft…' : 'Save draft'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StepReview;
