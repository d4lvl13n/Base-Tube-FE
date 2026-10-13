import React, { createContext, useContext, useEffect, useState } from 'react';
import { NON_DURABLE_NAMESPACES, type SessionRecovery } from '@basetube/api';
import { useDraftWorkspace, type DraftWorkspaceApi } from '../hooks/useDraftWorkspace';
import type { UploadQueueApi } from '../hooks/useUploadQueue';

const DraftWorkspaceContext = createContext<DraftWorkspaceApi | null>(null);

interface EngineProps {
  queue: UploadQueueApi;
  recovery: SessionRecovery;
  storageNamespace: string;
  onChange: (workspace: DraftWorkspaceApi | null) => void;
}

/**
 * Runs the workspace engine and hands its state up. A sibling of the app
 * tree, not a wrapper: mounting it (once the account is known) never
 * remounts the routes — which would abort transfers in flight.
 *
 * Memoised: the boundary re-renders when it receives the workspace, and that
 * re-render must not re-run the engine (which would hand up a new object again).
 */
const DraftWorkspaceEngine = React.memo(function DraftWorkspaceEngine({
  queue,
  recovery,
  storageNamespace,
  onChange,
}: EngineProps) {
  const workspace = useDraftWorkspace({ queue, recovery, storageNamespace });

  useEffect(() => {
    onChange(workspace);
  }, [onChange, workspace]);
  useEffect(() => () => onChange(null), [onChange]);

  // Leaving with something not yet durable (a typed field, a local image, an
  // unconfirmed publication) asks the browser for its native warning. Not
  // every browser honours it, so the page never promises that it will.
  useEffect(() => {
    if (!workspace.atRisk) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [workspace.atRisk]);

  return null;
});

/**
 * Provides the upload workspace for the signed-in account (UP-UX).
 *
 * Mounted by the upload queue provider inside its account-keyed subtree: a
 * change of account remounts it with that account's device store. A session
 * with no identity yet ('loading', 'anonymous') has no workspace: drafts are
 * personal and there is nobody to scope them to.
 */
export const DraftWorkspaceBoundary: React.FC<{
  queue: UploadQueueApi;
  recovery: SessionRecovery;
  storageNamespace: string;
  children: React.ReactNode;
}> = ({ queue, recovery, storageNamespace, children }) => {
  const [workspace, setWorkspace] = useState<DraftWorkspaceApi | null>(null);
  const identified = !NON_DURABLE_NAMESPACES.has(storageNamespace);
  return (
    <>
      {identified && (
        <DraftWorkspaceEngine
          queue={queue}
          recovery={recovery}
          storageNamespace={storageNamespace}
          onChange={setWorkspace}
        />
      )}
      <DraftWorkspaceContext.Provider value={identified ? workspace : null}>{children}</DraftWorkspaceContext.Provider>
    </>
  );
};

/** The workspace, or null until the account is known and the engine has started. */
export function useDraftWorkspaceContext(): DraftWorkspaceApi | null {
  return useContext(DraftWorkspaceContext);
}
