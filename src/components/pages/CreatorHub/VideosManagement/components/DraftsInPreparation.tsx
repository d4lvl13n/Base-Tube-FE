import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileVideo } from 'lucide-react';
import { useDraftWorkspaceContext } from '../../../../../contexts/DraftWorkspaceContext';
import { useUploadQueueContext } from '../../../../../contexts/UploadQueueContext';
import { displayTitle, technicalState } from '../../../../upload/workspace/draftStatus';

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
    <section aria-label="Videos in preparation" className="rounded-lg border border-gray-800/60 bg-[#0f0f0f]">
      <header className="flex items-center justify-between gap-3 border-b border-gray-800/60 px-4 py-3">
        <h2 className="text-sm font-medium text-gray-200">In preparation · private drafts</h2>
        <Link
          to="/creator-hub/uploads"
          className="inline-flex min-h-[44px] items-center gap-1 text-xs text-gray-400 hover:text-white"
        >
          Open the upload workspace
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </header>
      <ul className="divide-y divide-gray-800/60">
        {drafts.slice(0, SHOWN).map((draft) => {
          const technical = technicalState(draft, {
            cancelling: !!draft.entry && !!queue.cancellingIds?.has(draft.entry.localId),
            heldElsewhere: !!draft.entry && !!queue.heldElsewhereIds?.has(draft.entry.localId),
            online: typeof navigator === 'undefined' ? true : navigator.onLine,
          });
          return (
            <li key={draft.key} className="flex items-center gap-3 px-4 py-2">
              <FileVideo className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-100">{displayTitle(draft)}</p>
                <p className="truncate text-xs text-gray-500">{technical.label}</p>
              </div>
              {draft.record.draftId && (
                <Link
                  to={`/creator-hub/uploads/${encodeURIComponent(draft.record.draftId)}`}
                  className="inline-flex min-h-[44px] shrink-0 items-center text-xs text-[#fa7517] hover:text-[#ff8c3a]"
                >
                  Continue preparing
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {drafts.length > SHOWN && (
        <p className="border-t border-gray-800/60 px-4 py-2 text-xs text-gray-500">
          {drafts.length - SHOWN} more in the upload workspace.
        </p>
      )}
    </section>
  );
};
