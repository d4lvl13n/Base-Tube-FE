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

/** Colour backs a word and an icon, never replaces them (UP-UX §13). */
const TONE_TEXT: Record<TechnicalTone, string> = {
  waiting: 'text-gray-400',
  active: 'text-[#fa7517]',
  ready: 'text-green-500',
  attention: 'text-yellow-400',
};

/** Shortens from the middle, so the distinguishing end of a camera filename stays visible. */
function middleEllipsis(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = Math.ceil((max - 1) * 0.4);
  const tail = max - 1 - head;
  return `${text.slice(0, head)}…${text.slice(text.length - tail)}`;
}

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
    <ul className="space-y-1">
      {items.map((draft) => {
        const technical = technicalState(draft, statusContext(draft));
        const selected = draft.key === selectedKey;
        const thumbnail = thumbnailUrl(draft.key);
        const published = isPublished(draft);
        const ready = !published && isReady(draft.key);
        const channel = showChannel ? channelName(draft.record.channelId) : null;
        const title = displayTitle(draft);
        // One status line: the editorial state only when it is the news
        // (published, ready); otherwise the file's state.
        const statusText = published ? editorialLabel(draft) : ready ? workspaceCopy.readyToPublish : technical.label;
        const statusTone = published || ready ? 'ready' : technical.tone;
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
              title={title}
              className={`relative flex min-h-[56px] w-full items-center gap-3 overflow-hidden rounded-lg px-2 py-2 text-left transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fa7517]/60 ${
                            selected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                          }`}
            >
              {selected && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#fa7517]" aria-hidden="true" />}
              <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded bg-black ring-1 ring-gray-800">
                {thumbnail ? (
                  <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Film className="h-3.5 w-3.5 text-gray-700" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                {/* Camera files share long prefixes: keep the end, where they differ. */}
                <span className="block truncate text-sm text-gray-100">{middleEllipsis(title, 30)}</span>
                <span className={`mt-0.5 flex items-center gap-1 text-xs ${TONE_TEXT[statusTone]}`}>
                  <ToneIcon tone={statusTone} />
                  <span className="truncate">
                    {statusText}
                    {technical.percent !== null ? ` · ${technical.percent}%` : ''}
                  </span>
                </span>
                {channel && <span className="mt-0.5 block truncate text-[11px] text-gray-600">{channel}</span>}
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
