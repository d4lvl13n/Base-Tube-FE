import React, { useState } from 'react';
import { UseFormWatch } from 'react-hook-form';
import { X, ChevronRight, AlertTriangle, ExternalLink, Lock, Pencil } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cx, form, heroGlow, list, sheet } from '../../Business/businessStyles';
import { FormData, validVideoRows } from '../types';
import ContentPassSuccessAnimation from '../../../../animations/ContentPassSuccessAnimation';
import {
  FROZEN_AFTER_FIRST_SALE,
  passesText,
  pctText,
  perPersonText,
  resaleTermsOf,
  type ResaleTerms,
} from '../../../../../utils/passTerms';
import { WizardCard } from '../wizardUi';

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
  /** Jump back to a step to change a term (1 = Basics, 3 = Content). */
  onEditStep?: (step: number) => void;
  /** The resale split to state; the decided rates when the server sent none. */
  resaleTerms?: ResaleTerms;
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

interface PromiseTerm {
  key: string;
  label: string;
  value: React.ReactNode;
  detail: string;
  /** The value is missing and blocks saving. */
  missing?: boolean;
  editStep?: number;
}

/** One term of the promise: what it is, the number large, one sentence on what it means. */
const PromiseRow: React.FC<{ term: PromiseTerm; onEditStep?: (step: number) => void }> = ({ term, onEditStep }) => (
  <div className="min-w-0 py-4 first:pt-0 sm:py-0">
    <dt className="flex items-center justify-between gap-3 text-sm text-gray-400">
      <span>{term.label}</span>
      {term.editStep && onEditStep && (
        <button
          type="button"
          onClick={() => onEditStep(term.editStep!)}
          className={cx(form.inlineAction, 'shrink-0')}
          aria-label={`Change ${term.label.toLowerCase()}`}
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Change
        </button>
      )}
    </dt>
    <dd className={cx('mt-1 text-xl font-semibold tracking-tight tabular-nums', term.missing ? 'text-red-300' : 'text-white')}>
      {term.value}
    </dd>
    <dd className="mt-1 text-xs leading-relaxed text-gray-400">{term.detail}</dd>
  </div>
);

const StepReview: React.FC<StepReviewProps> = ({
  watch,
  onConfirm,
  isLoading,
  isSuccess,
  onContinue,
  submitError,
  submitErrorAction,
  onStartOAuth,
  onBackToVideos,
  onEditStep,
  resaleTerms = resaleTermsOf(null),
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const watchedFields = watch();
  const validUrls = validVideoRows(watchedFields.src_urls);

  // Format the price for display
  const formattedPrice = formatCurrency(watchedFields.price_cents, watchedFields.currency || 'USD');
  const cap = watchedFields.supply_cap && watchedFields.supply_cap > 0 ? watchedFields.supply_cap : null;
  const perBuyer = watchedFields.max_per_buyer && watchedFields.max_per_buyer > 0 ? watchedFields.max_per_buyer : null;
  const videoCountText = `${validUrls.length} video${validUrls.length !== 1 ? 's' : ''}`;
  const termsComplete = Boolean(cap && perBuyer && validUrls.length > 0);

  // Handle the confirm button click
  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (onConfirm) onConfirm();
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

  const terms: PromiseTerm[] = [
    {
      key: 'supply',
      label: 'Number of passes',
      value: cap ? passesText(cap) : 'Not set',
      detail: cap ? 'No more are ever created. When they are gone, fans buy from holders.' : 'Set it on the Basics step.',
      missing: !cap,
      editStep: 1,
    },
    {
      key: 'price',
      label: 'Price',
      value: (
        <>
          {formattedPrice}
          <span className="ml-1.5 text-sm font-normal text-gray-400">per pass</span>
        </>
      ),
      detail: 'Paid once. There is no subscription.',
      editStep: 1,
    },
    {
      key: 'per-buyer',
      label: 'Per person',
      value: perBuyer ? perPersonText(perBuyer) : 'Not set',
      detail: perBuyer ? 'The most one fan can buy from you at the first sale.' : 'Set it on the Basics step.',
      missing: !perBuyer,
      editStep: 1,
    },
    {
      key: 'videos',
      label: 'Videos',
      value: validUrls.length > 0 ? videoCountText : 'None yet',
      detail: 'A video that works stays in the pass for everyone who holds it.',
      missing: validUrls.length === 0,
      editStep: 3,
    },
    {
      key: 'resale',
      label: 'Resale',
      value: 'Resellable on BaseTube',
      detail: `Each resale pays you ${pctText(resaleTerms.creatorPct)}. BaseTube takes ${pctText(
        resaleTerms.platformPct,
      )}; the seller keeps ${pctText(resaleTerms.sellerPct)}.`,
    },
  ];

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

      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Review your pass</h2>
          <p className="mt-1 text-sm text-gray-400">
            This saves a draft. Nothing is for sale until you publish on the next step.
          </p>
        </div>

        {/* ── The promise: the one card that glows on this screen ─────────── */}
        <WizardCard
          id="promise"
          title="What you promise buyers"
          description="These terms appear on your sales page. Buyers rely on them."
          style={heroGlow}
        >
          <dl className="grid grid-cols-1 divide-y divide-gray-800/50 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 sm:divide-y-0 lg:grid-cols-3">
            {terms.map((term) => (
              <PromiseRow key={term.key} term={term} onEditStep={onEditStep} />
            ))}
          </dl>
          <p className="mt-6 flex items-start gap-2.5 rounded-lg border border-[#fa7517]/25 bg-[#fa7517]/[0.06] p-3 text-sm leading-relaxed text-gray-100">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#fa7517]" aria-hidden="true" />
            {FROZEN_AFTER_FIRST_SALE}
          </p>
        </WizardCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {/* ── Videos ───────────────────────────────────────────────────── */}
          <section className={list.panel} aria-labelledby="review-videos-title">
            <div className="flex items-start justify-between gap-3 border-b border-gray-800/50 px-5 py-4 md:px-6">
              <div className="min-w-0">
                <h3 id="review-videos-title" className="text-base font-semibold text-white">Videos in this pass</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  Ownership and the unlisted setting are checked again when you save.
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-gray-400">{videoCountText}</span>
            </div>
            {validUrls.length > 0 ? (
              <ul className={list.divider}>
                {validUrls.map((urlObj, idx) => {
                  const thumb = getThumbnailUrl(urlObj.value, urlObj.thumbnail_url);
                  const label = urlObj.title || `Video ${idx + 1}`;
                  return (
                    <li key={`preview-${idx}`} className={cx(list.table.row, 'flex items-center gap-3 px-5 py-3 md:px-6')}>
                      <span className="w-5 shrink-0 text-xs tabular-nums text-gray-500" aria-hidden="true">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md border border-gray-800/50 bg-black">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-500">No preview</div>
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
                {onEditStep && (
                  <button type="button" onClick={() => onEditStep(3)} className={cx(form.secondaryButton, 'mt-4')}>
                    Add videos
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ── Title and description ─────────────────────────────────────── */}
          <WizardCard id="review-details" title="Title and description">
            <p className="text-base font-medium text-gray-100">{watchedFields.title || 'Untitled Pass'}</p>
            {watchedFields.description ? (
              <div className={cx(richText, 'mt-3 border-t border-gray-800/50 pt-3')} dangerouslySetInnerHTML={{ __html: watchedFields.description }} />
            ) : (
              <p className="mt-3 text-sm text-gray-400">No description.</p>
            )}
            <p className="mt-4 text-xs text-gray-400">You can fix typos in the title and description after publishing.</p>
          </WizardCard>
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
        <WizardCard id="review-commit" bodyClassName="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">What happens next</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-400 marker:text-gray-500">
              <li>We save a draft and attach the videos you selected.</li>
              <li>We check that every video belongs to your linked channel and is unlisted.</li>
              <li>Next you choose how you get paid and publish. Fans cannot buy a draft.</li>
            </ol>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isLoading || !termsComplete}
            className={cx(form.primaryButton, 'h-10 shrink-0 px-4')}
          >
            {isLoading ? 'Saving draft…' : 'Save draft'}
            {!isLoading && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </WizardCard>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
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
              className="w-full max-w-md space-y-4 rounded-2xl border border-gray-800/70 bg-black p-6 text-white shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="confirm-draft-title" className={sheet.title}>Save this as a draft?</h3>
                  <p className="mt-1 text-sm text-gray-400">This will not go on sale yet.</p>
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

              <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 border-t border-gray-800/50 pt-4">
                <dt className="text-sm text-gray-400">Passes</dt>
                <dd className="text-sm tabular-nums text-gray-100">{cap ? `Limited to ${passesText(cap)}` : 'Not set'}</dd>
                <dt className="text-sm text-gray-400">Per person</dt>
                <dd className="text-sm tabular-nums text-gray-100">{perBuyer ? perPersonText(perBuyer) : 'Not set'}</dd>
                <dt className="text-sm text-gray-400">Content</dt>
                <dd className="text-sm tabular-nums text-gray-100">
                  {validUrls.length} premium video{validUrls.length !== 1 ? 's' : ''}
                </dd>
              </dl>

              <div className="flex items-center justify-end gap-2 border-t border-gray-800/50 pt-4">
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
