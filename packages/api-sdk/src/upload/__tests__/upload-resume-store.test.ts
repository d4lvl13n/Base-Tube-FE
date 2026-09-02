/**
 * Reload-recovery store tests.
 *
 * The package's Jest environment is `node`, which ships no IndexedDB (and
 * `fake-indexeddb` is not a dependency), so the IndexedDB-backed paths run
 * against a minimal in-file fake: enough of `open`/`transaction`/`objectStore`
 * for `createIndexedDbResumeStore` to work, backed by one Map per DATABASE
 * NAME — which is exactly what makes namespace isolation observable.
 */
import type { PersistedUploadRecord } from '../types';
import {
  createIndexedDbResumeStore,
  createMemoryResumeStore,
  createUploadResumeStore,
  NON_DURABLE_NAMESPACES,
  purgeLegacyResumeDatabases,
} from '../upload-resume-store';
import { persistedRecord } from '../upload-queue-store';
import { queueEntry } from './helpers';

function record(localId: string, createdAt = '2026-08-28T10:00:00.000Z'): PersistedUploadRecord {
  return persistedRecord(queueEntry({ localId, clientAttemptId: localId, createdAt }));
}

// ── minimal fake IndexedDB ──────────────────────────────────────────────────

type FakeDbContents = Map<string, PersistedUploadRecord>;

function installFakeIndexedDb() {
  const databases = new Map<string, FakeDbContents>();
  const openedNames: string[] = [];

  function fakeRequest<T>(execute: () => T) {
    const request = {
      onsuccess: null as null | (() => void),
      onerror: null as null | (() => void),
      result: undefined as unknown as T,
      error: null as Error | null,
    };
    queueMicrotask(() => {
      try {
        request.result = execute();
        request.onsuccess?.();
      } catch (error) {
        request.error = error as Error;
        request.onerror?.();
      }
    });
    return request;
  }

  function fakeDatabase(name: string) {
    let storeCreated = databases.has(name);
    const contents = (): FakeDbContents => {
      if (!databases.has(name)) databases.set(name, new Map());
      return databases.get(name)!;
    };
    return {
      objectStoreNames: { contains: () => storeCreated },
      createObjectStore: () => {
        storeCreated = true;
        contents();
        return { createIndex: () => undefined };
      },
      transaction: (_store: string, _mode: string) => {
        const transaction = {
          oncomplete: null as null | (() => void),
          onerror: null as null | (() => void),
          onabort: null as null | (() => void),
          error: null,
          objectStore: () => ({
            getAll: () => fakeRequest(() => [...contents().values()]),
            put: (value: PersistedUploadRecord) =>
              fakeRequest(() => {
                contents().set(value.localId, { ...value });
              }),
            delete: (key: string) =>
              fakeRequest(() => {
                contents().delete(key);
              }),
          }),
        };
        // A macrotask, so it lands after every request's microtask.
        setTimeout(() => transaction.oncomplete?.(), 0);
        return transaction;
      },
    };
  }

  const deletedNames: string[] = [];

  const fake = {
    deleteDatabase: (name: string) => {
      deletedNames.push(name);
      databases.delete(name);
      return fakeRequest(() => undefined);
    },
    open: (name: string, _version: number) => {
      openedNames.push(name);
      const isNew = !databases.has(name);
      const database = fakeDatabase(name);
      const request = {
        onupgradeneeded: null as null | (() => void),
        onsuccess: null as null | (() => void),
        onerror: null as null | (() => void),
        result: database,
        error: null,
      };
      queueMicrotask(() => {
        if (isNew) request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };

  (globalThis as { indexedDB?: unknown }).indexedDB = fake;
  return {
    openedNames,
    deletedNames,
    uninstall: () => {
      delete (globalThis as { indexedDB?: unknown }).indexedDB;
    },
  };
}

// ── memory store contract ───────────────────────────────────────────────────

describe('createMemoryResumeStore', () => {
  it('puts, lists in createdAt order, replaces by localId, and removes', async () => {
    const store = createMemoryResumeStore();
    await store.put(record('b', '2026-08-28T11:00:00.000Z'));
    await store.put(record('a', '2026-08-28T10:00:00.000Z'));

    await expect(store.list()).resolves.toMatchObject([{ localId: 'a' }, { localId: 'b' }]);

    // Same localId is an update, not a duplicate.
    await store.put({ ...record('a', '2026-08-28T10:00:00.000Z'), title: 'renamed' });
    const listed = await store.list();
    expect(listed).toHaveLength(2);
    expect(listed[0]).toMatchObject({ localId: 'a', title: 'renamed' });

    await store.remove('a');
    await expect(store.list()).resolves.toMatchObject([{ localId: 'b' }]);
  });

  it('stores a copy, not the caller reference', async () => {
    const store = createMemoryResumeStore();
    const original = record('a');
    await store.put(original);
    original.title = 'mutated after put';
    expect((await store.list())[0]!.title).toBe('clip');
  });

  it('keeps two memory stores fully independent', async () => {
    const first = createMemoryResumeStore();
    const second = createMemoryResumeStore();
    await first.put(record('a'));
    await expect(second.list()).resolves.toHaveLength(0);
  });
});

// ── platform fallback ───────────────────────────────────────────────────────

describe('createUploadResumeStore without IndexedDB', () => {
  it('falls back to a working memory store, namespace or not', async () => {
    expect(typeof indexedDB).toBe('undefined');
    for (const namespace of [undefined, 'user-a']) {
      const store = createUploadResumeStore(namespace);
      await store.put(record('a'));
      await expect(store.list()).resolves.toMatchObject([{ localId: 'a' }]);
      await store.remove('a');
      await expect(store.list()).resolves.toHaveLength(0);
    }
  });
});

// ── namespaced IndexedDB store ──────────────────────────────────────────────

describe('createUploadResumeStore with IndexedDB (fake)', () => {
  let fake: ReturnType<typeof installFakeIndexedDb>;

  beforeEach(() => {
    fake = installFakeIndexedDb();
  });

  afterEach(() => {
    fake.uninstall();
  });

  // One un-namespaced database showed the previous user's uploads to the next
  // account on the same browser: records are now keyed per authenticated user.
  it('isolates records per namespace', async () => {
    const userA = createUploadResumeStore('user-a');
    await userA.put(record('a-upload'));

    // Same namespace, new store instance: the record is durable and visible.
    await expect(createUploadResumeStore('user-a').list()).resolves.toMatchObject([
      { localId: 'a-upload' },
    ]);
    // Another user — and the legacy un-namespaced database — see nothing.
    await expect(createUploadResumeStore('user-b').list()).resolves.toHaveLength(0);
    await expect(createUploadResumeStore().list()).resolves.toHaveLength(0);
  });

  it('derives the database name from the namespace, sanitized', async () => {
    await createIndexedDbResumeStore().list();
    await createIndexedDbResumeStore('user-a').list();
    // Clerk-style ids carry characters IndexedDB names should not trust.
    await createIndexedDbResumeStore('user:123@clerk!').list();

    expect(fake.openedNames).toEqual([
      'bt-upload-v1',
      'bt-upload-v1--user-a',
      'bt-upload-v1--user_123_clerk_',
    ]);
  });

  it('removes only from its own namespace', async () => {
    const userA = createUploadResumeStore('user-a');
    const userB = createUploadResumeStore('user-b');
    await userA.put(record('shared-local-id'));
    await userB.put(record('shared-local-id'));

    await userA.remove('shared-local-id');

    await expect(userA.list()).resolves.toHaveLength(0);
    await expect(userB.list()).resolves.toHaveLength(1);
  });

  // An unidentified session has nobody to scope records to; a shared durable
  // 'anonymous' database is exactly what leaked one person's filenames and
  // drafts to the next account on the browser. So even WITH IndexedDB present,
  // those namespaces get a memory store and never open a database.
  describe('non-durable namespaces', () => {
    it('exports the exact set the provider keys off', () => {
      expect([...NON_DURABLE_NAMESPACES].sort()).toEqual(['anonymous', 'loading']);
    });

    it.each([undefined, 'anonymous', 'loading'])(
      'returns a memory store (no IndexedDB open) for namespace %p',
      async (namespace) => {
        const store = createUploadResumeStore(namespace);
        await store.put(record('a'));
        await expect(store.list()).resolves.toMatchObject([{ localId: 'a' }]);
        await store.remove('a');
        await expect(store.list()).resolves.toHaveLength(0);

        expect(fake.openedNames).toEqual([]);
      },
    );

    it('does not persist across store instances for a non-durable namespace', async () => {
      await createUploadResumeStore('anonymous').put(record('a'));
      // A fresh instance sees nothing: the previous one was memory-only.
      await expect(createUploadResumeStore('anonymous').list()).resolves.toHaveLength(0);
      expect(fake.openedNames).toEqual([]);
    });

    it('still opens the namespaced IndexedDB database for a real identity', async () => {
      await createUploadResumeStore('user-a').list();
      expect(fake.openedNames).toEqual(['bt-upload-v1--user-a']);
    });
  });
});

// ── legacy database purge ───────────────────────────────────────────────────

describe('purgeLegacyResumeDatabases', () => {
  it('is a no-op without IndexedDB', () => {
    expect(typeof indexedDB).toBe('undefined');
    expect(() => purgeLegacyResumeDatabases()).not.toThrow();
  });

  describe('with IndexedDB (fake)', () => {
    let fake: ReturnType<typeof installFakeIndexedDb>;

    beforeEach(() => {
      fake = installFakeIndexedDb();
    });

    afterEach(() => {
      fake.uninstall();
    });

    it('deletes the un-namespaced, anonymous and loading databases — and nothing else', () => {
      purgeLegacyResumeDatabases();

      expect(fake.deletedNames.sort()).toEqual([
        'bt-upload-v1',
        'bt-upload-v1--anonymous',
        'bt-upload-v1--loading',
      ]);
    });

    it('wipes records that lived in the legacy databases but leaves a real user untouched', async () => {
      // Seed the legacy databases directly through the IndexedDB-backed store
      // (createUploadResumeStore would refuse to open them, by design).
      await createIndexedDbResumeStore().put(record('legacy-unscoped'));
      await createIndexedDbResumeStore('anonymous').put(record('legacy-anon'));
      await createIndexedDbResumeStore('loading').put(record('legacy-loading'));
      await createIndexedDbResumeStore('user-a').put(record('mine'));

      purgeLegacyResumeDatabases();

      await expect(createIndexedDbResumeStore().list()).resolves.toHaveLength(0);
      await expect(createIndexedDbResumeStore('anonymous').list()).resolves.toHaveLength(0);
      await expect(createIndexedDbResumeStore('loading').list()).resolves.toHaveLength(0);
      await expect(createIndexedDbResumeStore('user-a').list()).resolves.toMatchObject([
        { localId: 'mine' },
      ]);
    });

    it('swallows a throwing deleteDatabase (best effort)', () => {
      (globalThis as { indexedDB: { deleteDatabase: unknown } }).indexedDB.deleteDatabase = () => {
        throw new Error('blocked');
      };
      expect(() => purgeLegacyResumeDatabases()).not.toThrow();
    });
  });
});
