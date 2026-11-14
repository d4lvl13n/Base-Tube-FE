// src/components/pages/CreatorHub/ManagePasses/PassVideosSection.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { AlertTriangle, CheckCircle2, Film, Loader2, Plus, RefreshCw, Replace, Trash2 } from 'lucide-react';
import { businessErrorBody } from '../../../../api/creatorBusiness';
import {
  useCheckPassVideo,
  useCreatorPassVideos,
  useRemovePassVideo,
  useReplacePassVideo,
} from '../../../../hooks/useCreatorBusiness';
import type { CreatorPassVideo, PassVideoStat } from '../../../../types/creatorBusiness';
import type { PassVideo } from '../../../../types/pass';
import { plainApiError } from '../../../../utils/plainApiError';
import { button, cx, empty, form, list } from '../Business/businessStyles';
import { formatMomentDate } from '../Business/businessFormat';
import { openedByText } from '../Business/PassPerformanceSection';
import { holdersText, removeAcknowledgement, removeConfirmLines } from '../Business/passActions';
import AddVideoDrawer from './AddVideoDrawer';
import ConfirmDialog from './ConfirmDialog';
import { formatDuration } from './passHelpers';

const FALLBACK_THUMBNAIL = '/assets/Content-pass.webp';

interface Props {
  passId: string;
  passTitle: string;
  /** The videos of GET /passes/:id, shown while the creator list loads (or if it fails). */
  fallbackVideos: PassVideo[];
  videoStats: Map<string, PassVideoStat>;
  onAddVideos: (videos: { url: string; title?: string }[]) => Promise<void>;
  addPending: boolean;
}

const smallButton = button.small;

const VideoState: React.FC<{ video: CreatorPassVideo }> = ({ video }) =>
  video.problem ? (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-snug text-amber-300">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{video.problemReason}</span>
    </p>
  ) : (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400/80" aria-hidden="true" />
      {video.lastCheckedAt ? `Can be sold · checked on YouTube ${formatMomentDate(video.lastCheckedAt)}` : 'Can be sold'}
    </p>
  );

/**
 * The Videos of a pass, for its creator: per video whether it can be sold and
 * why not, "Check again" on YouTube, "Replace this video" (the main fix for a
 * broken one) and "Remove". A pass is a fixed promise to its buyers: once
 * someone bought it, a video that still works can neither be removed nor
 * replaced (the server refuses it too); adding videos is always possible.
 */
const PassVideosSection: React.FC<Props> = ({ passId, passTitle, fallbackVideos, videoStats, onAddVideos, addPending }) => {
  const videosQuery = useCreatorPassVideos(passId);
  const check = useCheckPassVideo();
  const remove = useRemovePassVideo();
  const replace = useReplacePassVideo();
  const [drawer, setDrawer] = useState<null | { mode: 'add' } | { mode: 'replace'; video: CreatorPassVideo }>(null);
  const [removing, setRemoving] = useState<CreatorPassVideo | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const data = videosQuery.data;
  const buyers = data?.buyersWithAccess ?? 0;
  const count = data ? data.videos.length : fallbackVideos.length;

  const runCheck = (video: CreatorPassVideo) => {
    setCheckingId(video.videoId);
    check.mutate(
      { passId, videoId: video.videoId },
      {
        onSuccess: (answer) => {
          if (answer.outcome === 'ok') toast.success(answer.message);
          else if (answer.outcome === 'problem') toast.warn(answer.message, { autoClose: 10_000 });
          else toast.info(answer.message, { autoClose: 10_000 });
        },
        onError: (error) => toast.error(plainApiError(error, 'YouTube could not be asked just now. Please try again.').message),
        onSettled: () => setCheckingId(null),
      },
    );
  };

  const openRemove = (video: CreatorPassVideo) => {
    setRemoveError(null);
    setAcknowledged(false);
    setRemoving(video);
  };

  const confirmRemove = () => {
    if (!removing) return;
    remove.mutate(
      { passId, videoId: removing.videoId, confirmBuyersWithAccess: buyers > 0 ? buyers : undefined },
      {
        onSuccess: (answer) => {
          setRemoving(null);
          toast.success(answer.message);
        },
        onError: (error) => {
          const body = businessErrorBody(error);
          if (body?.code === 'REMOVAL_CONFIRMATION_STALE' || body?.code === 'REMOVAL_NOT_CONFIRMED') {
            // The number of buyers changed: show the new one and ask again.
            setAcknowledged(false);
            void videosQuery.refetch();
          }
          setRemoveError(plainApiError(error, 'The video could not be removed. Please try again.').message);
        },
      },
    );
  };

  const submitDrawer = async (videos: { url: string; title?: string }[]) => {
    if (!drawer || !videos.length) return;
    if (drawer.mode === 'add') {
      try {
        await onAddVideos(videos);
        setDrawer(null);
      } catch (error) {
        toast.error(plainApiError(error, 'The video could not be added. Please try again.').message);
      }
      return;
    }
    const [next] = videos;
    replace.mutate(
      { passId, videoId: drawer.video.videoId, srcUrl: next.url, title: next.title },
      {
        onSuccess: (answer) => {
          setDrawer(null);
          toast.success(answer.message);
        },
        onError: (error) => toast.error(plainApiError(error, 'The video could not be replaced. Please try again.').message),
      },
    );
  };

  return (
    <section id="pass-videos" className={cx(form.panel, 'scroll-mt-20 pb-0')} aria-labelledby="pass-videos-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="pass-videos-heading" className={form.panelTitle}>
          Videos
          <span className="ml-2 font-normal tabular-nums text-gray-400">{count}</span>
        </h2>
        <button type="button" onClick={() => setDrawer({ mode: 'add' })} className={form.secondaryButton}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add video
        </button>
      </div>
      {buyers > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          {holdersText(buyers)} this pass. You can always add videos. A video
          that still works stays for them; one that no longer works can be replaced or removed.
        </p>
      )}

      {data && data.videos.length > 0 ? (
        <ul className={cx(list.divider, '-mx-5 mt-4 border-t border-gray-800/50 md:-mx-6')}>
          {data.videos.map((video, index) => {
            const title = video.title || `Video ${index + 1}`;
            const duration = formatDuration(video.durationSeconds ?? undefined);
            const stat = videoStats.get(video.videoId);
            const checking = checkingId === video.videoId;
            return (
              <li key={video.videoId} className={cx(list.table.row, 'flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center md:px-6')}>
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <img
                    src={video.thumbnailUrl || FALLBACK_THUMBNAIL}
                    alt=""
                    loading="lazy"
                    className={cx(
                      'aspect-video w-24 shrink-0 rounded-lg border bg-black object-cover',
                      video.problem ? 'border-amber-500/40 opacity-70' : 'border-gray-800/60',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100" title={title}>
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
                      {stat && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span title="Holders right now who asked to play this video. Your own plays are not counted.">{openedByText(stat)}</span>
                        </>
                      )}
                    </p>
                    <VideoState video={video} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end">
                  {video.problem && video.canReplace && (
                    <button
                      type="button"
                      onClick={() => setDrawer({ mode: 'replace', video })}
                      className={cx(smallButton, 'bg-[#fa7517]/15 text-[#fa7517] hover:bg-[#fa7517]/25')}
                    >
                      <Replace className="h-3.5 w-3.5" aria-hidden="true" />
                      Replace this video
                    </button>
                  )}
                  {video.canCheck && (
                    <button
                      type="button"
                      onClick={() => runCheck(video)}
                      disabled={checking || check.isPending}
                      className={cx(smallButton, 'text-gray-300 hover:bg-white/[0.05] hover:text-white')}
                      title="Ask YouTube now whether this video can be sold"
                    >
                      {checking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {checking ? 'Checking…' : 'Check again'}
                    </button>
                  )}
                  {!video.problem && video.canReplace && (
                    <button
                      type="button"
                      onClick={() => setDrawer({ mode: 'replace', video })}
                      className={cx(smallButton, 'text-gray-300 hover:bg-white/[0.05] hover:text-white')}
                    >
                      <Replace className="h-3.5 w-3.5" aria-hidden="true" />
                      Replace
                    </button>
                  )}
                  {video.canRemove && (
                    <button
                      type="button"
                      onClick={() => openRemove(video)}
                      className={cx(smallButton, 'text-gray-400 hover:bg-red-500/10 hover:text-red-300')}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  )}
                  {!video.canRemove && video.problem && video.removeBlockedReason && (
                    <span className="max-w-[16rem] text-[11px] leading-snug text-gray-400">{video.removeBlockedReason}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : count > 0 ? (
        <ul className={cx(list.divider, '-mx-5 mt-4 border-t border-gray-800/50 md:-mx-6')} aria-busy={videosQuery.isLoading}>
          {fallbackVideos.map((video, index) => (
            <li key={video.id} className={cx(list.table.row, 'flex items-center gap-3.5 px-5 py-4 md:px-6')}>
              <img
                src={video.thumbnail_url || FALLBACK_THUMBNAIL}
                alt=""
                loading="lazy"
                className="aspect-video w-24 shrink-0 rounded-lg border border-gray-800/60 bg-black object-cover"
              />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-100">{video.title || `Video ${index + 1}`}</p>
            </li>
          ))}
          {videosQuery.isError && (
            <li className="px-5 py-4 text-xs text-gray-400 md:px-6">
              Whether each video can be sold could not be loaded.{' '}
              <button type="button" className="text-[#fa7517] hover:text-[#ff8c3a]" onClick={() => void videosQuery.refetch()}>
                Try again
              </button>
            </li>
          )}
        </ul>
      ) : (
        <div className={cx(empty.wrapper, 'pb-10')}>
          <span className={empty.icon}>
            <Film className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className={empty.title}>No videos yet</p>
          <p className={empty.body}>Add the videos this pass unlocks.</p>
          <button type="button" onClick={() => setDrawer({ mode: 'add' })} className={cx(button.primary, 'mt-5')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add video
          </button>
        </div>
      )}

      <AddVideoDrawer
        isOpen={drawer !== null}
        onClose={() => setDrawer(null)}
        onSubmit={(videos) => void submitDrawer(drawer?.mode === 'replace' ? videos.slice(0, 1) : videos)}
        isLoading={drawer?.mode === 'replace' ? replace.isPending : addPending}
        passTitle={passTitle}
        replacing={drawer?.mode === 'replace' ? { title: drawer.video.title || 'this video' } : null}
      />

      {removing && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setRemoving(null)}
          title={`Remove “${removing.title || 'this video'}” from the pass?`}
          lines={removeConfirmLines(buyers)}
          confirmLabel={buyers > 0 ? `Remove for ${buyers === 1 ? '1 buyer' : `${buyers.toLocaleString()} buyers`}` : 'Remove video'}
          cancelLabel="Keep it"
          onConfirm={confirmRemove}
          pending={remove.isPending}
          danger
          confirmDisabled={buyers > 0 && !acknowledged}
        >
          {buyers > 0 && (
            <label className="flex items-start gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                className="mt-1 accent-[#fa7517]"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>{removeAcknowledgement(buyers)}</span>
            </label>
          )}
          {removing.canReplace && removing.problem && (
            <button
              type="button"
              className={cx(form.inlineAction, 'mt-3')}
              onClick={() => {
                const video = removing;
                setRemoving(null);
                setDrawer({ mode: 'replace', video });
              }}
            >
              <Replace className="h-3.5 w-3.5" aria-hidden="true" />
              Replace it with a working video instead
            </button>
          )}
          {removeError && (
            <p className={cx(form.errorText, 'mt-3')} role="alert">
              {removeError}
            </p>
          )}
        </ConfirmDialog>
      )}
    </section>
  );
};

export default PassVideosSection;
