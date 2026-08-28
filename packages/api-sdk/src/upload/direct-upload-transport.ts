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

function exactLength(capability: MultipartPartCapability): number {
  const raw = capability.uaManagedSignedHeaders['content-length'];
  if (!/^\d+$/u.test(raw)) {
    throw new DirectUploadError('Upload capability length is invalid', null, 'CAPABILITY_INVALID');
  }
  return Number(raw);
}

export function putBlobWithProgress(
  capability: MultipartPartCapability,
  blob: Blob,
  onProgress: (loadedBytes: number) => void,
  signal?: AbortSignal,
): Promise<{ etag: string | null }> {
  const requiredLength = exactLength(capability);
  if (blob.size !== requiredLength) {
    throw new DirectUploadError(
      'Selected bytes do not match the signed upload length',
      null,
      'SIGNED_LENGTH_MISMATCH',
    );
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', capability.url);
    for (const [name, value] of Object.entries(capability.requiredHeaders)) {
      request.setRequestHeader(name, value);
    }
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(event.loaded, requiredLength));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(requiredLength);
        resolve({ etag: request.getResponseHeader('etag') });
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
    request.onerror = () =>
      reject(new DirectUploadError('Storage upload failed', null, 'STORAGE_NETWORK_ERROR'));
    request.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal?.addEventListener('abort', () => request.abort(), { once: true });
    request.send(blob);
  });
}
