import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileVideo } from 'lucide-react';
import { useDraftWorkspaceContext } from '../../../../../contexts/DraftWorkspaceContext';
import { useUploadQueueContext } from '../../../../../contexts/UploadQueueContext';
import { displayTitle, technicalState } from '../../../../upload/workspace/draftStatus';
import { cx, surface, text } from '../../Business/businessStyles';

const SHOWN = 5;

/**
 * Videos Management stays the library (UP-UX §4); private drafts still being
 * prepared appear here with "Continue preparing", which opens that exact
 * draft in the upload workspace — never a generic list.
 */
export const DraftsInPreparation: React.FC = () => {
  const workspace = useDraftWorkspaceContext();
  const queue = useUploadQueueContext();
  const activate = workspace?.activate;
  useEffect(() => {
    activate?.();
  }, [activate]);

  if (!workspace) return null;
  const drafts = workspace.items.filter((item) => item.record.server?.publicationState !== 'published');
  if (drafts.length === 0) return null;

  return (
    <section aria-label="Videos in preparation" className={surface.card}>
      <header className="flex items-center justify-between gap-3 border-b border-gray-800/50 px-4 py-1">
        <h2 className="text-sm font-semibold text-white">
          In preparation · <span className="font-normal text-gray-400">private drafts</span>
        </h2>
        <Link
          to="/creator-hub/uploads"
          className="inline-flex min-h-[44px] items-center gap-1 rounded-sm text-xs text-gray-400 transition-colors
                     hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50"
        >
          Open the upload workspace
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </header>
      <ul className={surface.divider}>
        {drafts.slice(0, SHOWN).map((draft) => {
          const technical = technicalState(draft, {
            cancelling: !!draft.entry && !!queue.cancellingIds?.has(draft.entry.localId),
            heldElsewhere: !!draft.entry && !!queue.heldElsewhereIds?.has(draft.entry.localId),
            online: typeof navigator === 'undefined' ? true : navigator.onLine,
          });
          return (
            <li key={draft.key} className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/[0.025]">
              <FileVideo className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-100">{displayTitle(draft)}</p>
                <p className="truncate text-xs text-gray-400">{technical.label}</p>
              </div>
              {draft.record.draftId && (
                <Link
                  to={`/creator-hub/uploads/${encodeURIComponent(draft.record.draftId)}`}
                  className={cx(text.link, 'inline-flex min-h-[44px] shrink-0 items-center text-xs font-medium')}
                >
                  Continue preparing
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {drafts.length > SHOWN && (
        <p className="border-t border-gray-800/50 px-4 py-2 text-xs text-gray-400">
          {drafts.length - SHOWN} more in the upload workspace.
        </p>
      )}
    </section>
  );
};
