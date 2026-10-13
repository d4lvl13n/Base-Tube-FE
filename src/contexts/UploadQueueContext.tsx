import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from './AuthContext';
import {
  NON_DURABLE_NAMESPACES,
  purgeLegacyResumeDatabases,
  type SessionRecovery,
} from '@basetube/api';
import { useUploadQueue, type UploadQueueApi } from '../hooks/useUploadQueue';
import UploadQueuePanel from '../components/upload/UploadQueuePanel';
import { showInfoToast } from '../components/common/Notifications/ErrorToast';
import { uploadPhase } from '../components/upload/uploadPhase';
import {
  BACKGROUND_UPLOAD_NOTICE,
  claimBackgroundNotice,
  isUploadRoute,
} from '../components/upload/backgroundUploadNotice';
import { createWebSessionRecovery, requestReauthentication } from '../lib/uploads/sessionRecovery';
import { createAttemptLease } from '../lib/uploads/attemptLease';
import { DraftWorkspaceBoundary } from './DraftWorkspaceContext';

const UploadQueueContext = createContext<UploadQueueApi | null>(null);

/** The account's session recovery and its "Sign in again" action, shared by every upload surface. */
interface UploadSession {
  recovery: SessionRecovery;
  requestSignIn: () => Promise<boolean>;
}

const UploadSessionContext = createContext<UploadSession | null>(null);

/**
 * Only `uploading` has bytes on the wire.
 *
 * `uploaded` means every part is already in storage and the row is waiting on
 * the server's completion/processing — closing the tab costs nothing, and
 * warning there trains creators to click through the dialog. `reserving` is the
 * create round-trip, which is likewise resumable from IndexedDB.
 */
const BYTES_IN_FLIGHT_STATUSES = ['uploading'] as const;

/**
 * Owns the upload queue for the whole tab.
 *
 * It has to live above the router: an upload must survive navigating away from
 * the upload page, and there must never be two queues racing for the same
 * IndexedDB records.
 */
export const UploadQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The queue's IndexedDB records are per-user: keying the inner provider on
  // the account remounts (and re-hydrates) the queue when the user changes, so
  // the next sign-in never sees the previous account's filenames/drafts. Both
  // auth methods count — a Web3 session left under a shared 'anonymous'
  // database would leak drafts between wallet accounts on the same browser.
  const { user, isLoaded } = useUser();
  const { user: web3User } = useAuth();
  // CLERK FIRST when a Clerk session exists. Linking a wallet (or a card
  // checkout's success page) calls the web3 `setUser` for a Clerk account too;
  // letting that id take precedence flipped the namespace mid-session and
  // remounted the queue — aborting a creator's in-flight transfer. The web3 id
  // only names a session that has no Clerk user at all.
  const namespace = !isLoaded
    ? 'loading'
    : user?.id
      ? user.id
      : web3User?.id
        ? web3User.id
        : 'anonymous';

  // Unidentified sessions get a MEMORY store (see createUploadResumeStore), so
  // nothing durable ever accumulates under 'anonymous'/'loading' again. The
  // databases that predate namespacing hold records belonging to nobody
  // identifiable — purge them once an identity is known rather than import
  // and risk showing another person's drafts.
  useEffect(() => {
    if (!NON_DURABLE_NAMESPACES.has(namespace)) purgeLegacyResumeDatabases();
  }, [namespace]);

  return (
    <UploadQueueProviderInner
      key={namespace}
      storageNamespace={namespace}
      // A wallet sign-in of the SAME account must resume the waiting attempts;
      // a different account remounts instead (the key above).
      sessionKey={web3User?.id ?? null}
    >
      {children}
    </UploadQueueProviderInner>
  );
};

const UploadQueueProviderInner: React.FC<{
  children: React.ReactNode;
  storageNamespace: string;
  sessionKey: string | null;
}> = ({ children, storageNamespace, sessionKey }) => {
  // One recovery and one lease per account subtree: a refused session or a
  // held attempt never carries over to the next account on this browser.
  const recovery = useMemo(() => createWebSessionRecovery(), []);
  const lease = useMemo(
    () => (NON_DURABLE_NAMESPACES.has(storageNamespace) ? undefined : createAttemptLease(storageNamespace)),
    [storageNamespace],
  );
  useEffect(() => () => lease?.dispose(), [lease]);

  const queue = useUploadQueue({ storageNamespace, sessionRecovery: recovery, lease });
  const location = useLocation();
  const uploading = queue.entries.some((entry) =>
    (BYTES_IN_FLIGHT_STATUSES as readonly string[]).includes(entry.status),
  );

  // Signed in again (same account), back on the tab, or a light check every
  // 10 s — only while a refused session is actually waiting. Each check is one
  // silent renewal; nothing is retried until it succeeds.
  useEffect(() => {
    if (recovery.blocked) void recovery.resume();
  }, [recovery, sessionKey]);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const check = () => {
      if (recovery.blocked) void recovery.resume();
    };
    const unsubscribe = recovery.subscribe((blocked) => {
      if (timer) clearInterval(timer);
      timer = blocked ? setInterval(check, 10_000) : undefined;
    });
    window.addEventListener('focus', check);
    return () => {
      unsubscribe();
      if (timer) clearInterval(timer);
      window.removeEventListener('focus', check);
    };
  }, [recovery]);

  const requestSignIn = useCallback(() => requestReauthentication(recovery), [recovery]);
  const session = useMemo(() => ({ recovery, requestSignIn }), [recovery, requestSignIn]);

  // The upload pages render the queue inline, so the floating panel there would
  // be the same rows twice.
  const onUploadRoute = isUploadRoute(location.pathname);

  // Read at navigation time, not depended on — a file finishing must not
  // re-fire the effect.
  const transferringRef = useRef(false);
  transferringRef.current = queue.entries.some((entry) => uploadPhase(entry) === 'uploading');

  const previousPathRef = useRef(location.pathname);
  useEffect(() => {
    const from = previousPathRef.current;
    previousPathRef.current = location.pathname;
    if (from === location.pathname) return;
    // Only on the way out of an upload page, and only if bytes are moving.
    if (!isUploadRoute(from) || isUploadRoute(location.pathname)) return;
    if (!transferringRef.current) return;
    if (claimBackgroundNotice()) showInfoToast(BACKGROUND_UPLOAD_NOTICE);
  }, [location.pathname]);

  useEffect(() => {
    if (!uploading) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome ignores custom text but still needs returnValue set.
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [uploading]);

  const panel = queue.entries.length > 0 && !onUploadRoute && <UploadQueuePanel queue={queue} />;

  return (
    <UploadQueueContext.Provider value={queue}>
      <UploadSessionContext.Provider value={session}>
        <DraftWorkspaceBoundary
          queue={queue}
          recovery={recovery}
          storageNamespace={storageNamespace}
        >
          {children}
          {panel}
        </DraftWorkspaceBoundary>
      </UploadSessionContext.Provider>
    </UploadQueueContext.Provider>
  );
};

export function useUploadQueueContext(): UploadQueueApi {
  const context = useContext(UploadQueueContext);
  if (!context) {
    throw new Error('useUploadQueueContext must be used inside <UploadQueueProvider>');
  }
  return context;
}

/** The session, or null outside the provider (a surface that can live without "Sign in again"). */
export function useOptionalUploadSession(): UploadSession | null {
  return useContext(UploadSessionContext);
}

export function useUploadSession(): UploadSession {
  const context = useContext(UploadSessionContext);
  if (!context) {
    throw new Error('useUploadSession must be used inside <UploadQueueProvider>');
  }
  return context;
}
