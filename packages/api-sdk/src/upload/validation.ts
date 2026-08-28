/**
 * File selection validation and reload fingerprinting.
 *
 * Ported from the AmazingAerial `submission-validation.ts` (`fingerprint`,
 * `matchReselectedFiles`, `validateFileSelection`); the accepted MIME set and
 * the size ceiling come from contract §4: mp4 / mov / avi, 2 GB.
 */

/** Contract §4: `declaredSizeBytes` must not exceed this. */
export const VIDEO_MAX_BYTES = 2_000_000_000;

/** Content Studio accepts at most this many files in one selection. */
export const MAX_QUEUE_FILES = 50;

/** A single browser session will not track more originals than this. */
export const MAX_UPLOAD_SESSION_ITEMS = 200;

export type UploadContentType = 'video/mp4' | 'video/quicktime' | 'video/x-msvideo';

export interface ValidatedUploadFile {
  file: File;
  contentType: UploadContentType;
}

export interface RejectedUploadFile {
  file: File;
  code: 'UNSUPPORTED_TYPE' | 'FILE_TOO_LARGE' | 'INVALID_FILENAME' | 'QUEUE_FULL' | 'SESSION_FULL';
  message: string;
}

const EXTENSION_CONTENT_TYPES: Record<string, UploadContentType> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  avi: 'video/x-msvideo',
};

/** Declared browser MIME types we accept for each canonical content type. */
const ACCEPTED_DECLARED_TYPES: Record<UploadContentType, readonly string[]> = {
  'video/mp4': ['', 'video/mp4', 'video/x-m4v'],
  'video/quicktime': ['', 'video/quicktime', 'video/mov'],
  'video/x-msvideo': ['', 'video/x-msvideo', 'video/avi', 'video/msvideo'],
};

function extension(filename: string): string {
  const index = filename.lastIndexOf('.');
  return index < 0 ? '' : filename.slice(index + 1).toLowerCase();
}

function safeFilename(filename: string): boolean {
  return (
    filename.normalize('NFC').trim().length >= 1 &&
    filename.normalize('NFC').trim().length <= 255 &&
    !filename.includes('/') &&
    !filename.includes('\\') &&
    ![...filename].some((character) => {
      const point = character.codePointAt(0)!;
      return point <= 0x1f || point === 0x7f;
    })
  );
}

export function classifyUploadFile(file: File): ValidatedUploadFile | RejectedUploadFile {
  if (!safeFilename(file.name)) {
    return {
      file,
      code: 'INVALID_FILENAME',
      message: 'Use a filename without folders or control characters.',
    };
  }

  const contentType = EXTENSION_CONTENT_TYPES[extension(file.name)];
  const declared = file.type.trim().toLowerCase();
  if (!contentType || !ACCEPTED_DECLARED_TYPES[contentType].includes(declared)) {
    return {
      file,
      code: 'UNSUPPORTED_TYPE',
      message: 'Choose an MP4, MOV, or AVI video.',
    };
  }

  if (file.size < 1 || file.size > VIDEO_MAX_BYTES) {
    return {
      file,
      code: 'FILE_TOO_LARGE',
      message: 'Videos must be 2 GB or smaller.',
    };
  }

  return { file, contentType };
}

export function validateFileSelection(
  files: readonly File[],
  availableSlots: number,
  cap: 'queue' | 'session' = 'queue',
): { accepted: ValidatedUploadFile[]; rejected: RejectedUploadFile[] } {
  const accepted: ValidatedUploadFile[] = [];
  const rejected: RejectedUploadFile[] = [];
  for (const file of files) {
    const result = classifyUploadFile(file);
    if ('code' in result) {
      rejected.push(result);
    } else if (accepted.length >= Math.max(availableSlots, 0)) {
      rejected.push({
        file,
        code: cap === 'session' ? 'SESSION_FULL' : 'QUEUE_FULL',
        message:
          cap === 'session'
            ? 'A browser session can upload 200 files. Remove unfinished files or refresh to start another session.'
            : 'This queue already holds 50 active files.',
      });
    } else {
      accepted.push(result);
    }
  }
  return { accepted, rejected };
}

/**
 * Identity of a file across a page reload. The browser will not hand back the
 * same `File` object, so a reselected file must match on all four fields
 * before its bytes may continue an existing multipart session.
 */
export function fileResumeFingerprint(input: {
  filename: string;
  sizeBytes: number;
  lastModified: number;
  contentType: string;
}): string {
  return [input.filename.normalize('NFC'), input.sizeBytes, input.lastModified, input.contentType].join(
    '\u0000',
  );
}

export function matchReselectedFiles<
  T extends {
    filename: string;
    sizeBytes: number;
    lastModified: number;
    contentType: string;
  },
>(
  records: readonly T[],
  files: readonly File[],
): { matches: Array<{ record: T; file: File }>; unmatched: File[] } {
  const remaining = [...records];
  const matches: Array<{ record: T; file: File }> = [];
  const unmatched: File[] = [];
  for (const file of files) {
    const classified = classifyUploadFile(file);
    if ('code' in classified) {
      unmatched.push(file);
      continue;
    }
    const fingerprint = fileResumeFingerprint({
      filename: file.name,
      sizeBytes: file.size,
      lastModified: file.lastModified,
      contentType: classified.contentType,
    });
    const index = remaining.findIndex((record) => fileResumeFingerprint(record) === fingerprint);
    if (index < 0) unmatched.push(file);
    else matches.push({ record: remaining.splice(index, 1)[0]!, file });
  }
  return { matches, unmatched };
}
