// src/components/pages/CreatorHub/ManagePasses/PassDetailView.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Copy, ExternalLink, Link2, Lock, Pencil, RefreshCw } from 'lucide-react';
import { useAddVideoToPass, usePassDetails } from '../../../../hooks/usePass';
import RichTextDisplay from '../../../common/RichTextDisplay';
import { cx, form, frame, hairlineBar, list, page, skeleton, tierPill } from '../Business/businessStyles';
import PassPerformanceSection, { usePassPerformance } from '../Business/PassPerformanceSection';
import EditPassDetailsDialog from './EditPassDetailsDialog';
import PassVideosSection from './PassVideosSection';
import { SaleControlButton } from './SaleControls';
import PassStatusPill from './PassStatusPill';
import { formatMomentDate, saleState } from '../Business/businessFormat';
import { EmptyState, SalePill } from '../Business/BusinessUi';
import {
  copyPassLink,
  copyToClipboard,
  draftHref,
  isPublished,
  passCreatedAt,
  publicPassPath,
  publicPassUrl,
  shortAddress,
  passPriceText,
  soldCount,
} from './passHelpers';
import {
  FROZEN_AFTER_FIRST_SALE,
  NO_CAP_SET,
  maxPerBuyerOf,
  pctText,
  perPersonText,
  resaleCreatorSentence,
  resaleTermsOf,
  supplyCapOf,
} from '../../../../utils/passTerms';

/** One line of the Details panel: a label, a value, and nothing else. */
const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
    <dt className="shrink-0 text-sm text-gray-400">{label}</dt>
    <dd className="flex min-w-0 items-center justify-end gap-1.5 text-right text-sm text-gray-100">
      {children}
    </dd>
  </div>
);

const CopyIconButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={cx(list.actionButton, 'h-7 w-7')}
  >
    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
  </button>
);

const DetailSkeleton: React.FC = () => (
  <div className={page.frame} aria-busy="true">
    <div className={frame.business}>
      <div className={form.header}>
        <div className={cx(skeleton.block, 'h-8 w-8')} />
        <div className={cx(skeleton.line, 'w-56')} />
        <div className={cx(skeleton.block, 'h-5 w-12 rounded-full')} />
      </div>
      <div className={form.grid}>
        <div className="space-y-5">
          <div className={form.panel}>
            <div className={cx(skeleton.line, 'w-20')} />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={cx(skeleton.thumb, 'w-24 rounded-md')} />
                  <div className="flex-1 space-y-2">
                    <div className={cx(skeleton.line, 'w-1/2')} />
                    <div className={cx(skeleton.line, 'h-3 w-1/4')} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={form.panel}>
            <div className={cx(skeleton.line, 'w-24')} />
            <div className={cx(skeleton.line, 'mt-4 w-full')} />
            <div className={cx(skeleton.line, 'mt-2 w-4/5')} />
          </div>
        </div>
        <div className="space-y-5">
          <div className={form.panel}>
            <div className={cx(skeleton.line, 'w-24')} />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className={cx(skeleton.block, 'h-10')} />
              <div className={cx(skeleton.block, 'h-10')} />
            </div>
          </div>
          <div className={form.panel}>
            <div className={cx(skeleton.line, 'w-16')} />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={cx(skeleton.line, 'w-full')} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * One pass, in the edit page's frame: a sticky bar that says what it is and
 * what you can do with it, the videos and the description on the left, the
 * numbers and the facts on the right.
 */
const PassDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editingDetails, setEditingDetails] = useState(false);

  const { data: pass, isLoading, error, refetch } = usePassDetails(id);
  const addVideoMutation = useAddVideoToPass();
  // Real money, sales over time, funnel, sources and "opened by" per video.
  const performance = usePassPerformance(id);

  // One by one; the first refusal stops and is shown by the Videos section (its server sentence).
  const handleAddVideo = async (videos: { url: string; title?: string }[]) => {
    if (!id || videos.length === 0) return;
    for (const video of videos) {
      await addVideoMutation.mutateAsync({
        passId: id,
        data: {
          src_url: video.url,
          ...(video.title ? { title: video.title } : {}),
        },
      });
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !pass) {
    return (
      <div className={page.frame}>
        <div className={frame.business}>
          <div className={form.header}>
            <button
              type="button"
              onClick={() => navigate('/creator-hub/passes')}
              className={form.ghostButton}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Passes
            </button>
          </div>
          <EmptyState
            icon={AlertCircle}
            tone="error"
            role="alert"
            title="Couldn't load this pass"
            body="It may have been removed, or something went wrong on our side."
            action={
              <>
                <button type="button" onClick={() => void refetch()} className={form.secondaryButton}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
                <button type="button" onClick={() => navigate('/creator-hub/passes')} className={form.ghostButton}>
                  Back to passes
                </button>
              </>
            }
          />
        </div>
      </div>
    );
  }

  const published = isPublished(pass);
  const sold = soldCount(pass);
  const cap = supplyCapOf(pass);
  const perBuyer = maxPerBuyerOf(pass);
  const resale = resaleTermsOf(pass);
  // A draft from before caps were required must get one before it can be published.
  const noCapText = published ? 'No cap set' : NO_CAP_SET;
  const soldPct = cap ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
  const videos = pass.videos ?? [];
  const createdAt = passCreatedAt(pass);
  const publicUrl = publicPassUrl(pass);
  const publicPath = publicPassPath(pass);
  const description = (pass.description || '').trim();

  return (
    <div className={page.frame}>
      <div className={frame.business}>
        <div className={form.header}>
          <button
            type="button"
            onClick={() => navigate('/creator-hub/passes')}
            aria-label="Back to passes"
            className={cx(form.ghostButton, 'w-8 px-0')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-white" title={pass.title}>
            {pass.title}
          </h1>
          {performance.query.data ? (
            <SalePill state={saleState(performance.query.data.pass, { videoCount: videos.length })} />
          ) : (
            <PassStatusPill pass={pass} />
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {published && <SaleControlButton pass={performance.query.data?.pass} />}
            {published && (
              <button type="button" onClick={() => setEditingDetails(true)} className={form.secondaryButton}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Edit details</span>
              </button>
            )}
            <button type="button" onClick={() => void copyPassLink(pass)} className={form.secondaryButton}>
              <Link2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Copy link</span>
            </button>
            <a
              href={publicPath}
              target="_blank"
              rel="noopener noreferrer"
              className={form.secondaryButton}
              aria-label={published ? 'View public page' : 'Preview public page'}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{published ? 'View public page' : 'Preview'}</span>
            </a>
            {!published && (
              <button type="button" onClick={() => navigate(draftHref(pass))} className={form.primaryButton}>
                Finish publishing
              </button>
            )}
          </div>
        </div>

        {published && (
          <div className="mb-10">
            <PassPerformanceSection passId={pass.id} perf={performance} videoCount={videos.length} />
          </div>
        )}

        {published && <h2 className="mb-4 text-xl font-semibold text-white">Content and details</h2>}
        <div className={form.grid}>
          {/* Left column: the content */}
          <div className="space-y-6">
            <PassVideosSection
              passId={pass.id}
              passTitle={pass.title}
              fallbackVideos={videos}
              videoStats={performance.videoStats}
              onAddVideos={handleAddVideo}
              addPending={addVideoMutation.status === 'pending'}
            />

            <section className={form.panel} aria-labelledby="pass-description-heading">
              <h2 id="pass-description-heading" className={form.panelTitle}>
                Description
              </h2>
              {description ? (
                <RichTextDisplay content={description} className="prose-sm mt-3 text-gray-300" />
              ) : (
                <p className="mt-3 text-sm text-gray-400">No description yet.</p>
              )}
            </section>
          </div>

          {/* Right column: the numbers and the facts */}
          <div className="space-y-6">
            {/* Earnings, buyers and the funnel live in the Performance section above
                (real amounts per currency). This panel is only the supply. */}
            <section className={form.panel} aria-labelledby="pass-supply-heading">
              <h2 id="pass-supply-heading" className={form.panelTitle}>
                Supply
              </h2>
              <div className="mt-4">
                <p className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-3xl font-bold tracking-tight text-white">{sold.toLocaleString()}</span>
                  <span className="text-sm text-gray-400">{cap ? `of ${cap.toLocaleString()} sold` : 'sold'}</span>
                </p>
                <div
                  className={cx(hairlineBar.track, 'mt-3')}
                  role={cap ? 'progressbar' : undefined}
                  aria-label={cap ? 'Supply sold' : undefined}
                  aria-valuemin={cap ? 0 : undefined}
                  aria-valuemax={cap ? cap : undefined}
                  aria-valuenow={cap ? Math.min(sold, cap) : undefined}
                >
                  {cap ? <div className={hairlineBar.fill} style={{ width: `${soldPct}%` }} /> : null}
                </div>
                {cap ? (
                  <p className="mt-2 text-xs tabular-nums text-gray-400">
                    {Math.max(0, cap - sold).toLocaleString()} remaining
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {noCapText}
                  </p>
                )}
              </div>
            </section>

            <section className={form.panel} aria-labelledby="pass-details-heading">
              <h2 id="pass-details-heading" className={form.panelTitle}>
                Details
              </h2>
              <dl className={cx(list.divider, 'mt-2')}>
                <DetailRow label="Price">
                  <span className="tabular-nums">{passPriceText(pass, performance.query.data?.pass.price)}</span>
                </DetailRow>
                <DetailRow label="Tier">
                  <span className={tierPill}>{pass.tier}</span>
                </DetailRow>
                <DetailRow label="Number of passes">
                  {cap ? (
                    <span className="tabular-nums">{cap.toLocaleString()}</span>
                  ) : (
                    <span className="text-amber-300">{noCapText}</span>
                  )}
                </DetailRow>
                {perBuyer && (
                  <DetailRow label="Per person">
                    <span className="tabular-nums">{perPersonText(perBuyer)}</span>
                  </DetailRow>
                )}
                <DetailRow label="Resale royalty">
                  <span className="tabular-nums">{pctText(resale.creatorPct)} of every resale</span>
                </DetailRow>
                {createdAt && (
                  <DetailRow label="Created">
                    <time dateTime={createdAt} className="tabular-nums">
                      {formatMomentDate(createdAt)}
                    </time>
                  </DetailRow>
                )}
                <DetailRow label={published ? 'Public link' : 'Preview link'}>
                  <a
                    href={publicPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-mono text-xs text-gray-300 transition-colors hover:text-[#fa7517]"
                    title={publicUrl}
                  >
                    {publicUrl.replace(/^https?:\/\//, '')}
                  </a>
                  <CopyIconButton label="Copy link" onClick={() => void copyPassLink(pass)} />
                </DetailRow>
                {pass.lock_address && (
                  <DetailRow label="Lock address">
                    <span className="font-mono text-xs text-gray-300" title={pass.lock_address}>
                      {shortAddress(pass.lock_address)}
                    </span>
                    <CopyIconButton
                      label="Copy lock address"
                      onClick={() => void copyToClipboard(pass.lock_address as string, 'Lock address')}
                    />
                  </DetailRow>
                )}
              </dl>
              <div className="mt-4 space-y-2 border-t border-gray-800/50 pt-4 text-xs leading-relaxed text-gray-400">
                <p>{resaleCreatorSentence(resale)}</p>
                <p className="flex items-start gap-1.5">
                  <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />
                  {FROZEN_AFTER_FIRST_SALE}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <EditPassDetailsDialog
        open={editingDetails}
        onOpenChange={setEditingDetails}
        passId={pass.id}
        title={pass.title}
        description={pass.description || ''}
      />
    </div>
  );
};

export default PassDetailView;
