import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Film, Loader2 } from 'lucide-react';
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { displayTitle, type TechnicalState } from './draftStatus';
import { workspaceCopy } from './workspaceCopy';

export interface MediaAction {
  label: string;
  /** The one thing the creator has to do: the screen's primary button. */
  primary: boolean;
  onClick: () => void;
}

interface MediaCardProps {
  draft: WorkspaceDraft;
  technical: TechnicalState;
  /** Viewer mode: the title and thumbnail as a card, no numbers. */
  presentation: boolean;
  thumbnailUrl: string | null;
  /** Owner-only playback URL from `GET /preview` (five-minute expiry). */
  serverPlaybackUrl: string | null;
  channelName: string | null;
  channelImageUrl: string | null;
  action: MediaAction | null;
  secondaryAction: MediaAction | null;
  /** A one-off sentence from the last action (wrong file chosen, retry refused). */
  message: string | null;
}

const PRIMARY =
  'inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#fa7517] px-4 text-sm font-medium text-black ' +
  'transition-colors hover:bg-[#ff8c3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/60';
const QUIET =
  'inline-flex min-h-[44px] items-center rounded-md px-3 text-sm text-gray-300 transition-colors ' +
  'hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500';

function ToneIcon({ tone, className }: { tone: TechnicalState['tone']; className: string }) {
  if (tone === 'ready') return <Check className={`${className} text-green-400`} aria-hidden="true" />;
  if (tone === 'attention') return <AlertCircle className={`${className} text-yellow-400`} aria-hidden="true" />;
  return <Loader2 className={`${className} animate-spin text-gray-400 motion-reduce:animate-none`} aria-hidden="true" />;
}

/**
 * The video, and its whole technical story, in one 16:9 card (UP-UX §5.2, §9).
 *
 * The card is the only place a video's file state is told. With nothing to
 * play, the state and its single action sit in the middle of the frame; with
 * something to play, they move to one line under it so the video stays
 * watchable. A percentage exists only while bytes move.
 */
const MediaCard: React.FC<MediaCardProps> = ({
  draft,
  technical,
  presentation,
  thumbnailUrl,
  serverPlaybackUrl,
  channelName,
  channelImageUrl,
  action,
  secondaryAction,
  message,
}) => {
  const file = draft.entry?.file ?? null;
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setLocalUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const playbackReady = draft.record.server?.playbackReady ?? false;
  const mediaUrl = localUrl ?? (playbackReady ? serverPlaybackUrl : null);
  const title = displayTitle(draft);
  const toneText =
    technical.tone === 'attention'
      ? 'text-yellow-100'
      : technical.tone === 'ready'
        ? 'text-green-200'
        : 'text-gray-100';

  if (presentation) {
    return (
      <figure className="min-w-0" aria-label={`${title}, as viewers see it`}>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-gray-800">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <span className="text-xs text-gray-500">{workspaceCopy.automaticThumbnailPlaceholder}</span>
            </div>
          )}
        </div>
        <figcaption className="mt-3 flex gap-3">
          {channelImageUrl ? (
            <img src={channelImageUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="h-9 w-9 shrink-0 rounded-full bg-gray-800" aria-hidden="true" />
          )}
          <span className="min-w-0">
            <span className="line-clamp-2 block text-sm font-medium text-white">{title}</span>
            {channelName && <span className="mt-0.5 block truncate text-xs text-gray-500">{channelName}</span>}
          </span>
        </figcaption>
      </figure>
    );
  }

  const actions = (action || secondaryAction) && (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {action && (
        <button type="button" onClick={action.onClick} className={action.primary ? PRIMARY : QUIET}>
          {action.label}
        </button>
      )}
      {secondaryAction && (
        <button type="button" onClick={secondaryAction.onClick} className={QUIET}>
          {secondaryAction.label}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-w-0">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-gray-800">
        {mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            muted
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
            aria-label={`Preview of ${title}`}
          />
        ) : (
          <>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0f0f0f] to-black" aria-hidden="true">
                <Film className="absolute right-4 top-4 h-5 w-5 text-gray-800" />
              </div>
            )}
            {/* Nothing to play: the state is the content of the frame. */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center" aria-live="polite">
              <ToneIcon tone={technical.tone} className="h-6 w-6" />
              <p className={`max-w-md text-base font-medium ${toneText}`}>{technical.label}</p>
              {technical.detail && <p className="max-w-md text-sm text-gray-400">{technical.detail}</p>}
              {actions}
            </div>
          </>
        )}

        {technical.percent !== null && (
          <div
            className="absolute inset-x-0 bottom-0 h-1 bg-white/10"
            role="progressbar"
            aria-label={`Sending ${title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={technical.percent}
          >
            <div className="h-full bg-[#fa7517] transition-[width] duration-300 ease-out" style={{ width: `${technical.percent}%` }} />
          </div>
        )}
      </div>

      {/* Something plays: the state moves under the frame, on one line. */}
      {mediaUrl && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1" aria-live="polite">
          <ToneIcon tone={technical.tone} className="h-4 w-4 shrink-0" />
          <p className={`min-w-0 flex-1 text-sm ${toneText}`}>
            {technical.label}
            {localUrl && <span className="text-gray-500"> — {workspaceCopy.previewLocalShort}</span>}
          </p>
          {actions}
        </div>
      )}

      {message && (
        <p className="mt-2 text-sm text-yellow-300" role="alert">
          {message}
        </p>
      )}
    </div>
  );
};

export default MediaCard;
