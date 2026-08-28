import React, { createContext, useContext, useEffect } from 'react';
import { useUploadQueue, type UploadQueueApi } from '../hooks/useUploadQueue';
import UploadQueuePanel from '../components/upload/UploadQueuePanel';

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
  const uploading = queue.entries.some((entry) =>
    (BYTES_IN_FLIGHT_STATUSES as readonly string[]).includes(entry.status),
  );

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
      {queue.entries.length > 0 && <UploadQueuePanel queue={queue} />}
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
