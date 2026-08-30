// src/components/pages/CreatorHub/ManagePasses/PassDetailView.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Film, Link2, Plus, RefreshCw } from 'lucide-react';
import { useAddVideoToPass, usePassDetails } from '../../../../hooks/usePass';
import type { PassVideo } from '../../../../types/pass';
import RichTextDisplay from '../../../common/RichTextDisplay';
import { cx, form, hairlineBar, list, page, skeleton, tierPill } from '../shared/hubStyles';
import AddVideoDrawer from './AddVideoDrawer';
import PassStatusPill from './PassStatusPill';
import {
  copyPassLink,
  copyToClipboard,
  draftHref,
  formatDate,
  formatDuration,
  formatMoney,
  isPublished,
  passCreatedAt,
  publicPassPath,
  publicPassUrl,
  shortAddress,
  soldCount,
} from './passHelpers';

const FALLBACK_THUMBNAIL = '/assets/Content-pass.webp';

/** One line of the Details panel: a label, a value, and nothing else. */
const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <dt className="shrink-0 text-xs text-gray-500">{label}</dt>
    <dd className="flex min-w-0 items-center justify-end gap-1.5 text-right text-sm text-gray-200">
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

const VideoRow: React.FC<{ video: PassVideo; index: number }> = ({ video, index }) => {
  const duration = formatDuration(video.duration);
  const title = video.title || `Video ${index + 1}`;
  return (
    <li className={cx(list.table.row, 'flex items-center gap-3 px-4 py-3 md:px-5')}>
      <img
        src={video.thumbnail_url || FALLBACK_THUMBNAIL}
        alt=""
        loading="lazy"
        className="aspect-video w-24 shrink-0 rounded-md border border-gray-800/60 bg-black object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-100" title={title}>
          {title}
        </p>
        <p className={cx(list.preview, 'mt-0.5')}>
          {video.platform}
          {duration && (
            <>
              <span aria-hidden="true"> · </span>
              <span className="tabular-nums">{duration}</span>
            </>
          )}
        </p>
      </div>
    </li>
  );
};

const DetailSkeleton: React.FC = () => (
  <div className={page.frame} aria-busy="true">
    <div className={page.wide}>
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: pass, isLoading, error, refetch } = usePassDetails(id);
  const addVideoMutation = useAddVideoToPass();

  const handleAddVideo = async (videos: { url: string; title?: string }[]) => {
    if (!id || videos.length === 0) return;

    try {
      // Process videos one by one
      for (const video of videos) {
        await addVideoMutation.mutateAsync({
          passId: id,
          data: {
            src_url: video.url,
            ...(video.title ? { title: video.title } : {}),
          },
        });
      }

      // Close drawer after all videos are added
      setIsDrawerOpen(false);
    } catch (caught) {
      console.error('Error adding videos:', caught);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !pass) {
    return (
      <div className={page.frame}>
        <div className={page.wide}>
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
          <div className={list.panel}>
            <div className={list.emptyState.wrapper} role="alert">
              <p className={list.emptyState.title}>Couldn&apos;t load this pass</p>
              <p className={list.emptyState.subtitle}>It may have been removed, or something went wrong on our side.</p>
              <div className="mt-4 flex items-center gap-2">
                <button type="button" onClick={() => void refetch()} className={form.secondaryButton}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/creator-hub/passes')}
                  className={form.ghostButton}
                >
                  Back to passes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const published = isPublished(pass);
  const sold = soldCount(pass);
  const cap = pass.supply_cap;
  const soldPct = cap ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
  const videos = pass.videos ?? [];
  const createdAt = passCreatedAt(pass);
  const publicUrl = publicPassUrl(pass);
  const publicPath = publicPassPath(pass);
  const description = (pass.description || '').trim();

  return (
    <div className={page.frame}>
      <div className={page.wide}>
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
          <PassStatusPill pass={pass} />

          <div className="ml-auto flex shrink-0 items-center gap-2">
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

        <div className={form.grid}>
          {/* Left column: the content */}
          <div className="space-y-5">
            <section className={cx(form.panel, 'pb-0')} aria-labelledby="pass-videos-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 id="pass-videos-heading" className={form.panelTitle}>
                  Videos
                  <span className="ml-1.5 font-normal tabular-nums text-gray-500">· {videos.length}</span>
                </h2>
                <button type="button" onClick={() => setIsDrawerOpen(true)} className={form.secondaryButton}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add video
                </button>
              </div>

              {videos.length > 0 ? (
                <ul className={cx(list.divider, '-mx-4 mt-3 border-t border-gray-800/60 md:-mx-5')}>
                  {videos.map((video, index) => (
                    <VideoRow key={video.id} video={video} index={index} />
                  ))}
                </ul>
              ) : (
                <div className={cx(list.emptyState.wrapper, 'py-12')}>
                  <Film className="h-8 w-8 text-gray-600" aria-hidden="true" />
                  <p className={cx('mt-4', list.emptyState.title)}>No videos yet</p>
                  <p className={list.emptyState.subtitle}>Add the videos this pass unlocks.</p>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className={cx(form.secondaryButton, 'mt-4')}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add video
                  </button>
                </div>
              )}
            </section>

            <section className={form.panel} aria-labelledby="pass-description-heading">
              <h2 id="pass-description-heading" className={form.panelTitle}>
                Description
              </h2>
              {description ? (
                <RichTextDisplay content={description} className="prose-sm mt-3 text-gray-300" />
              ) : (
                <p className="mt-3 text-sm text-gray-500">No description yet.</p>
              )}
            </section>
          </div>

          {/* Right column: the numbers and the facts */}
          <div className="space-y-5">
            <section className={form.panel} aria-labelledby="pass-performance-heading">
              <h2 id="pass-performance-heading" className={form.panelTitle}>
                Performance
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className={page.eyebrow}>Purchases</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-white">{sold.toLocaleString()}</dd>
                </div>
                <div className="min-w-0">
                  <dt className={page.eyebrow}>Revenue</dt>
                  <dd
                    className="mt-1 truncate text-xl font-semibold tabular-nums text-white"
                    title={formatMoney(sold * pass.price_cents, pass.currency)}
                  >
                    {formatMoney(sold * pass.price_cents, pass.currency)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className={page.eyebrow}>Supply</p>
                  <p className="text-xs tabular-nums text-gray-400">
                    {cap ? (
                      <>
                        <span className="text-gray-200">{sold.toLocaleString()}</span> / {cap.toLocaleString()}
                      </>
                    ) : (
                      <>
                        <span className="text-gray-200">{sold.toLocaleString()}</span> sold · unlimited
                      </>
                    )}
                  </p>
                </div>
                <div
                  className={cx(hairlineBar.track, 'mt-2')}
                  role={cap ? 'progressbar' : undefined}
                  aria-label={cap ? 'Supply sold' : undefined}
                  aria-valuemin={cap ? 0 : undefined}
                  aria-valuemax={cap ? cap : undefined}
                  aria-valuenow={cap ? Math.min(sold, cap) : undefined}
                >
                  {cap ? <div className={hairlineBar.fill} style={{ width: `${soldPct}%` }} /> : null}
                </div>
                {cap ? (
                  <p className="mt-2 text-xs tabular-nums text-gray-500">
                    {Math.max(0, cap - sold).toLocaleString()} remaining
                  </p>
                ) : null}
              </div>
            </section>

            <section className={form.panel} aria-labelledby="pass-details-heading">
              <h2 id="pass-details-heading" className={form.panelTitle}>
                Details
              </h2>
              <dl className={cx(list.divider, 'mt-2')}>
                <DetailRow label="Price">
                  <span className="tabular-nums">{pass.formatted_price}</span>
                </DetailRow>
                <DetailRow label="Tier">
                  <span className={tierPill}>{pass.tier}</span>
                </DetailRow>
                <DetailRow label="Supply">
                  <span className="tabular-nums">{cap ? cap.toLocaleString() : 'Unlimited'}</span>
                </DetailRow>
                {createdAt && (
                  <DetailRow label="Created">
                    <time dateTime={createdAt} className="tabular-nums">
                      {formatDate(createdAt)}
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
            </section>
          </div>
        </div>
      </div>

      <AddVideoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleAddVideo}
        isLoading={addVideoMutation.status === 'pending'}
        passTitle={pass.title}
      />
    </div>
  );
};

export default PassDetailView;
