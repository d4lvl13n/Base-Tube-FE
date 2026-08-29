/**
 * Browser → storage transport for one multipart part.
 *
 * Ported verbatim from the AmazingAerial contributor upload
 * (`apps/web/src/modules/contributor-submissions/direct-upload-transport.ts`);
 * the only change is the capability type, which now comes from `./contracts`
 * and is multipart-only (BaseTube always uses multipart, contract §4).
 *
 * XMLHttpRequest — not fetch — because it is the only browser API that reports
 * upload progress.
 */
import type { MultipartPartCapability } from './contracts';

export class DirectUploadError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: string,
  ) {
    super(message);
    this.name = 'DirectUploadError';
  }
}

export function abortableSleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/**
 * Canonicalises a storage ETag into the form the backend stores and compares.
 *
 * The backend's `normalizeEtag()` trims, strips the surrounding quotes S3 puts
 * on the header, and lowercases; the completion fingerprint is computed from
 * that value, so a client sending `"ABC"` and a client sending `abc` must not
 * look like two different completions.
 *
 * Returns `null` for anything that cannot be an ETag (absent, empty, or all
 * quotes) — the caller then falls back to the server's authoritative part list.
 */
export function normalizeEtag(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  let etag = value.trim();
  if (etag.length >= 2 && etag.startsWith('"') && etag.endsWith('"')) etag = etag.slice(1, -1);
  etag = etag.trim().toLowerCase();
  return etag.length > 0 ? etag : null;
}

function exactLength(capability: MultipartPartCapability): number {
  const raw = capability.uaManagedSignedHeaders['content-length'];
  if (!/^\d+$/u.test(raw)) {
    throw new DirectUploadError('Upload capability length is invalid', null, 'CAPABILITY_INVALID');
  }
  return Number(raw);
}

/**
 * How long a part PUT may go without a single upload-progress event before it
 * is treated as dead.
 *
 * A TCP connection to the bucket that silently stalls (seen 2026-08-29 against
 * R2 from a flaky client network) never fires `onerror`; without this the row
 * sat at "Uploading 0 %" indefinitely and the queue never retried. A stall is
 * reported as a network error, which `classifyTransferFailure` turns into
 * `retry_wait` — the retry renews the capability and re-sends the part.
 */
export const PUT_STALL_TIMEOUT_MS = 60_000;

export interface PutBlobOptions {
  /** Test hook; production uses `PUT_STALL_TIMEOUT_MS`. */
  stallTimeoutMs?: number;
}

export function putBlobWithProgress(
  capability: MultipartPartCapability,
  blob: Blob,
  onProgress: (loadedBytes: number) => void,
  signal?: AbortSignal,
  options: PutBlobOptions = {},
): Promise<{ etag: string | null }> {
  const requiredLength = exactLength(capability);
  const stallTimeoutMs = options.stallTimeoutMs ?? PUT_STALL_TIMEOUT_MS;
  if (blob.size !== requiredLength) {
    throw new DirectUploadError(
      'Selected bytes do not match the signed upload length',
      null,
      'SIGNED_LENGTH_MISMATCH',
    );
  }

  return new Promise((resolve, reject) => {
    // Opening an XHR for a transfer the caller has already given up on both
    // wastes the bytes and leaves an unobserved request in flight after the
    // component that owned it is gone.
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const request = new XMLHttpRequest();
    request.open('PUT', capability.url);
    for (const [name, value] of Object.entries(capability.requiredHeaders)) {
      request.setRequestHeader(name, value);
    }

    // Stall watchdog: re-armed by every progress event, disarmed on settle.
    let stalled = false;
    let stallTimer: ReturnType<typeof setTimeout> | undefined;
    const disarm = () => {
      if (stallTimer !== undefined) clearTimeout(stallTimer);
      stallTimer = undefined;
    };
    const arm = () => {
      disarm();
      if (stallTimeoutMs <= 0) return;
      stallTimer = setTimeout(() => {
        stalled = true;
        request.abort();
      }, stallTimeoutMs);
    };

    request.upload.onprogress = (event) => {
      arm();
      if (event.lengthComputable) onProgress(Math.min(event.loaded, requiredLength));
    };
    request.onload = () => {
      disarm();
      if (request.status >= 200 && request.status < 300) {
        onProgress(requiredLength);
        resolve({ etag: normalizeEtag(request.getResponseHeader('etag')) });
      } else {
        reject(
          new DirectUploadError(
            `Storage upload failed (${request.status})`,
            request.status,
            'STORAGE_PUT_FAILED',
          ),
        );
      }
    };
    request.onerror = () => {
      disarm();
      reject(new DirectUploadError('Storage upload failed', null, 'STORAGE_NETWORK_ERROR'));
    };
    request.onabort = () => {
      disarm();
      if (stalled) {
        reject(
          new DirectUploadError(
            `Storage upload made no progress for ${Math.round(stallTimeoutMs / 1_000)} s`,
            null,
            'STORAGE_STALLED',
          ),
        );
        return;
      }
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', () => request.abort(), { once: true });
    arm();
    request.send(blob);
  });
}
