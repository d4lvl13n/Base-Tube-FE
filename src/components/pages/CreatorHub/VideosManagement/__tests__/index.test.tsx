import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import type { UploadQueueApi, UploadQueueViewEntry } from '../../../../../hooks/useUploadQueue';
import type { Video } from '../../../../../types/video';
import VideosManagement from '../index';

const mockGetChannelVideos = jest.fn();
const mockUpdateVideo = jest.fn();
const mockDeleteVideo = jest.fn();
const mockRetryVideoProcessing = jest.fn();
const mockGetVideoById = jest.fn();
const mockRestart = jest.fn();
const mockUseChannelSelection = jest.fn();
const mockUseUploadQueueContext = jest.fn();
const mockUseVideoProcessing = jest.fn();

jest.mock('../../../../../api/channel', () => ({
  getChannelVideos: (...args: unknown[]) => mockGetChannelVideos(...args),
}));

jest.mock('../../../../../api/video', () => ({
  updateVideo: (...args: unknown[]) => mockUpdateVideo(...args),
  deleteVideo: (...args: unknown[]) => mockDeleteVideo(...args),
  retryVideoProcessing: (...args: unknown[]) => mockRetryVideoProcessing(...args),
  // The edit screen fetches the video's full record on mount.
  getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
}));

// The list writes to a toast on every action; jsdom does not need the widget.
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
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

// A render counter with no production seam: a recent row formats its date
// exactly once per render, so the call count *is* the row render count.
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

/* eslint-disable @typescript-eslint/no-var-requires */
const { toast } = require('react-toastify') as {
  toast: { success: jest.Mock; error: jest.Mock };
};
/* eslint-enable @typescript-eslint/no-var-requires */

/**
 * Two hours ago, always.
 *
 * A fixed date drifts out of the "recent" window a week after it is written,
 * at which point the row prints a calendar date and the render probe above
 * counts nothing. Relative to `now`, it never does.
 */
const twoHoursAgo = () => new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

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
    createdAt: twoHoursAgo(),
    updatedAt: twoHoursAgo(),
    time_category: 'today',
    status: 'processed',
    ...overrides,
  } as Video;
}

function page(videos: Video[], overrides: Record<string, unknown> = {}) {
  return {
    data: videos,
    pagination: { total: videos.length, page: 1, limit: 10, totalPages: 1, ...overrides },
  };
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
    createdAt: twoHoursAgo(),
    updatedAt: twoHoursAgo(),
    file: null,
    ...overrides,
  } as UploadQueueViewEntry;
}

/**
 * Rebuilds the tree on every call.
 *
 * A `rerender` with the identical element object is a React bail-out — the
 * component would never read the queue mock's new answer.
 */
let currentTree: () => React.ReactElement = () => <div />;

function renderManagement(search = '') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  currentTree = () => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/creator-hub/videos${search}`]}>
        <VideosManagement />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(currentTree());
}

/** The row the highlight lit up, if any. */
function highlightedRow(): HTMLElement | null {
  // eslint-disable-next-line testing-library/no-node-access
  return document.querySelector('[data-highlighted="true"]');
}

/** The filters the page asked the API for on its Nth call. */
function apiQuery(callIndex = 0): Record<string, unknown> {
  return mockGetChannelVideos.mock.calls[callIndex][2] as Record<string, unknown>;
}

/** A promise the test resolves when it wants the request to land. */
function deferred<T>() {
  let settle!: (value: T) => void;
  let fail!: (reason: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  return { promise, settle, fail };
}

/** Everything React complained about during the test, for the nesting guard. */
let consoleErrors: string[] = [];
let consoleErrorSpy: jest.SpyInstance;

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
  mockUseVideoProcessing.mockReturnValue({ processingVideos: {}, restart: mockRestart });
  mockRetryVideoProcessing.mockResolvedValue({ success: true });
  mockGetVideoById.mockResolvedValue(video());
  mockUpdateVideo.mockResolvedValue({ success: true, data: video() });
  mockDeleteVideo.mockResolvedValue({ success: true });
  mockGetChannelVideos.mockResolvedValue(page([video()]));

  consoleErrors = [];
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    consoleErrors.push(args.map((arg) => String(arg)).join(' '));
  });
});

/**
 * Invalid DOM nesting fails the test that produced it.
 *
 * React warns once per offending tag pair for the whole process, so this has
 * to be a file-wide guard rather than one assertion in one test: whichever
 * test renders the table first is the one that would see it.
 */
afterEach(() => {
  const nesting = consoleErrors.filter((line) => line.includes('validateDOMNesting'));
  consoleErrorSpy.mockRestore();
  expect(nesting).toEqual([]);
});

describe('VideosManagement failed videos', () => {
  it('asks the progress poll about failed videos, not only pending ones', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Ready clip', status: 'processed' }),
        video({ id: 2, title: 'Broken clip', status: 'failed' }),
        video({ id: 3, title: 'Working clip', status: 'processing' }),
      ]),
    );

    renderManagement();

    await waitFor(() => expect(mockUseVideoProcessing).toHaveBeenCalledWith([2, 3]));
  });

  it('shows the failure and its Retry control before the poll has answered', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Broken clip', status: 'failed' })]));

    renderManagement();

    expect(await screen.findByText('Broken clip')).toBeInTheDocument();
    expect(screen.getByText(/^Failed ·/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry processing' })).toBeInTheDocument();
  });

  it("prefers the poll's own row, with the transcoder's reason, once it lands", async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Broken clip', status: 'failed' })]));
    mockUseVideoProcessing.mockReturnValue({
      processingVideos: {
        2: { videoId: 2, status: 'failed', renditions: [], error: { message: 'no audio stream' } },
      },
      restart: mockRestart,
    });

    renderManagement();

    expect(await screen.findByText('Failed · no audio stream')).toBeInTheDocument();
  });
});

describe('VideosManagement retry', () => {
  // The retry reuses the video id, so both caches of "this one failed" — the
  // list's `status` and the poll's terminal row — have to be dropped, or the
  // row stays red and nothing ever asks about it again.
  it('clears the failed state and restarts the poll on a successful retry', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Broken clip', status: 'failed' })]));

    renderManagement();

    fireEvent.click(await screen.findByRole('button', { name: 'Retry processing' }));

    await waitFor(() => expect(mockRetryVideoProcessing).toHaveBeenCalledWith(2));
    await waitFor(() => expect(mockRestart).toHaveBeenCalledWith([2]));
    // The row is no longer telling the creator it failed…
    await waitFor(() => expect(screen.queryByText(/^Failed ·/)).not.toBeInTheDocument());
    // …and the id is back in the poll set as a pending video.
    await waitFor(() => expect(mockUseVideoProcessing).toHaveBeenLastCalledWith([2]));
  });

  it('leaves the failed state alone when the retry is refused', async () => {
    mockRetryVideoProcessing.mockResolvedValue({ success: false, message: 'nope' });
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Broken clip', status: 'failed' })]));

    renderManagement();

    fireEvent.click(await screen.findByRole('button', { name: 'Retry processing' }));

    await waitFor(() => expect(mockRetryVideoProcessing).toHaveBeenCalledWith(2));
    expect(mockRestart).not.toHaveBeenCalled();
    expect(screen.getByText(/^Failed ·/)).toBeInTheDocument();
  });
});

describe('VideosManagement ?highlight=', () => {
  it('lights the row whose video id is in the URL', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 1, title: 'Clip one' }), video({ id: 42, title: 'The new one' })]),
    );

    renderManagement('?highlight=42');

    await screen.findByText('The new one');
    await waitFor(() => expect(highlightedRow()).toHaveTextContent('The new one'));
  });

  // The upload page hands over before the Video row exists, so the id in the
  // URL is the upload's. The API never returns it — the queue is the only
  // thing that knows which video that upload became.
  it('resolves an upload id through the queue', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 1, title: 'Clip one' }), video({ id: 42, title: 'The new one' })]),
    );
    mockUseUploadQueueContext.mockReturnValue({
      entries: [queueEntry({ uploadId: 'upload-1', videoId: 42 })],
    } as unknown as UploadQueueApi);

    renderManagement('?highlight=upload-1');

    await screen.findByText('The new one');
    await waitFor(() => expect(highlightedRow()).toHaveTextContent('The new one'));
  });

  // The list was fetched before the worker created the video, so the row to
  // highlight is simply not in it until we ask again.
  it('refetches when the queue resolves a video the list has not seen', async () => {
    mockGetChannelVideos
      .mockResolvedValueOnce(page([video({ id: 1, title: 'Clip one' })]))
      .mockResolvedValue(
        page([video({ id: 1, title: 'Clip one' }), video({ id: 42, title: 'The new one' })]),
      );
    mockUseUploadQueueContext.mockReturnValue({
      entries: [queueEntry({ uploadId: 'upload-1', videoId: null })],
    } as unknown as UploadQueueApi);

    const { rerender } = renderManagement('?highlight=upload-1');
    await screen.findByText('Clip one');
    expect(mockGetChannelVideos).toHaveBeenCalledTimes(1);

    // The upload finishes: the queue now knows which video it became.
    mockUseUploadQueueContext.mockReturnValue({
      entries: [queueEntry({ uploadId: 'upload-1', videoId: 42 })],
    } as unknown as UploadQueueApi);
    rerender(currentTree());

    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('The new one')).toBeInTheDocument();
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

describe('VideosManagement DOM correctness', () => {
  // `SortableHeader` used to render its own `<th>` inside the `<th>` the caller
  // had already opened. React warns once per offending tag pair per process,
  // so the guard for it is the file-wide `afterEach` above, not a test here —
  // a test of its own would only ever see the already-warned second time.
  it('gives every sortable column one header cell with a real button', async () => {
    renderManagement();
    await screen.findByText('Clip one');

    const header = screen.getByRole('button', { name: 'Sort by Views' });
    // eslint-disable-next-line testing-library/no-node-access
    const cell = header.closest('th');
    expect(cell).not.toBeNull();
    // eslint-disable-next-line testing-library/no-node-access
    expect(cell?.querySelector('th')).toBeNull();
  });
});

describe('VideosManagement filters', () => {
  // The list is paginated. A filter applied to the page the browser happens to
  // hold would tell a creator with 62 videos that video 40 does not exist.
  it('reads the whole filter state out of the URL and sends it to the server', async () => {
    renderManagement('?q=marrakech&visibility=private&sort=most_viewed');

    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalled());
    expect(apiQuery()).toEqual({ search: 'marrakech', visibility: 'private', sort: 'most_viewed' });
    expect((screen.getByLabelText('Search videos') as HTMLInputElement).value).toBe('marrakech');
    expect(screen.getByRole('button', { name: 'Private' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sends nothing but the default sort when no filter is set', async () => {
    renderManagement();
    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalled());

    expect(apiQuery()).toEqual({ sort: 'newest' });
    expect(mockGetChannelVideos.mock.calls[0][1]).toBe(1);
  });

  it('debounces typing into one request and puts the term in the URL', async () => {
    renderManagement();
    await screen.findByText('Clip one');

    const input = screen.getByLabelText('Search videos');
    fireEvent.change(input, { target: { value: 'mar' } });
    fireEvent.change(input, { target: { value: 'marra' } });
    fireEvent.change(input, { target: { value: 'marrakech' } });

    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));
    expect(apiQuery(1)).toEqual({ search: 'marrakech', sort: 'newest' });
  });

  it('splits the Processing chip into the status parameter, not the visibility one', async () => {
    renderManagement();
    await screen.findByText('Clip one');

    fireEvent.click(screen.getByRole('button', { name: 'Processing' }));

    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));
    expect(apiQuery(1)).toEqual({ status: 'processing', sort: 'newest' });
  });

  // Two filtered lists are two cache entries. If the filters were not in the
  // key, switching to Private would have shown the unfiltered rows.
  it('keys the cache by the filters, so going back is instant and refetches nothing', async () => {
    renderManagement();
    await screen.findByText('Clip one');

    fireEvent.click(screen.getByRole('button', { name: 'Private' }));
    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));
    expect(apiQuery(1)).toMatchObject({ visibility: 'private' });

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await screen.findByText('Clip one');
    expect(mockGetChannelVideos).toHaveBeenCalledTimes(2);
  });

  it('offers a way out when a filter matches nothing', async () => {
    mockGetChannelVideos.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });

    renderManagement('?q=nothing');

    expect(await screen.findByText('Nothing matches')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByText('No videos yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upload your first video' })).toHaveAttribute(
      'href',
      '/creator-hub/content-studio',
    );
  });

  it('counts the channel, not the rows it happens to have loaded', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video()], { total: 62, totalPages: 7 }),
    );

    renderManagement();

    expect(await screen.findByText('· 62')).toBeInTheDocument();
  });
});

describe('VideosManagement visibility switch', () => {
  it('flips before the server answers and announces it once it does', async () => {
    const request = deferred<{ success: boolean }>();
    mockUpdateVideo.mockReturnValue(request.promise);
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: true })]));

    renderManagement();

    const control = await screen.findByRole('switch');
    expect(control).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(control);

    // The creator's own click is the best evidence of what they meant.
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'));
    const sent = mockUpdateVideo.mock.calls[0][1] as FormData;
    expect(mockUpdateVideo.mock.calls[0][0]).toBe('1');
    expect(sent.get('is_public')).toBe('false');

    request.settle({ success: true });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    // Nothing was refetched to report one switch moving.
    expect(mockGetChannelVideos).toHaveBeenCalledTimes(1);
  });

  it('puts the switch back and says why when the server refuses', async () => {
    mockUpdateVideo.mockRejectedValue(new Error('Nope'));
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: true })]));

    renderManagement();

    fireEvent.click(await screen.findByRole('switch'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Nope'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('offers an Undo that flips it straight back', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: true })]));

    renderManagement();
    fireEvent.click(await screen.findByRole('switch'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    // The toast body is a component; render it and press its one button.
    const Body = toast.success.mock.calls[0][0] as React.FC<{ closeToast?: () => void }>;
    const view = render(<Body closeToast={() => undefined} />);
    fireEvent.click(within(view.container).getByRole('button', { name: 'Undo' }));

    await waitFor(() => expect(mockUpdateVideo).toHaveBeenCalledTimes(2));
    expect((mockUpdateVideo.mock.calls[1][1] as FormData).get('is_public')).toBe('true');
  });

  // A video that is still transcoding has nothing to show anyone.
  it('cannot publish a video that is not ready yet', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 3, is_public: false, status: 'processing' })]),
    );

    renderManagement();

    expect(await screen.findByRole('switch')).toBeDisabled();
  });
});

describe('VideosManagement row actions', () => {
  it('opens the watch page in a new tab, and refuses while the video is processing', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Ready clip', status: 'processed' }),
        video({ id: 2, title: 'Working clip', status: 'processing' }),
      ]),
    );

    renderManagement();
    await screen.findByText('Ready clip');

    const watch = screen.getByRole('link', { name: 'Watch Ready clip' });
    expect(watch).toHaveAttribute('href', '/video/1');
    expect(watch).toHaveAttribute('target', '_blank');
    expect(watch).toHaveAttribute('rel', expect.stringContaining('noopener'));

    expect(screen.getByRole('button', { name: 'Watch Working clip' })).toBeDisabled();
  });

  it('copies the public watch URL', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 12 })]));

    renderManagement();
    fireEvent.click(await screen.findByRole('button', { name: 'Copy link' }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/video/12`),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link copied'));
  });

  it('opens the editor from the title as well as from the pencil', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, title: 'Clip one' })]));

    renderManagement();
    fireEvent.click(await screen.findByRole('button', { name: 'Clip one' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Copy link' })).toBeNull());
  });

  // Never `window.confirm`: it blocks the page thread, cannot be read by a
  // screen reader on our terms, and stops the owner's browser automation dead.
  it('asks before deleting, from the overflow menu', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 5, title: 'Clip one' })]));

    renderManagement();
    fireEvent.keyDown(await screen.findByRole('button', { name: 'More actions' }), { key: 'Enter' });

    fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));

    expect(await screen.findByText('Delete Video')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockDeleteVideo).toHaveBeenCalledWith('5'));
    await waitFor(() => expect(screen.queryByText('Clip one')).toBeNull());
  });

  it('invites a description when there is none', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, description: '' })]));

    renderManagement();

    expect(await screen.findByText(/No description/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'add one' })).toBeInTheDocument();
  });
});

describe('VideosManagement bulk actions', () => {
  const twoVideos = () =>
    page([
      video({ id: 1, title: 'Clip one', is_public: false }),
      video({ id: 2, title: 'Clip two', is_public: false }),
    ]);

  async function selectBoth() {
    fireEvent.click(await screen.findByLabelText('Select Clip one'));
    fireEvent.click(screen.getByLabelText('Select Clip two'));
  }

  it('reports a clean run as one sentence', async () => {
    mockGetChannelVideos.mockResolvedValue(twoVideos());

    renderManagement();
    await selectBoth();
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Make public/ }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('2 made public'));
    expect(mockUpdateVideo).toHaveBeenCalledTimes(2);
  });

  // One refusal must not abandon the other one half-way, and it must not be
  // reported as a success either.
  it('says how many of them made it when one fails', async () => {
    mockGetChannelVideos.mockResolvedValue(twoVideos());
    mockUpdateVideo
      .mockResolvedValueOnce({ success: true, data: video() })
      .mockRejectedValueOnce(new Error('boom'));

    renderManagement();
    await selectBoth();
    fireEvent.click(screen.getByRole('button', { name: /Make public/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('1 of 2 updated — 1 failed'));
  });

  it('selects only the rows that are loaded, and says so', async () => {
    mockGetChannelVideos.mockResolvedValue(twoVideos());

    renderManagement();
    await screen.findByText('Clip one');

    fireEvent.click(screen.getByLabelText('Select all 2 loaded'));

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  // Acting on ids the creator can no longer see is the one thing a bulk bar
  // must never do.
  it('drops the selection when the filter changes the rows underneath it', async () => {
    mockGetChannelVideos.mockResolvedValue(twoVideos());

    renderManagement();
    await selectBoth();
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Private' }));

    await waitFor(() => expect(screen.queryByText('2 selected')).toBeNull());
  });
});

describe('VideosManagement row churn', () => {
  /** One call per row render — a recent row formats its date exactly once. */
  const rowPaints = () => (formatDistanceToNow as jest.Mock).mock.calls.length;

  // The 5 s progress poll used to hand back a brand-new `processingVideos`
  // object (and brand-new row objects inside it) on every tick, whether or not
  // anything had changed, which rebuilt every row on screen.
  it('does not re-render a row when a poll tick repeats itself', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Working clip', status: 'processing' })]));
    const tick = () => ({
      processingVideos: {
        2: {
          videoId: 2,
          status: 'processing',
          renditions: [{ quality: '720p', state: 'in_progress' }],
        },
      },
      restart: mockRestart,
    });
    mockUseVideoProcessing.mockReturnValue(tick());

    const { rerender } = renderManagement();
    await screen.findByText('Working clip');

    const seen = rowPaints();
    expect(seen).toBeGreaterThan(0);

    // The next tick: a different object saying exactly the same thing.
    mockUseVideoProcessing.mockReturnValue(tick());
    rerender(currentTree());

    expect(rowPaints()).toBe(seen);
  });

  it('does re-render the row when the poll actually has news', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Working clip', status: 'processing' })]));
    mockUseVideoProcessing.mockReturnValue({
      processingVideos: { 2: { videoId: 2, status: 'processing', renditions: [] } },
      restart: mockRestart,
    });

    const { rerender } = renderManagement();
    await screen.findByText('Working clip');
    const seen = rowPaints();

    mockUseVideoProcessing.mockReturnValue({
      processingVideos: {
        2: { videoId: 2, status: 'processing', renditions: [{ quality: '1080p', state: 'in_progress' }] },
      },
      restart: mockRestart,
    });
    rerender(currentTree());

    expect(rowPaints()).toBeGreaterThan(seen);
    expect(await screen.findByText('Processing · transcoding 1080p')).toBeInTheDocument();
  });

  // Flipping one switch must not rebuild the rows that had nothing to do with
  // it: the cache is edited in place, page objects and untouched videos keep
  // their identity, and the memo comparator sees nothing new.
  it('leaves the other rows alone when one video changes', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Clip one', is_public: true }),
        video({ id: 2, title: 'Clip two', is_public: true }),
        video({ id: 3, title: 'Clip three', is_public: true }),
      ]),
    );

    renderManagement();
    await screen.findByText('Clip three');
    const seen = rowPaints();

    fireEvent.click(screen.getByRole('switch', { name: 'Clip two is public' }));

    expect(await screen.findByRole('switch', { name: 'Clip two is private' })).toBeInTheDocument();
    // One row repainted three times — busy on, the flip, busy off. If the
    // other two had come along for the ride this would be nine.
    expect(rowPaints() - seen).toBeLessThanOrEqual(3);
  });
});
