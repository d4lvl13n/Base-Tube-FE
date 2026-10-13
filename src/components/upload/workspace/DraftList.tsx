import React from 'react';
import { AlertCircle, Check, Film, Loader2 } from 'lucide-react';
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import {
  displayTitle,
  editorialLabel,
  isPublished,
  technicalState,
  type StatusContext,
  type TechnicalTone,
} from './draftStatus';
import { workspaceCopy } from './workspaceCopy';
import { formatBytes } from '../uploadPhase';

/** Colour backs a word and an icon, never replaces them (UP-UX §13). */
const TONE_TEXT: Record<TechnicalTone, string> = {
  waiting: 'text-gray-400',
  active: 'text-[#fa7517]',
  ready: 'text-green-500',
  attention: 'text-yellow-400',
};

function ToneIcon({ tone }: { tone: TechnicalTone }) {
  if (tone === 'ready') return <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  if (tone === 'attention') return <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />;
}

interface DraftListProps {
  items: WorkspaceDraft[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  statusContext: (draft: WorkspaceDraft) => StatusContext;
  thumbnailUrl: (key: string) => string | null;
  channelName: (channelId: number) => string | null;
  showChannel: boolean;
  isReady: (key: string) => boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  /** Row buttons, so focus can return to the right row after "Back" or a removal. */
  rowRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

/**
 * The videos in the workspace. One click (or Enter) selects a video; the row
 * has no other button, so selecting can never trigger a destructive action.
 */
const DraftList: React.FC<DraftListProps> = ({
  items,
  selectedKey,
  onSelect,
  statusContext,
  thumbnailUrl,
  channelName,
  showChannel,
  isReady,
  hasMore,
  onLoadMore,
  rowRefs,
}) => (
  <nav aria-label={workspaceCopy.videosList} className="min-w-0">
    <ul className="divide-y divide-gray-800/60 overflow-hidden rounded-lg border border-gray-800/60 bg-[#0f0f0f]">
      {items.map((draft) => {
        const technical = technicalState(draft, statusContext(draft));
        const selected = draft.key === selectedKey;
        const thumbnail = thumbnailUrl(draft.key);
        const published = isPublished(draft);
        const ready = !published && isReady(draft.key);
        const channel = showChannel ? channelName(draft.record.channelId) : null;
        // Two videos often share a camera prefix: the file name and size tell them apart.
        const filename = draft.entry?.filename ?? draft.record.filename;
        const fileLine = filename
          ? `${filename}${draft.entry ? ` · ${formatBytes(draft.entry.sizeBytes)}` : ''}`
          : null;
        return (
          <li key={draft.key} className="relative">
            <button
              type="button"
              ref={(node) => {
                if (node) rowRefs.current.set(draft.key, node);
                else rowRefs.current.delete(draft.key);
              }}
              onClick={() => onSelect(draft.key)}
              aria-current={selected ? 'true' : undefined}
              className={`flex min-h-[64px] w-full items-center gap-3 px-3 py-2.5 text-left transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fa7517]/60 ${
                            selected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          }`}
            >
              <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded border border-gray-800 bg-black">
                {thumbnail ? (
                  <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Film className="h-4 w-4 text-gray-700" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-gray-100">{displayTitle(draft)}</span>
                {fileLine && (
                  <span className="mt-0.5 block truncate text-[11px] text-gray-600" title={fileLine}>
                    {fileLine}
                  </span>
                )}
                <span className={`mt-1 flex items-start gap-1 text-xs ${TONE_TEXT[technical.tone]}`}>
                  <span className="mt-px"><ToneIcon tone={technical.tone} /></span>
                  <span className="line-clamp-2">{technical.label}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-gray-500">
                  {editorialLabel(draft)}
                  {ready ? ` · ${workspaceCopy.readyToPublish}` : ''}
                  {channel ? ` · ${channel}` : ''}
                </span>
              </span>
              {selected && <span className="sr-only">(selected)</span>}
            </button>
            {technical.percent !== null && (
              <span
                className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5"
                role="progressbar"
                aria-label={`Sending ${displayTitle(draft)}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={technical.percent}
              >
                <span
                  className="block h-full bg-[#fa7517] transition-[width] duration-300 ease-out"
                  style={{ width: `${technical.percent}%` }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ul>
    {hasMore && (
      <button
        type="button"
        onClick={onLoadMore}
        className="mt-2 min-h-[44px] w-full rounded-md text-xs text-gray-400 transition-colors hover:text-white
                   focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600"
      >
        {workspaceCopy.loadMore}
      </button>
    )}
  </nav>
);

export default DraftList;
