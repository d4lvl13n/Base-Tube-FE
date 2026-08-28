/**
 * The copy contract.
 *
 * Every branch here exists because a creator once saw the alternative: a bare
 * `UPLOAD_INITIALIZATION_UNKNOWN`, a truncated stack trace, or a "Failed" with
 * nothing after it. The assertions are on the exact sentences, so changing a
 * message is a deliberate act rather than a side effect.
 */
import type { UploadQueueViewEntry } from '../../../hooks/useUploadQueue';
import {
  describeUploadError,
  isReadableServerMessage,
  uploadCopy,
  uploadErrorCopyFor,
} from '../uploadCopy';
import { phaseDetail } from '../uploadPhase';

function entry(overrides: Partial<UploadQueueViewEntry> = {}): UploadQueueViewEntry {
  return {
    localId: 'local-1',
    clientAttemptId: 'attempt-1',
    uploadId: 'upload-1',
    channelId: 7,
    title: 'clip',
    description: null,
    isPublic: false,
    tags: null,
    filename: 'clip.mp4',
    sizeBytes: 1_000_000,
    lastModified: 0,
    contentType: 'video/mp4',
    partSizeBytes: null,
    partCount: null,
    completedParts: [],
    status: 'uploading',
    progress: 0,
    errorCode: null,
    errorMessage: null,
    retryAt: null,
    videoId: null,
    videoStatus: null,
    createdAt: '2026-08-28T10:00:00.000Z',
    updatedAt: '2026-08-28T10:00:00.000Z',
    file: null,
    ...overrides,
  };
}

describe('describeUploadError', () => {
  it.each([
    ['UPLOAD_FILE_TOO_LARGE', 'This file is over the 2 GB limit.'],
    ['PAYLOAD_TOO_LARGE', 'This file is over the 2 GB limit.'],
    ['INVALID_UPLOAD_METADATA', 'We accept MP4, MOV and AVI files.'],
    [
      'MEDIA_VALIDATION_FAILED',
      "This file isn't a video we can play — it may be corrupted or use an unsupported " +
        'format. Try re-exporting it as MP4 (H.264).',
    ],
    ['MEDIA_SIZE_MISMATCH', 'The file changed during upload. Add it again.'],
    [
      'PROCESSING_RETRIES_EXHAUSTED',
      'Processing failed on our side. Retry from Videos Management, or add the file again.',
    ],
    ['UPLOAD_INTAKE_PAUSED', 'Uploads are paused for maintenance — try again shortly.'],
    ['STORAGE_UNAVAILABLE', 'Our storage is busy — retrying automatically.'],
    ['CHANNEL_FORBIDDEN', 'Choose one of your own channels.'],
    [
      'UPLOAD_INITIALIZATION_UNKNOWN',
      "We couldn't confirm this upload started. Remove it and add the file again.",
    ],
    [
      'UPLOAD_ADMISSION_BUSY',
      'Waiting for an upload slot — you can have 8 in flight at once.',
    ],
    [
      'FILE_RESELECT_REQUIRED',
      'Your browser let go of this file when the page reloaded. ' +
        'Choose the same file again to resume — only the missing parts are sent.',
    ],
  ])('%s reads as a sentence a creator can act on', (code, expected) => {
    expect(describeUploadError(code, null)).toBe(expected);
    expect(uploadErrorCopyFor(code)).toBe(expected);
  });

  it('lets a mapped code win over whatever the server said', () => {
    expect(describeUploadError('UPLOAD_FILE_TOO_LARGE', 'declaredSizeBytes exceeds policy')).toBe(
      uploadCopy.fileTooLarge,
    );
  });

  it('falls back when the code is unknown and there is nothing readable to show', () => {
    expect(describeUploadError('WHAT_IS_THIS', null)).toBe(uploadCopy.unknownFailure);
    expect(describeUploadError(null, null)).toBe(uploadCopy.unknownFailure);
    expect(describeUploadError(undefined, '   ')).toBe(uploadCopy.unknownFailure);
  });

  it('uses the server message for an unknown code when it reads like a sentence', () => {
    expect(describeUploadError('BRAND_NEW_CODE', 'Your channel is suspended.')).toBe(
      'Your channel is suspended.',
    );
    // Trimmed, because whitespace is not the creator's problem.
    expect(describeUploadError(null, '  Your channel is suspended.  ')).toBe(
      'Your channel is suspended.',
    );
  });

  it('never shows the copy of a code that is not in the map', () => {
    expect(uploadErrorCopyFor('WHAT_IS_THIS')).toBeNull();
    expect(uploadErrorCopyFor(null)).toBeNull();
  });

  it('never leaks a code, a stack, or a payload as a message', () => {
    const debris = [
      'UPLOAD_STATE_INVALID',
      '{"error":{"code":"MEDIA_VALIDATION_FAILED"}}',
      'TypeError: cannot read x\n    at upload (upload-transfer.ts:120:5)',
      'Request failed with status code 500',
      `A${'a'.repeat(200)}`,
    ];
    for (const message of debris) {
      expect(isReadableServerMessage(message)).toBe(false);
      expect(describeUploadError('BRAND_NEW_CODE', message)).toBe(uploadCopy.unknownFailure);
    }
  });

  it('accepts a server sentence up to 160 characters and rejects the one after it', () => {
    const atLimit = `${'a'.repeat(159)}.`;
    expect(atLimit).toHaveLength(160);
    expect(isReadableServerMessage(atLimit)).toBe(true);
    expect(isReadableServerMessage(`${atLimit}.`)).toBe(false);
  });
});

/** The two sentences that earn their length by explaining a recovery. */
const LONG_ON_PURPOSE = ['reselectRequired', 'unplayableFile'];

describe('upload copy style', () => {
  it('is sentence case, without codes, exclamation marks or emoji', () => {
    for (const sentence of Object.values(uploadCopy)) {
      expect(sentence).not.toMatch(/!/);
      // No SCREAMING_SNAKE codes anywhere in the visible words.
      expect(sentence).not.toMatch(/\b[A-Z][A-Z0-9]*(_[A-Z0-9]+)+\b/);
      // Printable ASCII plus the typographic punctuation we allow — anything
      // else (an emoji, a stray control character) fails here.
      expect(sentence).toMatch(/^[\x20-\x7E\u2014\u2019\u2026]*$/);
    }
  });

  it('fits in a queue row: 120 characters, bar the two recovery sentences', () => {
    const tooLong = Object.entries(uploadCopy)
      .filter(([key]) => !LONG_ON_PURPOSE.includes(key))
      .filter(([, sentence]) => sentence.length > 120)
      .map(([key]) => key);
    expect(tooLong).toEqual([]);
  });
});

describe('phaseDetail speaks the copy map', () => {
  it('explains a reload-dropped file instead of saying "reselect"', () => {
    expect(phaseDetail(entry({ status: 'reselect_required' }))).toBe(uploadCopy.reselectRequired);
  });

  it('says why a retry is waiting, and never "add the file again" mid-retry', () => {
    expect(phaseDetail(entry({ status: 'retry_wait', progress: 40 }))).toBe(uploadCopy.retryWait);
    expect(
      phaseDetail(entry({ status: 'retry_wait', errorCode: 'UPLOAD_ADMISSION_BUSY' })),
    ).toBe(uploadCopy.admissionBusy);
    expect(phaseDetail(entry({ status: 'retry_wait', errorCode: 'STORAGE_UNAVAILABLE' }))).toBe(
      uploadCopy.storageBusy,
    );
    // An unrecognised cause still must not tell the creator to do anything.
    expect(
      phaseDetail(entry({ status: 'retry_wait', errorCode: 'NEW_CODE', errorMessage: 'boom' })),
    ).toBe(uploadCopy.retryWait);
  });

  it('tells a held upload to be removed rather than retried', () => {
    expect(
      phaseDetail(entry({ status: 'held', errorCode: 'UPLOAD_INITIALIZATION_UNKNOWN' })),
    ).toBe(uploadCopy.unconfirmedStart);
  });

  it('points a failed transcode at Videos Management', () => {
    expect(
      phaseDetail(entry({ status: 'ready', progress: 100, videoId: 9, videoStatus: 'failed' })),
    ).toBe(uploadCopy.processingFailed);
  });

  it('translates a failed transfer, code and all', () => {
    expect(
      phaseDetail(
        entry({ status: 'failed', errorCode: 'MEDIA_VALIDATION_FAILED', errorMessage: 'ffprobe: 1' }),
      ),
    ).toBe(uploadCopy.unplayableFile);
    expect(phaseDetail(entry({ status: 'failed', errorCode: 'UPLOAD_STATE_INVALID' }))).toBe(
      uploadCopy.unknownFailure,
    );
  });

  it('says what cancelling left behind', () => {
    expect(phaseDetail(entry({ status: 'aborted' }))).toBe(uploadCopy.cancelled);
  });
});
