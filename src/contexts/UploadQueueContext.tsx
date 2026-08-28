import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useUploadQueue, type UploadQueueApi } from '../hooks/useUploadQueue';
import UploadQueuePanel from '../components/upload/UploadQueuePanel';
import { showInfoToast } from '../components/common/Notifications/ErrorToast';
import { uploadPhase } from '../components/upload/uploadPhase';
import {
  BACKGROUND_UPLOAD_NOTICE,
  claimBackgroundNotice,
  isUploadRoute,
} from '../components/upload/backgroundUploadNotice';

const UploadQueueContext = createContext<UploadQueueApi | null>(null);

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
  const queue = useUploadQueue();
  const location = useLocation();
  const uploading = queue.entries.some((entry) =>
    (BYTES_IN_FLIGHT_STATUSES as readonly string[]).includes(entry.status),
  );

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

  return (
    <UploadQueueContext.Provider value={queue}>
      {children}
      {queue.entries.length > 0 && !onUploadRoute && <UploadQueuePanel queue={queue} />}
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
