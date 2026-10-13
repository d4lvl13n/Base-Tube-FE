import React, { useEffect, useState } from 'react';
import { Film, ImageIcon } from 'lucide-react';
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { displayTitle } from './draftStatus';
import { workspaceCopy } from './workspaceCopy';

export type PreviewMode = 'video' | 'presentation';

interface DraftPreviewProps {
  draft: WorkspaceDraft;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  thumbnailUrl: string | null;
  /** Owner-only playback URL from `GET /preview` (expires after five minutes). */
  serverPlaybackUrl: string | null;
  channelName: string | null;
  channelImageUrl: string | null;
  /** The technical state line and its action, rendered under the media. */
  status: React.ReactNode;
}

/**
 * The media, or the title + thumbnail pair as a viewer would meet it.
 *
 * "Video" plays the file from this device when the browser still holds it —
 * that is a local preview and is labelled as such; `playbackReady` alone
 * decides whether the server can play it. "Presentation" shows the card
 * without views, revenue or dates: none of those exist before publishing.
 */
const DraftPreview: React.FC<DraftPreviewProps> = ({
  draft,
  mode,
  onModeChange,
  thumbnailUrl,
  serverPlaybackUrl,
  channelName,
  channelImageUrl,
  status,
}) => {
  const file = draft.entry?.file ?? null;
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setLocalUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const playbackReady = draft.record.server?.playbackReady ?? false;
  const mediaUrl = localUrl ?? (playbackReady ? serverPlaybackUrl : null);
  const title = displayTitle(draft);

  return (
    <section aria-label={workspaceCopy.preview} className="min-w-0">
      <div role="group" aria-label={workspaceCopy.preview} className="mb-2 inline-flex rounded-md border border-gray-800 p-0.5">
        {(
          [
            ['video', workspaceCopy.video],
            ['presentation', workspaceCopy.presentation],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => onModeChange(id)}
            className={`min-h-[36px] rounded px-3 text-xs transition-colors focus-visible:outline-none
                        focus-visible:ring-1 focus-visible:ring-[#fa7517]/60 ${
                          mode === id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'video' ? (
        mediaUrl ? (
          <div className="overflow-hidden rounded-lg border border-gray-800/60 bg-black">
            <div className="relative aspect-video w-full">
              <video
                src={mediaUrl}
                controls
                muted
                playsInline
                preload="metadata"
                className="h-full w-full bg-black object-contain"
                aria-label={`Preview of ${title}`}
              />
            </div>
            {localUrl && <p className="border-t border-gray-800/60 px-3 py-2 text-[11px] text-gray-600">{workspaceCopy.previewLocal}</p>}
          </div>
        ) : (
          // Nothing to play yet: a short line, not a large empty frame.
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-800 px-4 py-3">
            <Film className="h-5 w-5 shrink-0 text-gray-700" aria-hidden="true" />
            <p className="text-xs text-gray-500">
              {playbackReady ? workspaceCopy.previewServerPending : workspaceCopy.previewNoMedia}
            </p>
          </div>
        )
      ) : (
        <div className="rounded-lg border border-gray-800/60 bg-[#0f0f0f] p-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <ImageIcon className="h-7 w-7 text-gray-700" aria-hidden="true" />
                <span className="text-xs text-gray-500">{workspaceCopy.automaticThumbnailPlaceholder}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-3">
            {channelImageUrl ? (
              <img src={channelImageUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="h-9 w-9 shrink-0 rounded-full bg-gray-800" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium text-white">{title}</p>
              {channelName && <p className="mt-0.5 truncate text-xs text-gray-500">{channelName}</p>}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-gray-600">{workspaceCopy.presentationNote}</p>
        </div>
      )}

      <div className="mt-3">{status}</div>
    </section>
  );
};

export default DraftPreview;
