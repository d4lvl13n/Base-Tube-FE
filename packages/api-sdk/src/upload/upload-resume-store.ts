/**
 * Reload recovery for the upload queue.
 *
 * Ported from the AmazingAerial `upload-resume-store.ts`; only the database
 * name and the secondary index changed (there is no batch here). A memory
 * implementation is exported for tests and for browsers where IndexedDB is
 * unavailable (private mode, hardened profiles).
 */
import type { PersistedUploadRecord } from './types';

const DATABASE_NAME = 'bt-upload-v1';
const STORE_NAME = 'upload-records';
const DATABASE_VERSION = 1;

/**
 * Databases are NAMESPACED per authenticated user: filenames and draft
 * metadata are personal, and one un-namespaced database showed the previous
 * user's uploads to the next account on the same browser.
 */
function databaseName(namespace?: string): string {
  if (!namespace) return DATABASE_NAME;
  const safe = namespace.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return `${DATABASE_NAME}--${safe}`;
}

export interface UploadResumeStore {
  list: () => Promise<PersistedUploadRecord[]>;
  put: (record: PersistedUploadRecord) => Promise<void>;
  remove: (localId: string) => Promise<void>;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

async function openDatabase(namespace?: string): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is unavailable');
  const request = indexedDB.open(databaseName(namespace), DATABASE_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      const store = database.createObjectStore(STORE_NAME, { keyPath: 'localId' });
      store.createIndex('channelId', 'channelId', { unique: false });
      store.createIndex('updatedAt', 'updatedAt', { unique: false });
    }
  };
  return requestResult(request);
}

export function createIndexedDbResumeStore(namespace?: string): UploadResumeStore {
  let databasePromise: Promise<IDBDatabase> | null = null;
  const database = () => {
    databasePromise ??= openDatabase(namespace);
    return databasePromise;
  };

  return {
    async list() {
      const db = await database();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const done = transactionDone(transaction);
      const values = await requestResult(
        transaction.objectStore(STORE_NAME).getAll() as IDBRequest<PersistedUploadRecord[]>,
      );
      await done;
      return values.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async put(record) {
      const db = await database();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const done = transactionDone(transaction);
      transaction.objectStore(STORE_NAME).put(record);
      await done;
    },
    async remove(localId) {
      const db = await database();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const done = transactionDone(transaction);
      transaction.objectStore(STORE_NAME).delete(localId);
      await done;
    },
  };
}

/**
 * Non-durable store with the same interface. The queue still works; it just
 * cannot recover after a reload, which the UI surfaces as a warning.
 */
export function createMemoryResumeStore(): UploadResumeStore {
  const records = new Map<string, PersistedUploadRecord>();
  return {
    async list() {
      return [...records.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async put(record) {
      records.set(record.localId, { ...record });
    },
    async remove(localId) {
      records.delete(localId);
    },
  };
}

/**
 * Namespaces that must NEVER get a durable database: an unauthenticated (or
 * not-yet-authenticated) session has no identity to scope records to, and a
 * shared durable "anonymous" database is exactly what leaked one user's
 * filenames and drafts to the next person on the browser.
 */
export const NON_DURABLE_NAMESPACES: ReadonlySet<string> = new Set(['anonymous', 'loading']);

/** IndexedDB when the platform has it AND the namespace is a real identity; memory otherwise. */
export function createUploadResumeStore(namespace?: string): UploadResumeStore {
  if (typeof indexedDB === 'undefined') return createMemoryResumeStore();
  if (!namespace || NON_DURABLE_NAMESPACES.has(namespace)) return createMemoryResumeStore();
  return createIndexedDbResumeStore(namespace);
}

/**
 * Removes the databases that predate per-user namespacing (the un-namespaced
 * original and the shared 'anonymous' one). Their contents belong to nobody
 * identifiable, so they are purged rather than imported. Best effort.
 */
export function purgeLegacyResumeDatabases(): void {
  if (typeof indexedDB === 'undefined') return;
  for (const name of [DATABASE_NAME, databaseName('anonymous'), databaseName('loading')]) {
    try {
      indexedDB.deleteDatabase(name);
    } catch {
      /* best effort */
    }
  }
}
