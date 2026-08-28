import type { UploadQueueViewEntry } from '../../../../../hooks/useUploadQueue';
import { phaseDetail, phaseLabel, uploadPhase } from '../../../../upload/uploadPhase';
import { summarizeEntries } from '../summary';

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

describe('summarizeEntries', () => {
  it('counts each phase separately instead of lumping them into "uploaded"', () => {
    const summary = summarizeEntries([
      entry({ localId: 'a', status: 'uploading', progress: 40 }),
      entry({ localId: 'b', status: 'queued', progress: 0 }),
      // Bytes are in, the video row does not exist yet.
      entry({ localId: 'c', status: 'uploaded', progress: 100 }),
      // Bytes are in, the transcoder is working.
      entry({ localId: 'd', status: 'ready', progress: 100, videoId: 9, videoStatus: 'processing' }),
      entry({ localId: 'e', status: 'ready', progress: 100, videoId: 10, videoStatus: 'processed' }),
      entry({ localId: 'f', status: 'failed', progress: 12, errorMessage: 'network gave up' }),
      entry({ localId: 'g', status: 'ready', progress: 100, videoId: 11, videoStatus: 'failed' }),
    ]);

    expect(summary).toEqual({
      total: 7,
      uploading: 2,
      processing: 2,
      ready: 1,
      failed: 2,
      transferPercent: Math.round((40 + 0 + 100 + 100 + 100 + 12 + 100) / 7),
      transferComplete: false,
    });
  });

  // The old readout said "Progress 100%" while nine processed videos still
  // read as "processing" — Transfer talks about bytes and nothing else.
  it('reports the transfer as complete once no entry has bytes left to send', () => {
    const summary = summarizeEntries([
      entry({ localId: 'a', status: 'uploaded', progress: 100 }),
      entry({ localId: 'b', status: 'ready', progress: 100, videoId: 9, videoStatus: 'processed' }),
    ]);
    expect(summary.transferComplete).toBe(true);
    expect(summary.transferPercent).toBe(100);
    expect(summary.uploading).toBe(0);
    expect(summary.processing).toBe(1);
    expect(summary.ready).toBe(1);
  });

  it('is empty-safe', () => {
    expect(summarizeEntries([])).toEqual({
      total: 0,
      uploading: 0,
      processing: 0,
      ready: 0,
      failed: 0,
      transferPercent: 0,
      transferComplete: false,
    });
  });
});

describe('phase vocabulary', () => {
  it('shows a percentage only while bytes are moving', () => {
    const uploading = entry({ status: 'uploading', progress: 42 });
    expect(uploadPhase(uploading)).toBe('uploading');
    expect(phaseLabel(uploading)).toBe('Uploading');
    expect(phaseDetail(uploading)).toBe('42%');

    const waiting = entry({ status: 'uploaded', progress: 100 });
    expect(phaseLabel(waiting)).toBe('Uploaded');
    expect(phaseDetail(waiting)).toBe('waiting for processing');
    expect(phaseDetail(waiting)).not.toMatch(/%/);
  });

  it('names the rendition being transcoded, and says "inspecting" before there is one', () => {
    const inspecting = entry({
      status: 'ready',
      progress: 100,
      videoId: 9,
      videoStatus: 'processing',
    });
    expect(phaseLabel(inspecting)).toBe('Processing');
    expect(phaseDetail(inspecting)).toBe('inspecting');

    const transcoding = { ...inspecting, renditions: [
      { quality: '480p', state: 'verified' },
      { quality: '720p', state: 'in_progress' },
    ] };
    expect(phaseDetail(transcoding)).toBe('transcoding 720p');
    expect(phaseDetail(transcoding)).not.toMatch(/%/);
  });

  it('calls a processed video Ready and a failed one Failed', () => {
    const ready = entry({ status: 'ready', progress: 100, videoId: 9, videoStatus: 'processed' });
    expect(uploadPhase(ready)).toBe('ready');
    expect(phaseLabel(ready)).toBe('Ready');

    const failed = entry({ status: 'ready', progress: 100, videoId: 9, videoStatus: 'failed' });
    expect(uploadPhase(failed)).toBe('failed');
    expect(phaseLabel(failed)).toBe('Failed');
    expect(phaseDetail(failed)).toContain('processing failed');
  });
});
