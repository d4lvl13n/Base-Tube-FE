import React, { createContext, useContext, useEffect } from 'react';
import { useUploadQueue, type UploadQueueApi } from '../hooks/useUploadQueue';
import UploadQueuePanel from '../components/upload/UploadQueuePanel';

/** `REACT_APP_UPLOAD_V2=true` switches the creator surfaces to the V2 queue. */
export const UPLOAD_V2_ENABLED = process.env.REACT_APP_UPLOAD_V2 === 'true';

const UploadQueueContext = createContext<UploadQueueApi | null>(null);

const ACTIVE_STATUSES = ['reserving', 'uploading', 'uploaded'] as const;

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
    (ACTIVE_STATUSES as readonly string[]).includes(entry.status),
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

/**
 * Null-safe variant for components that also run on the legacy upload path.
 */
export function useOptionalUploadQueue(): UploadQueueApi | null {
  return useContext(UploadQueueContext);
}
