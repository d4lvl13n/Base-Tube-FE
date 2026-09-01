import {
  attachReselectedFiles,
  createQueueEntry,
  filenameStem,
  hydrateUploadQueue,
  persistedRecord,
  replaceQueueAttempt,
  selectQueueCandidates,
} from '../upload-queue-store';
import { classifyUploadFile } from '../validation';
import { fakeFile, queueEntry } from './helpers';

function validated(name = 'sunset.mp4', size = 1_000) {
  const result = classifyUploadFile(fakeFile(size, name));
  if ('code' in result) throw new Error(`fixture rejected: ${result.code}`);
  return result;
}

describe('queue entry creation', () => {
  it('seeds the draft title with the filename stem', () => {
    const entry = createQueueEntry(7, validated('Sunset over Palma.mp4'), () => 'attempt-1');
    expect(entry).toMatchObject({
      localId: 'attempt-1',
      clientAttemptId: 'attempt-1',
      channelId: 7,
      title: 'Sunset over Palma',
      uploadId: null,
      status: 'queued',
      isPublic: false,
    });
    expect(filenameStem('.hidden')).toBe('.hidden');
  });

  it('drops the file handle when persisting', () => {
    const entry = createQueueEntry(7, validated(), () => 'attempt-1');
    expect('file' in persistedRecord(entry)).toBe(false);
  });

  // `pendingPatch` records the fields of the last un-flushed metadata PATCH.
  // It must survive the persist → hydrate round trip, or a reload during the
  // debounce silently drops the edit (visibility above all).
  it('round-trips the pendingPatch marker through persist and hydrate', () => {
    const entry = {
      ...createQueueEntry(7, validated(), () => 'attempt-1'),
      pendingPatch: { isPublic: false, title: 'Unsaved title' },
    };

    const record = persistedRecord(entry);
    expect(record.pendingPatch).toEqual({ isPublic: false, title: 'Unsaved title' });

    const [hydrated] = hydrateUploadQueue([record]);
    expect(hydrated!.pendingPatch).toEqual({ isPublic: false, title: 'Unsaved title' });
  });

  it('leaves pendingPatch absent when nothing is unacknowledged', () => {
    const entry = createQueueEntry(7, validated(), () => 'attempt-1');
    const record = persistedRecord(entry);
    expect(record.pendingPatch).toBeUndefined();

    // An acknowledged patch is persisted as an explicit null; both spellings
    // hydrate to "nothing pending".
    const [absent] = hydrateUploadQueue([record]);
    expect(absent!.pendingPatch).toBeUndefined();
    const [cleared] = hydrateUploadQueue([{ ...record, pendingPatch: null }]);
    expect(cleared!.pendingPatch).toBeNull();
  });
});

describe('reload hydration', () => {
  it('requires reselect for anything still moving bytes', () => {
    const record = persistedRecord(createQueueEntry(7, validated(), () => 'attempt-1'));
    expect(hydrateUploadQueue([record])[0]).toMatchObject({
      status: 'reselect_required',
      file: null,
    });
  });

  it('resumes completion without the file when every byte is already up', () => {
    const record = persistedRecord(createQueueEntry(7, validated(), () => 'attempt-1'));
    const [hydrated] = hydrateUploadQueue([
      { ...record, uploadId: 'upload-1', status: 'uploading', progress: 100 },
    ]);
    expect(hydrated).toMatchObject({ status: 'uploaded', file: null, progress: 100 });
  });

  it('leaves terminal rows alone', () => {
    const record = persistedRecord(createQueueEntry(7, validated(), () => 'attempt-1'));
    expect(hydrateUploadQueue([{ ...record, status: 'failed' }])[0]!.status).toBe('failed');
  });
});

describe('reselect matching', () => {
  it('attaches only files that match filename, size, mtime and type', () => {
    const entry = { ...createQueueEntry(7, validated('clip.mp4', 500), () => 'a1') };
    const waiting = { ...entry, file: null, status: 'reselect_required' as const };
    const wrongSize = fakeFile(999, 'clip.mp4');
    const right = fakeFile(500, 'clip.mp4');

    const missed = attachReselectedFiles([waiting], [wrongSize]);
    expect(missed.attached).toBe(0);
    expect(missed.unmatched).toHaveLength(1);

    const hit = attachReselectedFiles([waiting], [right]);
    expect(hit.attached).toBe(1);
    expect(hit.entries[0]).toMatchObject({ status: 'queued', errorCode: null });
  });
});

describe('replaceQueueAttempt', () => {
  it('starts a brand new server attempt and forgets the old row', () => {
    const entry = queueEntry({
      uploadId: 'upload-1',
      status: 'held',
      progress: 60,
      file: fakeFile(300),
    });
    expect(replaceQueueAttempt(entry, () => 'attempt-2')).toMatchObject({
      localId: 'attempt-2',
      clientAttemptId: 'attempt-2',
      uploadId: null,
      completedParts: [],
      progress: 0,
      status: 'queued',
    });
  });

  it('asks for the file back when the queue no longer holds it', () => {
    const entry = queueEntry({ uploadId: 'upload-1', status: 'failed', file: null });
    expect(replaceQueueAttempt(entry, () => 'attempt-2').status).toBe('reselect_required');
  });
});

describe('selectQueueCandidates', () => {
  const file = fakeFile(300);
  const now = 1_000_000;

  it('starts nothing while paused or while admission is backing off', () => {
    const entries = [queueEntry({ localId: 'a', file })];
    expect(selectQueueCandidates(entries, new Set(), true, now)).toEqual([]);
    expect(selectQueueCandidates(entries, new Set(), false, now, 4, now + 5_000)).toEqual([]);
  });

  it('respects the active-file limit', () => {
    const entries = [1, 2, 3, 4, 5, 6].map((n) => queueEntry({ localId: `a${n}`, file }));
    expect(selectQueueCandidates(entries, new Set(['a1']), false, now, 4)).toHaveLength(3);
  });

  it('prefers resuming an existing server attempt over starting a new one', () => {
    const entries = [
      queueEntry({ localId: 'fresh', file }),
      queueEntry({ localId: 'resume', uploadId: 'upload-1', status: 'retry_wait', retryAt: now - 1, file }),
    ];
    expect(selectQueueCandidates(entries, new Set(), false, now, 1).map((e) => e.localId)).toEqual([
      'resume',
    ]);
  });

  it('will not open new attempts past the in-flight cap even with free slots', () => {
    const inFlight = [1, 2, 3, 4].map((n) =>
      queueEntry({ localId: `busy${n}`, uploadId: `upload-${n}`, status: 'uploading', file }),
    );
    const entries = [...inFlight, queueEntry({ localId: 'fresh', file })];
    // The four in-flight rows are not active locally (e.g. after a reload),
    // but they still occupy the server-side admission budget.
    expect(selectQueueCandidates(entries, new Set(), false, now, 4)).toHaveLength(0);
  });

  it('holds back retry_wait rows until their retryAt has passed', () => {
    const entries = [
      queueEntry({ localId: 'later', status: 'retry_wait', retryAt: now + 10_000, file }),
    ];
    expect(selectQueueCandidates(entries, new Set(), false, now)).toEqual([]);
    expect(selectQueueCandidates(entries, new Set(), false, now + 20_000)).toHaveLength(1);
  });

  // A cancel is a round-trip. Until the DELETE answers, the row still reads
  // `queued`/`retry_wait`, and starting it there resumes the upload the
  // creator just stopped.
  it('never starts a row whose cancel is still in flight', () => {
    const entries = [
      queueEntry({ localId: 'cancelling', status: 'retry_wait', retryAt: now - 1, file }),
      queueEntry({ localId: 'other', file }),
    ];

    expect(selectQueueCandidates(entries, new Set(), false, now).map((e) => e.localId)).toEqual([
      'cancelling',
      'other',
    ]);
    expect(
      selectQueueCandidates(entries, new Set(), false, now, 4, null, new Set(['cancelling'])).map(
        (e) => e.localId,
      ),
    ).toEqual(['other']);
  });

  it('picks up completion-only rows that have no file', () => {
    const entries = [
      queueEntry({
        localId: 'completion',
        uploadId: 'upload-1',
        status: 'uploaded',
        progress: 100,
        retryAt: now - 1,
        file: null,
      }),
    ];
    expect(selectQueueCandidates(entries, new Set(), false, now)).toHaveLength(1);
  });
});
