import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    // The refetch that repairs the pagination must not resurrect the row.
    mockGetChannelVideos.mockResolvedValue(page([]));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockDeleteVideo.mock.calls[0]?.[0]).toBe('5'));
    await waitFor(() => expect(screen.queryByText('Clip one')).toBeNull());
  });

  // Offset pagination cannot be repaired in place: once a row is gone every
  // page after it is shifted by one, and the next "Load more" would skip
  // exactly one video, silently and forever.
  it('corrects the count and re-reads the pages it holds after a delete', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 5, title: 'Clip one' }), video({ id: 6, title: 'Clip two' })], {
        total: 40,
        totalPages: 20,
      }),
    );

    renderManagement();
    expect(await screen.findByText('· 40')).toBeInTheDocument();

    fireEvent.keyDown(screen.getAllByRole('button', { name: 'More actions' })[0], { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 6, title: 'Clip two' })], { total: 39, totalPages: 20 }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    // The header drops immediately, from the cache…
    expect(await screen.findByText('· 39')).toBeInTheDocument();
    // …and the loaded pages are re-read, because their offsets have moved.
    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));
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

describe('VideosManagement finished processing', () => {
  const processingRow = (status: string) => ({
    processingVideos: { 9: { videoId: 9, status, renditions: [] } },
    restart: mockRestart,
  });

  // The poll is the only thing that learns a transcode finished. Until its
  // verdict reached the list's own `status`, Watch stayed disabled and the
  // visibility switch stayed locked for as long as the tab was open.
  it('unlocks Watch and the switch when the poll says the video is ready', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 9, title: 'Working clip', status: 'processing', is_public: false })]),
    );
    mockUseVideoProcessing.mockReturnValue(processingRow('processing'));

    const { rerender } = renderManagement();
    await screen.findByText('Working clip');
    expect(screen.getByRole('button', { name: 'Watch Working clip' })).toBeDisabled();
    expect(screen.getByRole('switch')).toBeDisabled();

    mockUseVideoProcessing.mockReturnValue(processingRow('processed'));
    rerender(currentTree());

    expect(await screen.findByRole('link', { name: 'Watch Working clip' })).toHaveAttribute(
      'href',
      '/video/9',
    );
    await waitFor(() => expect(screen.getByRole('switch')).not.toBeDisabled());
  });

  // …and the row stops belonging to a list defined by the thing that changed.
  it('takes the video out of the Processing filter once it is done', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 9, title: 'Working clip', status: 'processing' })]),
    );
    mockUseVideoProcessing.mockReturnValue(processingRow('processing'));

    const { rerender } = renderManagement('?visibility=processing');
    await screen.findByText('Working clip');

    // The refetch that repairs the pagination agrees the row has left.
    mockGetChannelVideos.mockResolvedValue(page([]));
    mockUseVideoProcessing.mockReturnValue(processingRow('processed'));
    rerender(currentTree());

    await waitFor(() => expect(screen.queryByText('Working clip')).toBeNull());
  });

  /**
   * The list endpoint can still be saying `processing` after the poll has said
   * `processed` — the worker updates the row a moment later.
   *
   * The verdict used to be applied once. Anything that re-read the pages
   * (a delete, a "Load more", a reconcile) handed back the stale status,
   * nothing re-applied the verdict, and the poll had already stopped for that
   * id: Watch went back to disabled and stayed there until a reload.
   */
  it('holds the verdict across a refetch that still says processing', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 9, title: 'Working clip', status: 'processing' }),
        video({ id: 10, title: 'Other clip', status: 'processed' }),
      ]),
    );
    mockUseVideoProcessing.mockReturnValue(processingRow('processing'));

    const { rerender } = renderManagement();
    await screen.findByText('Working clip');
    expect(screen.getByRole('button', { name: 'Watch Working clip' })).toBeDisabled();

    mockUseVideoProcessing.mockReturnValue(processingRow('processed'));
    rerender(currentTree());
    expect(await screen.findByRole('link', { name: 'Watch Working clip' })).toBeInTheDocument();

    // Something forces the loaded pages to be re-read — and the server has not
    // caught up: it still calls video 9 `processing`.
    fireEvent.keyDown(screen.getAllByRole('button', { name: 'More actions' })[1], { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));

    // The verdict still stands.
    expect(await screen.findByRole('link', { name: 'Watch Working clip' })).toBeInTheDocument();
  });

  it('keeps a finished video out of the Processing list across the same refetch', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 9, title: 'Working clip', status: 'processing' }),
        video({ id: 10, title: 'Other clip', status: 'processing' }),
      ]),
    );
    mockUseVideoProcessing.mockReturnValue(processingRow('processing'));

    const { rerender } = renderManagement('?visibility=processing');
    await screen.findByText('Working clip');

    mockUseVideoProcessing.mockReturnValue(processingRow('processed'));
    rerender(currentTree());
    await waitFor(() => expect(screen.queryByText('Working clip')).toBeNull());

    // The stub keeps insisting video 9 is processing; the row must not return.
    fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));

    await waitFor(() => expect(screen.queryByText('Working clip')).toBeNull());
  });

  it('leaves a failed video where it is — it is still the creator\'s problem', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 9, title: 'Broken clip', status: 'processing' })]),
    );
    mockUseVideoProcessing.mockReturnValue(processingRow('processing'));

    const { rerender } = renderManagement('?visibility=processing');
    await screen.findByText('Broken clip');

    mockUseVideoProcessing.mockReturnValue(processingRow('failed'));
    rerender(currentTree());

    expect(await screen.findByText(/^Failed/)).toBeInTheDocument();
    expect(screen.getByText('Broken clip')).toBeInTheDocument();
  });
});

describe('VideosManagement membership', () => {
  // Two filtered lists are two cache entries. Patching only the one on screen
  // left the other holding a visibility that was a lie for five minutes.
  it('moves a video out of the Private list when it is made public', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Clip one', is_public: false }),
        video({ id: 2, title: 'Clip two', is_public: false }),
      ]),
    );

    renderManagement('?visibility=private');
    await screen.findByText('Clip one');

    // What the server would now answer for this filter.
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Clip two', is_public: false })]));
    fireEvent.click(screen.getByRole('switch', { name: 'Clip one is private' }));

    await waitFor(() => expect(screen.queryByText('Clip one')).toBeNull());
    expect(screen.getByText('Clip two')).toBeInTheDocument();
  });

  /**
   * A patch can only edit rows a cache already HOLDS.
   *
   * Publish a private video while the Public list is cached without it and no
   * amount of patching puts it there — the creator switches to Public and the
   * video they just published is simply missing, for five minutes. The cached
   * lists nobody is looking at are therefore thrown away.
   */
  it('does not serve a cached Public list that predates the video joining it', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Clip one', is_public: false }),
        video({ id: 2, title: 'Clip two', is_public: true }),
      ]),
    );

    renderManagement();
    await screen.findByText('Clip one');

    // Visit Public once, so it is in the cache without Clip one.
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Clip two', is_public: true })]));
    fireEvent.click(screen.getByRole('button', { name: 'Public' }));
    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Clip one')).toBeNull();

    // Back to All, from cache.
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await screen.findByText('Clip one');
    expect(mockGetChannelVideos).toHaveBeenCalledTimes(2);

    // Publish it. The Public list is now wrong in a way patching cannot fix.
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Clip one', is_public: true }),
        video({ id: 2, title: 'Clip two', is_public: true }),
      ]),
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Clip one is private' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Public' }));

    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(3));
    expect(await screen.findByText('Clip one')).toBeInTheDocument();
  });

  // The common case — the unfiltered list — must not pay for any of that.
  it('does not refetch when the row still belongs where it is', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: false })]));

    renderManagement();
    fireEvent.click(await screen.findByRole('switch'));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockGetChannelVideos).toHaveBeenCalledTimes(1);
  });
});

describe('VideosManagement mutation races', () => {
  /**
   * Rollback used to assume the previous value was `!next`, and to fire
   * whenever the request failed.
   *
   * The switch locks itself while its own request is in the air, so two
   * clicks on one row cannot overlap — but the bulk bar does not go through
   * the switch, and it happily includes a row that is already mid-flip. That
   * is a genuine overlap, and when the older request then fails its rollback
   * would overwrite the newer, correct value.
   */
  it('does not roll back over a newer choice, and never lets the two cross', async () => {
    const first = deferred<{ success: boolean }>();
    const second = deferred<{ success: boolean }>();
    mockUpdateVideo.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 1, title: 'Clip one', is_public: true })]),
    );

    renderManagement();

    // Flip one: public -> private, left hanging.
    fireEvent.click(await screen.findByRole('switch'));
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'));

    // Flip two, over the top of it, from the bulk bar: private -> public.
    fireEvent.click(screen.getByLabelText('Select Clip one'));
    fireEvent.click(screen.getByRole('button', { name: /Make public/ }));

    // The screen answers at once…
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
    // …but the second request has NOT been sent. If both were in the air they
    // could land in either order, and the older one landing last would leave
    // the database holding the value the creator changed their mind about.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockUpdateVideo).toHaveBeenCalledTimes(1);

    // The first finally fails. It no longer owns this video, so its rollback
    // must not run — and only now does the second go out.
    first.settle({ success: false });
    await waitFor(() => expect(mockUpdateVideo).toHaveBeenCalledTimes(2));
    expect((mockUpdateVideo.mock.calls[1][1] as FormData).get('is_public')).toBe('true');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    second.settle({ success: true });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  // The same guard, in the direction where a rollback is exactly right.
  it('does put the switch back when its own request is the last word', async () => {
    mockUpdateVideo.mockRejectedValue(new Error('Nope'));
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: true })]));

    renderManagement();
    fireEvent.click(await screen.findByRole('switch'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Nope'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('ignores an Undo the creator has already overtaken', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: true })]));

    renderManagement();
    fireEvent.click(await screen.findByRole('switch')); // -> private
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const Body = toast.success.mock.calls[0][0] as React.FC<{ closeToast?: () => void }>;

    // The creator changes their mind before the toast expires.
    fireEvent.click(screen.getByRole('switch')); // -> public
    await waitFor(() => expect(mockUpdateVideo).toHaveBeenCalledTimes(2));

    const view = render(<Body closeToast={() => undefined} />);
    fireEvent.click(within(view.container).getByRole('button', { name: 'Undo' }));

    // The stale Undo would have made it private again.
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
    expect(mockUpdateVideo).toHaveBeenCalledTimes(2);
  });

  it('spends no request on a flip that changes nothing', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: true })]));

    renderManagement();
    fireEvent.click(await screen.findByRole('switch'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockUpdateVideo).toHaveBeenCalledTimes(1);
    const Body = toast.success.mock.calls[0][0] as React.FC<{ closeToast?: () => void }>;

    // Undo returns it to private->public; a second Undo of the same toast has
    // nothing left to say.
    const view = render(<Body closeToast={() => undefined} />);
    fireEvent.click(within(view.container).getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(mockUpdateVideo).toHaveBeenCalledTimes(2));
    fireEvent.click(within(view.container).getByRole('button', { name: 'Undo' }));

    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
    expect(mockUpdateVideo).toHaveBeenCalledTimes(2);
  });

  // A request that lands into an unmounted tree must not set state or toast at
  // a page nobody is on.
  it('says nothing once the creator has left the page', async () => {
    const request = deferred<{ success: boolean }>();
    mockUpdateVideo.mockReturnValue(request.promise);
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: true })]));

    const view = renderManagement();
    fireEvent.click(await screen.findByRole('switch'));
    await waitFor(() => expect(mockUpdateVideo).toHaveBeenCalled());

    view.unmount();
    request.settle({ success: true });
    await Promise.resolve();

    expect(toast.success).not.toHaveBeenCalled();
    expect(consoleErrors.filter((line) => line.includes('unmounted'))).toEqual([]);
  });
});

describe('VideosManagement bulk eligibility', () => {
  // The server refuses to publish an unfinished video, so asking would spend a
  // request to be told so — and reporting it as a failure would suggest the
  // creator could do something about it.
  it('sets aside the videos that are not ready and names them', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Ready clip', status: 'processed', is_public: false }),
        video({ id: 2, title: 'Working clip', status: 'processing', is_public: false }),
      ]),
    );

    renderManagement();
    fireEvent.click(await screen.findByLabelText('Select Ready clip'));
    fireEvent.click(screen.getByLabelText('Select Working clip'));
    fireEvent.click(screen.getByRole('button', { name: /Make public/ }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('1 made public · 1 still processing'),
    );
    expect(mockUpdateVideo).toHaveBeenCalledTimes(1);
    expect(mockUpdateVideo.mock.calls[0][0]).toBe('1');
  });

  it('makes an unfinished video private without complaint', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 2, title: 'Working clip', status: 'processing', is_public: true })]),
    );

    renderManagement();
    fireEvent.click(await screen.findByLabelText('Select Working clip'));
    fireEvent.click(screen.getByRole('button', { name: /Make private/ }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 made private'));
  });

  // "Try again" should be one click, and should not re-send what worked.
  it('keeps only the failures ticked', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Clip one', is_public: false }),
        video({ id: 2, title: 'Clip two', is_public: false }),
      ]),
    );
    mockUpdateVideo
      .mockResolvedValueOnce({ success: true, data: video() })
      .mockRejectedValueOnce(new Error('boom'));

    renderManagement();
    fireEvent.click(await screen.findByLabelText('Select Clip one'));
    fireEvent.click(screen.getByLabelText('Select Clip two'));
    fireEvent.click(screen.getByRole('button', { name: /Make public/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('1 of 2 updated — 1 failed'));
    expect(await screen.findByText('1 selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Clip two')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Select Clip one')).toHaveAttribute('aria-checked', 'false');
  });
});

describe('VideosManagement controls', () => {
  // The operating system draws a native `<select>` list and a native checkbox
  // itself, and no stylesheet reaches inside them. On a dark panel they are
  // the two things that look borrowed from another application.
  it('draws its own sort menu and tick boxes rather than the browser\'s', async () => {
    const view = renderManagement();
    await screen.findByText('Clip one');

    /* eslint-disable testing-library/no-node-access, testing-library/no-container */
    expect(view.container.querySelector('select')).toBeNull();
    expect(view.container.querySelector('input[type="checkbox"]')).toBeNull();
    /* eslint-enable testing-library/no-node-access, testing-library/no-container */

    expect(screen.getByRole('button', { name: 'Sort' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });

  it('opens the sort menu and changes the order from it', async () => {
    renderManagement();
    await screen.findByText('Clip one');

    fireEvent.keyDown(screen.getByRole('button', { name: 'Sort' }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Most viewed' }));

    await waitFor(() => expect(mockGetChannelVideos).toHaveBeenCalledTimes(2));
    expect(apiQuery(1)).toEqual({ sort: 'most_viewed' });
    expect(screen.getByRole('button', { name: 'Sort' })).toHaveTextContent('Most viewed');
  });

  it('carries the whole selection in one header tick box', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 1, title: 'Clip one' }), video({ id: 2, title: 'Clip two' })]),
    );

    renderManagement();
    await screen.findByText('Clip one');

    const selectAll = screen.getByLabelText('Select all 2 loaded');
    expect(selectAll).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(screen.getByLabelText('Select Clip one'));
    expect(screen.getByLabelText('Select all 2 loaded')).toHaveAttribute('aria-checked', 'mixed');

    fireEvent.click(screen.getByLabelText('Select all 2 loaded'));
    expect(screen.getByLabelText('Select all 2 loaded')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });
});

describe('VideosManagement desktop layout', () => {
  // The first pass reflowed `<tr>`/`<td>` from table layout to flex with a
  // chain of `md:` overrides. When that chain half-applied, the desktop got
  // the phone's stacked card with no warning at all. jsdom reports no widths,
  // but it does report structure — and the structure is now decided in one
  // place, by one media query.
  it('lays a row out as one table row, cell by cell', async () => {
    renderManagement();
    const title = await screen.findByRole('button', { name: 'Clip one' });

    /* eslint-disable testing-library/no-node-access */
    const titleCell = title.closest('td');
    const visibilityCell = screen.getByRole('switch').closest('td');
    expect(titleCell).not.toBeNull();
    expect(visibilityCell).not.toBeNull();
    // Siblings in the same `<tr>` — not two stacked blocks.
    expect(titleCell?.parentElement?.tagName).toBe('TR');
    expect(visibilityCell?.parentElement).toBe(titleCell?.parentElement);
    expect(titleCell?.parentElement?.parentElement?.tagName).toBe('TBODY');
    /* eslint-enable testing-library/no-node-access */
  });

  it('keeps the column headers a row of th cells', async () => {
    renderManagement();
    await screen.findByText('Clip one');

    const header = screen.getByRole('button', { name: 'Sort by Views' });
    /* eslint-disable testing-library/no-node-access */
    const cell = header.closest('th');
    expect(cell).not.toBeNull();
    expect(cell?.querySelector('th')).toBeNull();
    expect(cell?.parentElement?.parentElement?.tagName).toBe('THEAD');
    /* eslint-enable testing-library/no-node-access */
  });
});

describe('VideosManagement selection safety', () => {
  // Reordering the list reshuffles which rows are loaded at all, so a
  // selection made under one order means nothing under another.
  it('drops the selection when the order changes', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, title: 'Clip one' })]));

    renderManagement();
    fireEvent.click(await screen.findByLabelText('Select Clip one'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Sort' }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Most viewed' }));

    await waitFor(() => expect(screen.queryByText('1 selected')).toBeNull());
  });

  /**
   * A row can leave the list on its own.
   *
   * It stayed ticked, invisible, and inside the next bulk action — so "Delete"
   * could act on a video the creator could not see, and the dialog would
   * cheerfully call it "this video".
   */
  it('unticks a row that has left the filter it was selected under', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([
        video({ id: 1, title: 'Clip one', is_public: false }),
        video({ id: 2, title: 'Clip two', is_public: false }),
      ]),
    );

    renderManagement('?visibility=private');
    fireEvent.click(await screen.findByLabelText('Select Clip one'));
    fireEvent.click(screen.getByLabelText('Select Clip two'));
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    // Clip one is published, and so leaves the Private list.
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 2, title: 'Clip two', is_public: false })]));
    fireEvent.click(screen.getByRole('switch', { name: 'Clip one is private' }));

    await waitFor(() => expect(screen.queryByText('Clip one')).toBeNull());
    expect(await screen.findByText('1 selected')).toBeInTheDocument();
  });

  it('names the video it is about to delete', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, title: 'Clip one' })]));

    renderManagement();
    fireEvent.click(await screen.findByLabelText('Select Clip one'));
    fireEvent.click(screen.getByRole('button', { name: /^Delete$/ }));

    expect(await screen.findByText(/Are you sure you want to delete "Clip one"/)).toBeInTheDocument();
  });
});

describe('VideosManagement checkbox', () => {
  /**
   * The tick box is a real `<button>`.
   *
   * That is not decoration: Space and Enter activating it are the browser's
   * default behaviour for buttons, which jsdom does not simulate but every
   * real one does. A `<div role="checkbox">` would have needed its own key
   * handling, and would have been outside the tab order.
   */
  it('is a button, so the keyboard works without us reimplementing it', async () => {
    renderManagement();
    const box = await screen.findByLabelText('Select Clip one');

    expect(box.tagName).toBe('BUTTON');
    expect(box).toHaveAttribute('type', 'button');
    expect(box).toHaveAttribute('role', 'checkbox');
    expect(box).not.toBeDisabled();
  });

  it('toggles both ways and reports its state', async () => {
    renderManagement();
    const box = await screen.findByLabelText('Select Clip one');
    expect(box).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(box);
    expect(screen.getByLabelText('Select Clip one')).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByLabelText('Select Clip one'));
    expect(screen.getByLabelText('Select Clip one')).toHaveAttribute('aria-checked', 'false');
    // The bulk bar animates out, so it is still in the DOM for a beat.
    await waitFor(() => expect(screen.queryByText('1 selected')).toBeNull());
  });
});

describe('VideosManagement stuck requests', () => {
  /**
   * Writes for one video are serialized so they cannot land out of order,
   * which means one request that never answers is one request that blocks
   * every later write for that row. Bounded only by axios's own timeout times
   * its retries, that is about half an hour of a switch that does nothing and
   * a row that says it is busy.
   */
  it('gives up on a request that never answers, and lets the next one through', async () => {
    jest.useFakeTimers();
    try {
      mockUpdateVideo.mockReturnValueOnce(new Promise(() => undefined));
      mockGetChannelVideos.mockResolvedValue(page([video({ id: 1, is_public: true })]));

      renderManagement();
      fireEvent.click(await screen.findByRole('switch'));
      await waitFor(() =>
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'),
      );

      await act(async () => {
        jest.advanceTimersByTime(21_000);
      });

      // Said plainly, and the row goes back to what it actually was.
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('The server did not answer in time'),
      );
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

      // …and the row is free again: the next flip is sent, not queued behind
      // a request nobody is waiting for.
      fireEvent.click(screen.getByRole('switch'));
      await waitFor(() => expect(mockUpdateVideo).toHaveBeenCalledTimes(2));
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('VideosManagement held failure', () => {
  /**
   * A `failed` verdict is held like any other, so it survives a refetch that
   * still calls the video `processing`. A retry has to release it — the same
   * id is about to be transcoded again, and a row that keeps insisting it
   * failed is a row the creator cannot get out of that state.
   */
  it('releases a held failed verdict when the creator retries', async () => {
    mockGetChannelVideos.mockResolvedValue(
      page([video({ id: 9, title: 'Working clip', status: 'processing' })]),
    );
    mockUseVideoProcessing.mockReturnValue({
      processingVideos: { 9: { videoId: 9, status: 'failed', renditions: [] } },
      restart: mockRestart,
    });
    // The real hook forgets the terminal row when it is restarted, which is
    // what stops the poll re-reporting a failure it has been told to retry.
    mockRestart.mockImplementation(() => {
      mockUseVideoProcessing.mockReturnValue({ processingVideos: {}, restart: mockRestart });
    });

    renderManagement();
    expect(await screen.findByText(/^Failed/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry processing' }));
    await waitFor(() => expect(mockRetryVideoProcessing).toHaveBeenCalledWith(9));
    await waitFor(() => expect(mockRestart).toHaveBeenCalledWith([9]));

    // If the verdict were still held, the row would paint its own "Failed"
    // line from the video's status even with the poll quiet, and there would
    // be no way back out of that state.
    await waitFor(() => expect(screen.queryByText(/^Failed/)).not.toBeInTheDocument());
  });
});

describe('VideosManagement paging', () => {
  // Pruning the selection against the loaded rows must count every page that
  // is loaded, not the last one fetched — a creator who ticks a row, loads
  // more, and hits Delete would otherwise find their selection quietly gone.
  it('keeps a selection made on page one after loading page two', async () => {
    mockGetChannelVideos
      .mockResolvedValueOnce(
        page([video({ id: 1, title: 'Clip one' })], { total: 2, page: 1, limit: 1, totalPages: 2 }),
      )
      .mockResolvedValueOnce(
        page([video({ id: 2, title: 'Clip two' })], { total: 2, page: 2, limit: 1, totalPages: 2 }),
      );

    renderManagement();
    fireEvent.click(await screen.findByLabelText('Select Clip one'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Clip two')).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Clip one')).toHaveAttribute('aria-checked', 'true');
  });

  it('can then select every loaded row across both pages', async () => {
    mockGetChannelVideos
      .mockResolvedValueOnce(
        page([video({ id: 1, title: 'Clip one' })], { total: 2, page: 1, limit: 1, totalPages: 2 }),
      )
      .mockResolvedValueOnce(
        page([video({ id: 2, title: 'Clip two' })], { total: 2, page: 2, limit: 1, totalPages: 2 }),
      );

    renderManagement();
    await screen.findByText('Clip one');
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByText('Clip two');

    fireEvent.click(screen.getByLabelText('Select all 2 loaded'));

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });
});

describe('VideosManagement edit screen', () => {
  /**
   * The edit screen replaces the list rather than sitting over it, so the
   * confirmation dialog has to be rendered from that branch too — otherwise
   * "Delete video…" opened nothing at all.
   */
  it('deletes from the edit screen through the same dialog as the list', async () => {
    mockGetChannelVideos.mockResolvedValue(page([video({ id: 5, title: 'Clip one' })]));

    renderManagement();
    fireEvent.click(await screen.findByRole('button', { name: 'Clip one' }));

    fireEvent.click(await screen.findByRole('button', { name: /Delete video/ }));

    expect(await screen.findByText('Delete Video')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Clip one"/)).toBeInTheDocument();

    mockGetChannelVideos.mockResolvedValue(page([]));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockDeleteVideo.mock.calls[0]?.[0]).toBe('5'));
    // The video is gone, so the screen that was editing it goes with it.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Back' })).toBeNull());
  });
});
