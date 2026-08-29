import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { UploadQueueApi, UploadQueueViewEntry } from '../../../../../hooks/useUploadQueue';
import { ContentStudio } from '../index';

const mockUseUploadQueueContext = jest.fn();
const mockUseChannelSelection = jest.fn();

jest.mock('../../../../../contexts/UploadQueueContext', () => ({
  useUploadQueueContext: () => mockUseUploadQueueContext(),
}));

jest.mock('../../../../../contexts/ChannelSelectionContext', () => ({
  useChannelSelection: () => mockUseChannelSelection(),
}));

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
    sizeBytes: 12_000_000,
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

function queue(entries: UploadQueueViewEntry[]): UploadQueueApi {
  return {
    entries,
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
  } as unknown as UploadQueueApi;
}

function renderStudio(entries: UploadQueueViewEntry[]) {
  mockUseUploadQueueContext.mockReturnValue(queue(entries));
  return render(
    <MemoryRouter>
      <ContentStudio />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  // CRA resets every mock between tests, including the shared `matchMedia`
  // stub — framer-motion reads it on first mount, so put it back.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
  mockUseChannelSelection.mockReturnValue({
    selectedChannelId: '7',
    channels: [{ id: 7, name: 'Studio' }],
  });
});

describe('ContentStudio', () => {
  it('offers a drop zone, not a dashboard, when there is nothing to show', () => {
    renderStudio([]);

    expect(screen.getByRole('heading', { name: 'Content Studio' })).toBeInTheDocument();
    expect(screen.getByText('Drop videos here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'or browse' })).toBeInTheDocument();
    expect(
      screen.getByText('MP4, MOV or AVI · up to 2 GB each · up to 50 at a time'),
    ).toBeInTheDocument();
    // No queue means no counts and no progress line.
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('names the phase each file is in, in the creator\u2019s words', () => {
    renderStudio([
      entry({ localId: 'a', filename: 'a.mp4', status: 'uploading', progress: 42 }),
      entry({
        localId: 'b',
        filename: 'b.mp4',
        status: 'ready',
        progress: 100,
        videoId: 9,
        videoStatus: 'processing',
        renditions: [{ quality: '720p', state: 'in_progress' }],
      }),
      entry({
        localId: 'c',
        filename: 'c.mp4',
        status: 'ready',
        progress: 100,
        videoId: 10,
        videoStatus: 'processed',
      }),
      entry({
        localId: 'd',
        filename: 'd.mp4',
        status: 'failed',
        progress: 8,
        errorMessage: 'network gave up',
      }),
    ]);

    // Label and percentage are separate nodes (the % must not re-key the cross-fade).
    expect(screen.getByTitle('Uploading 42%')).toHaveTextContent('Uploading');
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('Processing · transcoding 720p')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Failed · network gave up')).toBeInTheDocument();

    expect(screen.getByText('a.mp4')).toBeInTheDocument();
    expect(screen.getByText('d.mp4')).toBeInTheDocument();
  });

  it('summarises the queue on one line and keeps a drop target at the foot of the list', () => {
    renderStudio([
      entry({ localId: 'a', status: 'uploading', progress: 50 }),
      entry({ localId: 'b', status: 'uploaded', progress: 100 }),
      entry({
        localId: 'c',
        status: 'ready',
        progress: 100,
        videoId: 9,
        videoStatus: 'processed',
      }),
    ]);

    expect(screen.getByText('3 files')).toBeInTheDocument();
    expect(screen.getByText('1 uploading')).toBeInTheDocument();
    expect(screen.getByText('1 processing')).toBeInTheDocument();
    expect(screen.getByText('1 ready')).toBeInTheDocument();
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();

    expect(screen.getByRole('progressbar', { name: 'Overall transfer' })).toHaveAttribute(
      'aria-valuenow',
      '83',
    );
    expect(screen.getByRole('button', { name: 'Drop more videos here' })).toBeInTheDocument();
    expect(screen.queryByText('Drop videos here')).not.toBeInTheDocument();
  });

  it('says so, rather than drawing a bar, once every byte is in', () => {
    renderStudio([
      entry({ localId: 'a', status: 'ready', progress: 100, videoId: 9, videoStatus: 'processed' }),
    ]);

    expect(screen.getByText('All transfers complete')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Overall transfer' })).not.toBeInTheDocument();
  });

  it('shows Pause only while something is actually uploading', () => {
    renderStudio([entry({ status: 'uploading', progress: 12 })]);
    expect(screen.getByRole('button', { name: 'Pause uploads' })).toBeInTheDocument();
  });

  it('hides Pause when the transfer is done', () => {
    renderStudio([
      entry({ status: 'ready', progress: 100, videoId: 9, videoStatus: 'processed' }),
    ]);
    expect(screen.queryByRole('button', { name: 'Pause uploads' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resume uploads' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add videos' })).toBeInTheDocument();
  });

  it('hides Pause when the queue is empty', () => {
    renderStudio([]);
    expect(screen.queryByRole('button', { name: 'Pause uploads' })).not.toBeInTheDocument();
  });
});
