import { normalizeEtag, putBlobWithProgress } from '../direct-upload-transport';
import { capability } from './helpers';

describe('normalizeEtag', () => {
  // The backend's `normalizeEtag` trims, strips the quotes S3 wraps the header
  // in, and lowercases before hashing it into the completion fingerprint.
  it.each([
    ['"ABC123"', 'abc123'],
    ['  "abc123"  ', 'abc123'],
    ['ABC123', 'abc123'],
    ['"a"', 'a'],
  ])('canonicalises %s to %s', (raw, expected) => {
    expect(normalizeEtag(raw)).toBe(expected);
  });

  it.each([null, undefined, '', '   ', '""'])('reports %p as absent', (raw) => {
    expect(normalizeEtag(raw as string | null)).toBeNull();
  });
});

/** Minimal XHR double: enough to drive onload / abort paths. */
class FakeXhr {
  static last: FakeXhr | null = null;
  upload: { onprogress: ((event: unknown) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 200;
  opened = false;
  sent = false;
  private headers: Record<string, string> = {};

  constructor() {
    FakeXhr.last = this;
  }

  open() {
    this.opened = true;
  }

  setRequestHeader() {}

  getResponseHeader(name: string): string | null {
    return this.headers[name.toLowerCase()] ?? null;
  }

  respondWith(headers: Record<string, string>) {
    this.headers = headers;
  }

  abort() {
    this.onabort?.();
  }

  send() {
    this.sent = true;
  }
}

describe('putBlobWithProgress', () => {
  const originalXhr = (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest;

  beforeEach(() => {
    FakeXhr.last = null;
    (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = FakeXhr;
  });

  afterAll(() => {
    (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = originalXhr;
  });

  const blob = { size: 100 } as Blob;

  it('normalises the ETag the storage provider returns', async () => {
    const promise = putBlobWithProgress(capability(1, 100), blob, () => {});
    FakeXhr.last!.respondWith({ etag: '"ABC123"' });
    FakeXhr.last!.onload!();

    await expect(promise).resolves.toEqual({ etag: 'abc123' });
  });

  it('reports a missing ETag as null rather than an empty string', async () => {
    const promise = putBlobWithProgress(capability(1, 100), blob, () => {});
    FakeXhr.last!.respondWith({});
    FakeXhr.last!.onload!();

    await expect(promise).resolves.toEqual({ etag: null });
  });

  // Opening the request first would put bytes on the wire for a transfer the
  // caller has already abandoned, and leave an unobserved XHR behind it.
  it('rejects without opening an XHR when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      putBlobWithProgress(capability(1, 100), blob, () => {}, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(FakeXhr.last).toBeNull();
  });

  it('still aborts an in-flight request when the signal fires later', async () => {
    const controller = new AbortController();
    const promise = putBlobWithProgress(capability(1, 100), blob, () => {}, controller.signal);
    expect(FakeXhr.last!.sent).toBe(true);

    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('putBlobWithProgress stall watchdog', () => {
  const originalXhr = (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest;
  const blob = { size: 100 } as Blob;

  beforeEach(() => {
    jest.useFakeTimers();
    FakeXhr.last = null;
    (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = FakeXhr;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = originalXhr;
  });

  // A hung connection to the bucket fires neither onload nor onerror; before
  // the watchdog the row sat at "Uploading 0 %" forever and never retried.
  it('aborts a PUT that makes no progress and reports it as a retryable stall', async () => {
    const promise = putBlobWithProgress(capability(1, 100), blob, () => {}, undefined, {
      stallTimeoutMs: 1_000,
    });
    jest.advanceTimersByTime(1_001);
    await expect(promise).rejects.toMatchObject({
      name: 'DirectUploadError',
      code: 'STORAGE_STALLED',
      status: null,
    });
  });

  it('is re-armed by progress, so a slow-but-moving upload is left alone', async () => {
    const promise = putBlobWithProgress(capability(1, 100), blob, () => {}, undefined, {
      stallTimeoutMs: 1_000,
    });
    jest.advanceTimersByTime(800);
    FakeXhr.last!.upload.onprogress!({ lengthComputable: true, loaded: 10 });
    jest.advanceTimersByTime(800);
    FakeXhr.last!.upload.onprogress!({ lengthComputable: true, loaded: 20 });
    jest.advanceTimersByTime(800);
    FakeXhr.last!.respondWith({ etag: '"ok"' });
    FakeXhr.last!.onload!();
    await expect(promise).resolves.toEqual({ etag: 'ok' });
  });

  it('still reports a caller abort as AbortError, not as a stall', async () => {
    const controller = new AbortController();
    const promise = putBlobWithProgress(capability(1, 100), blob, () => {}, controller.signal, {
      stallTimeoutMs: 1_000,
    });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
