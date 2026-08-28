import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { UploadQueueApi, UploadQueueViewEntry } from '../../../hooks/useUploadQueue';
import UploadQueuePanel, { IDLE_COLLAPSE_MS } from '../UploadQueuePanel';
import { uploadCopy } from '../uploadCopy';

function queue(overrides: Partial<UploadQueueApi> = {}): UploadQueueApi {
  return {
    entries: [],
    paused: false,
    hydrated: true,
    persistenceError: null,
    selectionNotice: null,
    actionError: null,
    activeCount: 0,
    remainingSessionSlots: 50,
    setPaused: jest.fn(),
    enqueueFiles: jest.fn(),
    reselectFiles: jest.fn(),
    updateMetadata: jest.fn(),
    flushMetadata: jest.fn(),
    setPendingThumbnail: jest.fn(),
    abortEntry: jest.fn(),
    retryEntry: jest.fn(),
    replaceAttempt: jest.fn(),
    removeEntry: jest.fn(),
    dismissSelectionNotice: jest.fn(),
    clearFinished: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as UploadQueueApi;
}

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
    sizeBytes: 10,
    lastModified: 0,
    contentType: 'video/mp4',
    partSizeBytes: null,
    partCount: null,
    completedParts: [],
    status: 'uploading',
    progress: 20,
    errorCode: null,
    errorMessage: null,
    retryAt: null,
    videoId: null,
    videoStatus: null,
    createdAt: '2026-08-28T10:00:00.000Z',
    updatedAt: '2026-08-28T10:00:00.000Z',
    file: null,
    ...overrides,
  } as UploadQueueViewEntry;
}

/** A row with nothing left to do. */
const readyEntry = (localId: string) =>
  entry({
    localId,
    uploadId: localId,
    filename: `${localId}.mp4`,
    status: 'ready',
    progress: 100,
    videoId: 5,
    videoStatus: 'processed',
  });
const failedEntry = (localId: string) =>
  entry({
    localId,
    uploadId: localId,
    filename: `${localId}.mp4`,
    status: 'failed',
    errorCode: 'UPLOAD_FAILED',
  });
const workingEntry = (localId: string) =>
  entry({ localId, uploadId: localId, filename: `${localId}.mp4`, status: 'uploading' });

describe('UploadQueuePanel action errors', () => {
  // The queue keeps the server's own words for the console; the panel is the
  // creator's side of that line and only ever shows the mapped sentence.
  it('renders the mapped copy for a failed cancel, not the server debris', () => {
    render(
      <UploadQueuePanel
        queue={queue({
          actionError: {
            code: 'UPLOAD_ABORT_FAILED',
            message: '{"error":{"code":"ABORT_500","stack":"at abort (upload.ts:12:3)"}}',
          },
        })}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(uploadCopy.abortFailed);
    expect(screen.queryByText(/ABORT_500/)).not.toBeInTheDocument();
  });

  it('falls back to a readable server sentence when the code is new to us', () => {
    render(
      <UploadQueuePanel
        queue={queue({
          actionError: { code: 'SOMETHING_NEW', message: 'The upload service is restarting.' },
        })}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('The upload service is restarting.');
  });
});

describe('UploadQueuePanel closing', () => {
  // The panel used to be a fixture: an upload that failed sat over the page
  // until the tab was closed. Closing it must not touch the queue itself.
  it('hides on the close button and comes back on the next enqueue', () => {
    const { rerender } = render(<UploadQueuePanel queue={queue({ entries: [failedEntry('a')] })} />);

    expect(screen.getByLabelText('Upload queue')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close upload queue'));
    expect(screen.queryByLabelText('Upload queue')).not.toBeInTheDocument();

    // A new file joins the queue: that is news the creator did not dismiss.
    rerender(
      <UploadQueuePanel queue={queue({ entries: [failedEntry('a'), workingEntry('b')] })} />,
    );
    expect(screen.getByLabelText('Upload queue')).toBeInTheDocument();
  });

  it('stays closed while the rows it dismissed merely finish', () => {
    const { rerender } = render(
      <UploadQueuePanel queue={queue({ entries: [workingEntry('a')] })} />,
    );

    fireEvent.click(screen.getByLabelText('Close upload queue'));
    expect(screen.queryByLabelText('Upload queue')).not.toBeInTheDocument();

    rerender(<UploadQueuePanel queue={queue({ entries: [readyEntry('a')] })} />);
    expect(screen.queryByLabelText('Upload queue')).not.toBeInTheDocument();
  });

  it('closes on Escape when the panel has focus', () => {
    render(<UploadQueuePanel queue={queue({ entries: [failedEntry('a')] })} />);

    fireEvent.keyDown(screen.getByLabelText('Upload queue'), { key: 'Escape' });
    expect(screen.queryByLabelText('Upload queue')).not.toBeInTheDocument();
  });
});

describe('UploadQueuePanel clear finished', () => {
  it('offers the sweep only when something has finished', () => {
    const { rerender } = render(
      <UploadQueuePanel queue={queue({ entries: [workingEntry('a')] })} />,
    );
    expect(screen.queryByRole('button', { name: 'Clear finished' })).not.toBeInTheDocument();

    rerender(<UploadQueuePanel queue={queue({ entries: [workingEntry('a'), readyEntry('b')] })} />);
    expect(screen.getByRole('button', { name: 'Clear finished' })).toBeInTheDocument();
  });

  it('asks the queue to drop the finished rows', () => {
    const clearFinished = jest.fn().mockResolvedValue(undefined);
    render(
      <UploadQueuePanel
        queue={queue({ entries: [workingEntry('a'), readyEntry('b'), failedEntry('c')], clearFinished })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear finished' }));
    expect(clearFinished).toHaveBeenCalledTimes(1);
  });
});

describe('UploadQueuePanel selection notice', () => {
  it('drops the notice on any interaction with the panel', () => {
    const dismissSelectionNotice = jest.fn();
    render(
      <UploadQueuePanel
        queue={queue({
          entries: [workingEntry('a')],
          selectionNotice: '2 files added to the upload queue.',
          dismissSelectionNotice,
        })}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('2 files added to the upload queue.');
    fireEvent.pointerDown(screen.getByLabelText('Upload queue'));
    expect(dismissSelectionNotice).toHaveBeenCalled();
  });
});

describe('UploadQueuePanel idle collapse', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  // Everything is done: fold to the header, which still carries the summary.
  // Hiding it would take the "3 ready" line away with it.
  it('collapses to its header once every row is terminal and untouched', () => {
    render(<UploadQueuePanel queue={queue({ entries: [readyEntry('a'), failedEntry('b')] })} />);

    expect(screen.getByText('a.mp4', { selector: 'p' })).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(IDLE_COLLAPSE_MS + 1);
    });

    expect(screen.getByLabelText('Upload queue')).toBeInTheDocument();
    expect(screen.getByLabelText('Expand upload queue')).toBeInTheDocument();
    expect(screen.queryByText('a.mp4', { selector: 'p' })).not.toBeInTheDocument();
  });

  it('leaves a working queue expanded', () => {
    render(<UploadQueuePanel queue={queue({ entries: [workingEntry('a'), readyEntry('b')] })} />);

    act(() => {
      jest.advanceTimersByTime(IDLE_COLLAPSE_MS + 1);
    });

    expect(screen.getByLabelText('Collapse upload queue')).toBeInTheDocument();
  });
});
