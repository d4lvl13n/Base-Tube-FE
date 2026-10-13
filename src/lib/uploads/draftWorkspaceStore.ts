/**
 * Device-side memory of the upload workspace (UP-UX §7–§8).
 *
 * The server draft is the editorial source of truth. This store only keeps
 * what the server has NOT acknowledged yet — typed fields, a chosen thumbnail
 * image, a publication command whose answer was lost — so a reload or a
 * dropped connection never silently loses them.
 *
 * Two object stores in one database per account (same namespacing rule as the
 * upload queue): `drafts` (one record per draft) and `blobs` (thumbnail images
 * waiting to reach the server). An unidentified session gets a memory store,
 * so nothing durable ever accumulates under a shared name.
 */
import {
  NON_DURABLE_NAMESPACES,
  type CreatorDraftView,
  type DraftEditableFields,
  type DraftFieldPatch,
  type DraftPublicationState,
} from '@basetube/api';

/** The creator's current thumbnail choice. The highest `seq` is the latest choice and always wins. */
export interface LocalThumbnailChoice {
  seq: number;
  kind: 'automatic' | 'custom';
  source: 'import' | 'ai' | 'automatic';
  /** Custom only: the idempotency identity sent with the asset upload. */
  clientAssetId: string | null;
  /** Custom only: key of the image in the `blobs` store. */
  blobKey: string | null;
  /** False when the browser refused to keep the image: after a reload it must be chosen again. */
  blobPersisted: boolean;
  filename: string | null;
  /** Server asset, once `POST /thumbnail-assets` answered. */
  assetId: string | null;
  status: 'pending_upload' | 'uploading' | 'uploaded' | 'selecting' | 'selected' | 'failed';
  errorCode: string | null;
  errorMessage: string | null;
}

/** A publication command sent (or about to be) under a durable identity. */
export interface PendingPublication {
  clientOperationId: string;
  state: DraftPublicationState;
  expectedRevision: number;
  createdAt: string;
}

export interface DraftWorkspaceRecord {
  /** Local identity, created before any request. The record key. */
  clientDraftId: string;
  /** Server draft id once `POST /creator-drafts` answered. */
  draftId: string | null;
  /** Fixed at creation (UP-BE §4.5). */
  channelId: number;
  /** Original filename, for the list before a title exists. */
  filename: string | null;
  /** What the editor shows. */
  desired: DraftEditableFields;
  /** Fields of `desired` the server has not acknowledged. */
  pending: DraftFieldPatch | null;
  /** Last committed projection. */
  server: CreatorDraftView | null;
  thumbnail: LocalThumbnailChoice | null;
  publication: PendingPublication | null;
  /** Hidden from this device's list by the creator (published drafts only). */
  dismissed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DraftWorkspaceStore {
  /** False for the memory fallback: the UI must not promise "kept on this device". */
  readonly durable: boolean;
  list: () => Promise<DraftWorkspaceRecord[]>;
  put: (record: DraftWorkspaceRecord) => Promise<void>;
  remove: (clientDraftId: string) => Promise<void>;
  putBlob: (key: string, blob: Blob) => Promise<void>;
  getBlob: (key: string) => Promise<Blob | null>;
  removeBlob: (key: string) => Promise<void>;
}

const DATABASE_NAME = 'bt-creator-drafts-v1';
const DRAFTS = 'drafts';
const BLOBS = 'blobs';

function databaseName(namespace: string): string {
  return `${DATABASE_NAME}--${namespace.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128)}`;
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

function createIndexedDbStore(namespace: string): DraftWorkspaceStore {
  let databasePromise: Promise<IDBDatabase> | null = null;
  const database = () => {
    if (!databasePromise) {
      const request = indexedDB.open(databaseName(namespace), 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DRAFTS)) db.createObjectStore(DRAFTS, { keyPath: 'clientDraftId' });
        if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
      };
      databasePromise = requestResult(request).catch((error) => {
        databasePromise = null;
        throw error;
      });
    }
    return databasePromise;
  };

  const write = async (store: string, run: (objectStore: IDBObjectStore) => void) => {
    const db = await database();
    const transaction = db.transaction(store, 'readwrite');
    const done = transactionDone(transaction);
    run(transaction.objectStore(store));
    await done;
  };

  return {
    durable: true,
    async list() {
      const db = await database();
      const transaction = db.transaction(DRAFTS, 'readonly');
      const done = transactionDone(transaction);
      const values = await requestResult(
        transaction.objectStore(DRAFTS).getAll() as IDBRequest<DraftWorkspaceRecord[]>,
      );
      await done;
      return values.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    put: (record) => write(DRAFTS, (store) => store.put(record)),
    remove: (clientDraftId) => write(DRAFTS, (store) => store.delete(clientDraftId)),
    putBlob: (key, blob) => write(BLOBS, (store) => store.put(blob, key)),
    async getBlob(key) {
      const db = await database();
      const transaction = db.transaction(BLOBS, 'readonly');
      const done = transactionDone(transaction);
      const value = await requestResult(transaction.objectStore(BLOBS).get(key) as IDBRequest<Blob | undefined>);
      await done;
      return value instanceof Blob ? value : null;
    },
    removeBlob: (key) => write(BLOBS, (store) => store.delete(key)),
  };
}

function createMemoryStore(): DraftWorkspaceStore {
  const records = new Map<string, DraftWorkspaceRecord>();
  const blobs = new Map<string, Blob>();
  return {
    durable: false,
    async list() {
      return Array.from(records.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async put(record) {
      records.set(record.clientDraftId, record);
    },
    async remove(clientDraftId) {
      records.delete(clientDraftId);
    },
    async putBlob(key, blob) {
      blobs.set(key, blob);
    },
    async getBlob(key) {
      return blobs.get(key) ?? null;
    },
    async removeBlob(key) {
      blobs.delete(key);
    },
  };
}

export function createDraftWorkspaceStore(namespace: string): DraftWorkspaceStore {
  if (typeof indexedDB === 'undefined' || NON_DURABLE_NAMESPACES.has(namespace)) return createMemoryStore();
  return createIndexedDbStore(namespace);
}
