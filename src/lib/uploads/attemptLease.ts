/**
 * One tab at a time per transfer attempt (UP-UX §10).
 *
 * Two tabs of the same account share the queue's IndexedDB records. Without a
 * lease, a second tab that reloads mid-upload would hydrate the same attempt
 * and push (or complete) it in parallel. The lease is a small record in
 * localStorage — `{ tabId, expiresAt }` per `clientAttemptId` — renewed while
 * the transfer runs and released when it stops. A tab that disappears simply
 * stops renewing; after `LEASE_TTL_MS` another tab may take over, and the
 * transfer it starts re-reads the server's part list first, so nothing is
 * sent twice.
 *
 * Changes are signalled across tabs with BroadcastChannel when available and
 * with the `storage` event otherwise. Editorial changes are not covered here:
 * draft revisions protect those separately.
 *
 * If localStorage is unavailable the lease always grants: one tab keeps
 * working exactly as before this change.
 */

const LEASE_TTL_MS = 15_000;
const RENEW_EVERY_MS = 5_000;

interface LeaseRecord {
  tabId: string;
  expiresAt: number;
}

export interface AttemptLease {
  /** Takes (or keeps) the lease. False when another live tab holds it. */
  tryAcquire: (attemptId: string) => boolean;
  release: (attemptId: string) => void;
  /** True when another live tab holds the lease right now. */
  heldElsewhere: (attemptId: string) => boolean;
  /**
   * `changed` fires when any lease moves (another tab released or expired);
   * `lost` fires for a lease this tab held and another tab now owns.
   */
  subscribe: (listener: (event: { type: 'changed' } | { type: 'lost'; attemptId: string }) => void) => () => void;
  dispose: () => void;
}

function storageAvailable(): boolean {
  try {
    const probe = '__bt_lease_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function createAttemptLease(namespace: string): AttemptLease {
  const tabId = crypto.randomUUID();
  const prefix = `bt.uploadLease.${namespace.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128)}.`;
  const held = new Set<string>();
  const listeners = new Set<(event: { type: 'changed' } | { type: 'lost'; attemptId: string }) => void>();
  const usable = storageAvailable();
  const channel =
    usable && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`${prefix}channel`) : null;

  const emit = (event: { type: 'changed' } | { type: 'lost'; attemptId: string }) =>
    listeners.forEach((listener) => listener(event));

  const read = (attemptId: string): LeaseRecord | null => {
    try {
      const raw = localStorage.getItem(prefix + attemptId);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<LeaseRecord>;
      return typeof parsed.tabId === 'string' && typeof parsed.expiresAt === 'number'
        ? { tabId: parsed.tabId, expiresAt: parsed.expiresAt }
        : null;
    } catch {
      return null;
    }
  };

  const write = (attemptId: string) => {
    try {
      const record: LeaseRecord = { tabId, expiresAt: Date.now() + LEASE_TTL_MS };
      localStorage.setItem(prefix + attemptId, JSON.stringify(record));
    } catch {
      /* quota or privacy mode: the lease degrades to "granted" */
    }
  };

  const otherLive = (attemptId: string): boolean => {
    const record = read(attemptId);
    return !!record && record.tabId !== tabId && record.expiresAt > Date.now();
  };

  const renew = () => {
    for (const attemptId of Array.from(held)) {
      if (otherLive(attemptId)) {
        // Two tabs raced for an expired lease and the other write landed last.
        held.delete(attemptId);
        emit({ type: 'lost', attemptId });
        continue;
      }
      write(attemptId);
    }
  };
  const renewTimer = usable ? setInterval(renew, RENEW_EVERY_MS) : null;

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key.startsWith(prefix)) emit({ type: 'changed' });
  };
  if (usable) window.addEventListener('storage', onStorage);
  if (channel) channel.onmessage = () => emit({ type: 'changed' });

  return {
    tryAcquire(attemptId) {
      if (!usable) return true;
      if (otherLive(attemptId)) return false;
      write(attemptId);
      // Read back: if another tab wrote in between, it owns the lease.
      if (otherLive(attemptId)) return false;
      held.add(attemptId);
      return true;
    },

    release(attemptId) {
      if (!held.delete(attemptId) || !usable) return;
      try {
        const record = read(attemptId);
        if (record?.tabId === tabId) localStorage.removeItem(prefix + attemptId);
      } catch {
        /* nothing to release */
      }
      channel?.postMessage({ released: attemptId });
    },

    heldElsewhere(attemptId) {
      return usable && otherLive(attemptId);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    dispose() {
      if (renewTimer) clearInterval(renewTimer);
      for (const attemptId of Array.from(held)) this.release(attemptId);
      if (usable) window.removeEventListener('storage', onStorage);
      channel?.close();
      listeners.clear();
    },
  };
}
