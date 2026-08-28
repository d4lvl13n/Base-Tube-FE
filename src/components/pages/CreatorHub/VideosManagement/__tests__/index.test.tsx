import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UploadQueueApi, UploadQueueViewEntry } from '../../../../../hooks/useUploadQueue';
import type { Video } from '../../../../../types/video';
import VideosManagement from '../index';

const mockGetChannelVideos = jest.fn();
const mockUseChannelSelection = jest.fn();
const mockUseUploadQueueContext = jest.fn();
const mockUseVideoProcessing = jest.fn();

jest.mock('../../../../../api/channel', () => ({
  getChannelVideos: (...args: unknown[]) => mockGetChannelVideos(...args),
}));

jest.mock('../../../../../api/video', () => ({
  updateVideo: jest.fn(),
  deleteVideo: jest.fn(),
  retryVideoProcessing: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../../../../contexts/ChannelSelectionContext', () => ({
  useChannelSelection: () => mockUseChannelSelection(),
}));

jest.mock('../../../../../contexts/UploadQueueContext', () => ({
  useUploadQueueContext: () => mockUseUploadQueueContext(),
}));

jest.mock('../../../../../hooks/useVideoProcessing', () => ({
  useVideoProcessing: (ids: number[]) => mockUseVideoProcessing(ids),
}));

function video(overrides: Partial<Video> = {}): Video {
  return {
    id: 1,
    channel_id: 7,
    title: 'Clip one',
    description: 'A clip',
    duration: 90,
    views_count: 0,
    likes_count: 0,
    likes: 0,
    views: 0,
    dislikes: 0,
    is_public: true,
    is_featured: false,
    trending_score: 0,
    is_nft_content: false,
    createdAt: '2026-08-28T10:00:00.000Z',
    updatedAt: '2026-08-28T10:00:00.000Z',
    time_category: 'today',
    status: 'processed',
    ...overrides,
  } as Video;
}

function queueEntry(overrides: Partial<UploadQueueViewEntry> = {}): UploadQueueViewEntry {
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
    status: 'processing',
    progress: 100,
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

function renderManagement(search = '') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/creator-hub/videos${search}`]}>
        <VideosManagement />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** The row the highlight lit up, if any. */
function highlightedRow(): HTMLElement | null {
  return document.querySelector('[data-highlighted="true"]');
}

beforeEach(() => {
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
    channels: [{ id: 7, name: 'Test channel' }],
    selectedChannelId: '7',
    selectedChannel: { id: 7, name: 'Test channel' },
    isLoading: false,
  });
  mockUseUploadQueueContext.mockReturnValue({ entries: [] } as unknown as UploadQueueApi);
  mockUseVideoProcessing.mockReturnValue({ processingVideos: {} });
  mockGetChannelVideos.mockResolvedValue({
    data: [video()],
    pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
  });
});

describe('VideosManagement failed videos', () => {
  it('asks the progress poll about failed videos, not only pending ones', async () => {
    mockGetChannelVideos.mockResolvedValue({
      data: [
        video({ id: 1, title: 'Ready clip', status: 'processed' }),
        video({ id: 2, title: 'Broken clip', status: 'failed' }),
        video({ id: 3, title: 'Working clip', status: 'processing' }),
      ],
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
    });

    renderManagement();

    await waitFor(() => expect(mockUseVideoProcessing).toHaveBeenCalledWith([2, 3]));
  });

  it('shows the failure and its Retry control before the poll has answered', async () => {
    mockGetChannelVideos.mockResolvedValue({
      data: [video({ id: 2, title: 'Broken clip', status: 'failed' })],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    renderManagement();

    expect(await screen.findByText('Broken clip')).toBeInTheDocument();
    expect(screen.getByText(/^Failed ·/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry processing' })).toBeInTheDocument();
  });

  it("prefers the poll's own row, with the transcoder's reason, once it lands", async () => {
    mockGetChannelVideos.mockResolvedValue({
      data: [video({ id: 2, title: 'Broken clip', status: 'failed' })],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    mockUseVideoProcessing.mockReturnValue({
      processingVideos: {
        2: { videoId: 2, status: 'failed', renditions: [], error: { message: 'no audio stream' } },
      },
    });

    renderManagement();

    expect(await screen.findByText('Failed · no audio stream')).toBeInTheDocument();
  });
});

describe('VideosManagement ?highlight=', () => {
  it('lights the row whose video id is in the URL', async () => {
    mockGetChannelVideos.mockResolvedValue({
      data: [video({ id: 1, title: 'Clip one' }), video({ id: 42, title: 'The new one' })],
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });

    renderManagement('?highlight=42');

    await screen.findByText('The new one');
    await waitFor(() => expect(highlightedRow()).toHaveTextContent('The new one'));
  });

  // The upload page hands over before the Video row exists, so the id in the
  // URL is the upload's. The API never returns it — the queue is the only
  // thing that knows which video that upload became.
  it('resolves an upload id through the queue', async () => {
    mockGetChannelVideos.mockResolvedValue({
      data: [video({ id: 1, title: 'Clip one' }), video({ id: 42, title: 'The new one' })],
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
    mockUseUploadQueueContext.mockReturnValue({
      entries: [queueEntry({ uploadId: 'upload-1', videoId: 42 })],
    } as unknown as UploadQueueApi);

    renderManagement('?highlight=upload-1');

    await screen.findByText('The new one');
    await waitFor(() => expect(highlightedRow()).toHaveTextContent('The new one'));
  });

  it('lights nothing while the upload has not produced its video yet', async () => {
    mockUseUploadQueueContext.mockReturnValue({
      entries: [queueEntry({ uploadId: 'upload-1', videoId: null })],
    } as unknown as UploadQueueApi);

    renderManagement('?highlight=upload-1');

    await screen.findByText('Clip one');
    expect(highlightedRow()).toBeNull();
  });
});
