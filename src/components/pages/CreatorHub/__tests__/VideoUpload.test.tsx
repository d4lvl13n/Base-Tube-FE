import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { UploadQueueApi, UploadQueueViewEntry } from '../../../../hooks/useUploadQueue';
import VideoUpload from '../VideoUpload';

const mockUseUploadQueueContext = jest.fn();
const mockUseChannelSelection = jest.fn();
const mockNavigate = jest.fn();

// framer-motion reads `window.matchMedia` when a motion element mounts, and
// jsdom does not ship one.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
});

jest.mock('../../../../contexts/UploadQueueContext', () => ({
  useUploadQueueContext: () => mockUseUploadQueueContext(),
}));

jest.mock('../../../../contexts/ChannelSelectionContext', () => ({
  useChannelSelection: () => mockUseChannelSelection(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// The page owns the form, not these panels — they are mocked so the test is
// about the upload screen and not about TipTap or the AI drawers.
jest.mock('../../../common/RichTextEditor', () => ({
  __esModule: true,
  default: ({ content, onChange }: { content: string; onChange: (value: string) => void }) => (
    <textarea
      aria-label="Description"
      value={content}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
/**
 * The AI drawer is a stub that records what the page told it and offers the two
 * buttons the page reacts to. The drawer's own rendering is covered by
 * `src/components/common/__tests__/AIAssistantPanel.test.tsx`.
 */
let aiPanelProps: Record<string, any> | null = null;
jest.mock('../../../common/AIAssistantPanel', () => ({
  __esModule: true,
  default: (props: Record<string, any>) => {
    aiPanelProps = props;
    if (!props.isOpen) return null;
    return (
      <div>
        <button type="button" onClick={() => props.onGenerate()}>
          stub-generate
        </button>
        {props.generatedDescription && props.onAcceptDescription && (
          <button
            type="button"
            onClick={() => props.onAcceptDescription(props.generatedDescription)}
          >
            stub-use-description
          </button>
        )}
      </div>
    );
  },
}));
jest.mock('../../../common/AIThumbnailPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../common/CreatorHub/ChannelSelector', () => ({
  ChannelSelector: () => <div data-testid="channel-selector" />,
}));
const mockGenerateVideoDescription = jest.fn();
jest.mock('../../../../api/video', () => ({
  generateVideoDescription: (...args: unknown[]) => mockGenerateVideoDescription(...args),
}));

jest.mock('../../../../hooks/useAIthumbnail', () => ({
  useAIthumbnail: () => ({
    generateForVideo: jest.fn(),
    isGeneratingForVideo: false,
    generateFromPrompt: jest.fn(),
    isGeneratingFromPrompt: false,
    generateWithReference: jest.fn(),
    isGeneratingWithReference: false,
    refineThumbnail: jest.fn(),
    isRefiningThumbnail: false,
  }),
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
    progress: 42,
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
    enqueueFiles: jest.fn().mockResolvedValue({ accepted: [], rejected: [] }),
    reselectFiles: jest.fn(),
    updateMetadata: jest.fn(),
    flushMetadata: jest.fn().mockResolvedValue(undefined),
    setPendingThumbnail: jest.fn(),
    abortEntry: jest.fn().mockResolvedValue(undefined),
    retryEntry: jest.fn(),
    replaceAttempt: jest.fn(),
    removeEntry: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as UploadQueueApi;
}

/**
 * jsdom's `input.files` has no setter that takes an array, so the selection is
 * planted on the element before the change event is dispatched.
 */
function selectFile(container: HTMLElement, file: File) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

let rerenderUpload: () => void = () => undefined;

function renderUpload(api: UploadQueueApi) {
  mockUseUploadQueueContext.mockReturnValue(api);
  const utils = render(
    <MemoryRouter>
      <VideoUpload />
    </MemoryRouter>,
  );
  // Lets a test swap the queue's answer and re-render, the way the provider
  // does when the queue's own state moves on.
  rerenderUpload = () =>
    utils.rerender(
      <MemoryRouter>
        <VideoUpload />
      </MemoryRouter>,
    );
  return utils;
}

beforeEach(() => {
  jest.clearAllMocks();
  aiPanelProps = null;
  mockUseChannelSelection.mockReturnValue({
    channels: [{ id: 7, name: 'Test channel' }],
    selectedChannelId: '7',
    selectedChannel: { id: 7, name: 'Test channel', description: '<p>Weekly build logs</p>' },
  });
});

describe('VideoUpload', () => {
  it('renders the drop zone before a file is chosen', () => {
    renderUpload(queue());

    expect(screen.getByText('Drop a video here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'or browse' })).toBeInTheDocument();
    expect(screen.getByText('MP4, MOV or AVI · up to 2 GB')).toBeInTheDocument();
    // Nothing to save until there is a file.
    expect(screen.queryByRole('button', { name: /^Save/ })).not.toBeInTheDocument();
  });

  it('enqueues the chosen file and shows its row', async () => {
    const created = entry();
    const enqueueFiles = jest.fn().mockResolvedValue({ accepted: [created], rejected: [] });
    // The queue starts empty — a live entry already in a hydrated queue would
    // be ADOPTED on mount (see the reload-adoption tests below). The row only
    // appears once the page's own `enqueueFiles` has claimed the localId and
    // the queue reports the entry.
    const api = queue({ enqueueFiles, entries: [] });
    const { container } = renderUpload(api);

    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();

    const file = new File(['bytes'], 'clip.mp4', { type: 'video/mp4' });
    selectFile(container, file);

    await waitFor(() => expect(enqueueFiles).toHaveBeenCalledWith([file], 7));

    // The queue's state moves on: the accepted entry is now in `entries`.
    mockUseUploadQueueContext.mockReturnValue({ ...api, entries: [created] });
    rerenderUpload();

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.getByText('12.0 MB')).toBeInTheDocument();
    expect(screen.getByText('Uploading 42%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Uploading clip.mp4' })).toHaveAttribute(
      'aria-valuenow',
      '42',
    );
    expect(screen.getByRole('button', { name: 'Cancel clip.mp4' })).toBeInTheDocument();
  });

  it('surfaces the SDK rejection message under the drop zone', async () => {
    const enqueueFiles = jest.fn().mockResolvedValue({
      accepted: [],
      rejected: [{ file: null, code: 'UNSUPPORTED_TYPE', message: 'We accept MP4, MOV and AVI files.' }],
    });
    const { container } = renderUpload(queue({ enqueueFiles }));

    selectFile(container, new File(['x'], 'clip.txt', { type: 'text/plain' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We accept MP4, MOV and AVI files.');
  });

  it('saves and navigates to Videos Management with the highlight', async () => {
    const created = entry();
    const api = queue({
      entries: [created],
      enqueueFiles: jest.fn().mockResolvedValue({ accepted: [created], rejected: [] }),
    });
    const { container } = renderUpload(api);

    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));

    const save = await screen.findByRole('button', { name: 'Save & continue uploading' });
    fireEvent.click(save);

    await waitFor(() => expect(api.flushMetadata).toHaveBeenCalledWith('local-1'));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/creator-hub/videos?highlight=upload-1'),
    );
  });

  it('prefers the videoId once the upload has one', async () => {
    const created = entry({ videoId: 55, status: 'processing', videoStatus: 'processed' });
    const api = queue({
      entries: [created],
      enqueueFiles: jest.fn().mockResolvedValue({ accepted: [created], rejected: [] }),
    });
    const { container } = renderUpload(api);

    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/creator-hub/videos?highlight=55'),
    );
  });

  // Cancelling is only over when the server says so. A refused cancel used to
  // clear the page while the bytes may well have kept moving.
  it('clears the row when the cancel is confirmed', async () => {
    const created = entry();
    // Starts empty so the row on screen is the one this page enqueued, not an
    // adopted one (a hydrated live entry would be adopted on mount).
    const api = queue({
      entries: [],
      enqueueFiles: jest.fn().mockResolvedValue({ accepted: [created], rejected: [] }),
      abortEntry: jest.fn().mockResolvedValue(true),
    });
    const { container } = renderUpload(api);

    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));
    await waitFor(() => expect(api.enqueueFiles).toHaveBeenCalled());
    mockUseUploadQueueContext.mockReturnValue({ ...api, entries: [created] });
    rerenderUpload();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel clip.mp4' }));

    await waitFor(() => expect(api.abortEntry).toHaveBeenCalledWith('local-1'));
    await waitFor(() => expect(api.removeEntry).toHaveBeenCalledWith('local-1'));

    // The queue drops the removed entry; with nothing left to adopt, the page
    // gets its drop zone back.
    mockUseUploadQueueContext.mockReturnValue({ ...api, entries: [] });
    rerenderUpload();
    expect(await screen.findByText('Drop a video here')).toBeInTheDocument();
  });

  it('keeps the row, and does not remove it, when the cancel was refused', async () => {
    const refused = entry({
      status: 'aborted',
      errorCode: 'UPLOAD_ABORT_FAILED',
      errorMessage: '{"error":"gateway timeout"}',
    });
    const api = queue({
      entries: [entry()],
      enqueueFiles: jest.fn().mockResolvedValue({ accepted: [entry()], rejected: [] }),
      abortEntry: jest.fn().mockResolvedValue(false),
    });
    const { container } = renderUpload(api);

    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel clip.mp4' }));
    await waitFor(() => expect(api.abortEntry).toHaveBeenCalledWith('local-1'));

    expect(api.removeEntry).not.toHaveBeenCalled();
    expect(screen.getByText('clip.mp4')).toBeInTheDocument();

    // The queue has since parked the row as a failed cancel; the page says so
    // in the copy map's words and waits for the creator to dismiss it.
    mockUseUploadQueueContext.mockReturnValue({ ...api, entries: [refused] });
    rerenderUpload();

    expect(await screen.findByText(/We couldn't stop this upload/)).toBeInTheDocument();
    expect(screen.queryByText(/gateway timeout/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove clip.mp4' }));
    await waitFor(() => expect(api.removeEntry).toHaveBeenCalledWith('local-1'));
  });

  it('requires a title before saving', async () => {
    const created = entry({ title: '' });
    const api = queue({
      entries: [created],
      enqueueFiles: jest.fn().mockResolvedValue({ accepted: [created], rejected: [] }),
    });
    const { container } = renderUpload(api);

    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Save & continue uploading' }));

    expect(await screen.findByText('Give the video a title.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('VideoUpload · reload adoption', () => {
  // A reload used to leave this page empty while the hydrated row lived only
  // in the floating panel (hidden on upload routes) — inviting the creator to
  // pick the file again under a NEW attempt. The page now adopts the queue's
  // most recent still-live row on mount.
  it('adopts a hydrated in-flight row and seeds the form from it', async () => {
    const hydrated = entry({
      localId: 'resumed-1',
      title: 'Persisted draft title',
      description: '<p>Persisted draft description</p>',
      isPublic: true,
      status: 'uploading',
      progress: 61,
    });
    renderUpload(queue({ entries: [hydrated] }));

    // The row renders without any file being chosen on this visit.
    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.getByText('Uploading 61%')).toBeInTheDocument();
    // The form is seeded from the adopted entry, not left blank.
    expect(screen.getByPlaceholderText('Video title')).toHaveValue('Persisted draft title');
    expect(screen.getByLabelText('Description')).toHaveValue('<p>Persisted draft description</p>');
    expect(screen.getByRole('radio', { name: /Public/ })).toHaveAttribute('aria-checked', 'true');
    // Save is available for the adopted row.
    expect(screen.getByRole('button', { name: 'Save & continue uploading' })).toBeInTheDocument();
  });

  it('adopts the most recent live row when several are hydrated', async () => {
    const older = entry({ localId: 'old-1', filename: 'first.mp4', title: 'first' });
    const newer = entry({ localId: 'new-1', filename: 'second.mp4', title: 'second' });
    renderUpload(queue({ entries: [older, newer] }));

    expect(await screen.findByText('second.mp4')).toBeInTheDocument();
    expect(screen.queryByText('first.mp4')).not.toBeInTheDocument();
  });

  it('does not adopt terminal rows — the drop zone stays', () => {
    const settled = [
      entry({ localId: 'f-1', status: 'failed' }),
      entry({ localId: 'r-1', status: 'ready', videoStatus: 'processed' }),
    ];
    renderUpload(queue({ entries: settled }));

    expect(screen.getByText('Drop a video here')).toBeInTheDocument();
    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();
  });

  it('does not adopt anything before the queue is hydrated', () => {
    renderUpload(queue({ hydrated: false, entries: [entry()] }));

    expect(screen.getByText('Drop a video here')).toBeInTheDocument();
    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();
  });

  // Only rows REBUILT FROM STORAGE qualify — those have no `File` handle. A row
  // created in this session still holds its File; it is one the creator already
  // walked away from, and adopting it hijacked the page for the previous video.
  it('never adopts an in-session row that still holds its File', () => {
    const inSession = entry({
      localId: 'session-1',
      title: 'Previous video',
      file: new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }),
    });
    renderUpload(queue({ entries: [inSession] }));

    expect(screen.getByText('Drop a video here')).toBeInTheDocument();
    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Video title')).toHaveValue('');
  });

  it('adopts the latest file-less row, skipping newer in-session rows', async () => {
    const hydrated = entry({ localId: 'resumed-1', filename: 'resumed.mp4', title: 'resumed' });
    const inSession = entry({
      localId: 'session-1',
      filename: 'fresh.mp4',
      title: 'fresh',
      file: new File(['bytes'], 'fresh.mp4', { type: 'video/mp4' }),
    });
    renderUpload(queue({ entries: [hydrated, inSession] }));

    expect(await screen.findByText('resumed.mp4')).toBeInTheDocument();
    expect(screen.queryByText('fresh.mp4')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Video title')).toHaveValue('resumed');
  });
});

describe('VideoUpload · "Upload another" releases the row', () => {
  // Once the bytes are in, the row no longer needs this page. Releasing it
  // hands the drop zone back while the row keeps going in the queue.
  it('offers "Upload another" on a processing row and returns to the drop zone', async () => {
    const processing = entry({
      status: 'ready',
      videoId: 55,
      videoStatus: 'processing',
      title: 'Adopted title',
      description: '<p>Adopted description</p>',
      tags: ['a', 'b'],
      isPublic: true,
    });
    const api = queue({ entries: [processing] });
    renderUpload(api);

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Video title')).toHaveValue('Adopted title');

    fireEvent.click(screen.getByRole('button', { name: 'Upload another video' }));

    // The page is back to a blank upload form…
    expect(await screen.findByText('Drop a video here')).toBeInTheDocument();
    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Video title')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
    expect(screen.getByPlaceholderText('Separate tags with commas')).toHaveValue('');
    expect(screen.getByRole('radio', { name: /Public/ })).toHaveAttribute('aria-checked', 'true');
    // …and the row was NOT taken out of the queue.
    expect(api.removeEntry).not.toHaveBeenCalled();
    expect(api.abortEntry).not.toHaveBeenCalled();
  });

  it('never re-adopts a released row while the page lives, even as the queue re-renders', async () => {
    const processing = entry({ status: 'ready', videoId: 55, videoStatus: 'processing' });
    const api = queue({ entries: [processing] });
    renderUpload(api);
    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upload another video' }));
    expect(await screen.findByText('Drop a video here')).toBeInTheDocument();

    // The queue moves on (progress, renditions…) and the provider re-renders
    // with the same still-live, still file-less row.
    mockUseUploadQueueContext.mockReturnValue({
      ...api,
      entries: [{ ...processing, progress: 100, updatedAt: '2026-08-28T10:05:00.000Z' }],
    });
    rerenderUpload();

    expect(screen.getByText('Drop a video here')).toBeInTheDocument();
    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();
  });

  it('lets a new file start a NEW upload after the release', async () => {
    const processing = entry({ localId: 'old-1', status: 'ready', videoId: 55, videoStatus: 'processing' });
    const created = entry({ localId: 'new-1', filename: 'next.mp4', status: 'uploading', progress: 3 });
    const enqueueFiles = jest.fn().mockResolvedValue({ accepted: [created], rejected: [] });
    const api = queue({ entries: [processing], enqueueFiles });
    const { container } = renderUpload(api);
    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upload another video' }));
    expect(await screen.findByText('Drop a video here')).toBeInTheDocument();

    const file = new File(['bytes'], 'next.mp4', { type: 'video/mp4' });
    selectFile(container, file);
    await waitFor(() => expect(enqueueFiles).toHaveBeenCalledWith([file], 7));
    expect(api.reselectFiles).not.toHaveBeenCalled();

    mockUseUploadQueueContext.mockReturnValue({ ...api, entries: [processing, created] });
    rerenderUpload();

    expect(await screen.findByText('next.mp4')).toBeInTheDocument();
    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();
  });

  it('is not offered while the bytes are still transferring', async () => {
    renderUpload(queue({ entries: [entry({ status: 'uploading', progress: 42 })] }));

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload another video' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel clip.mp4' })).toBeInTheDocument();
  });

  it('is not offered on a failed row — Remove is the only way out', async () => {
    // A failed row is not adopted on mount, so this exercises a row the page
    // enqueued itself that then failed.
    const created = entry();
    const failed = entry({ status: 'failed', errorCode: 'X', errorMessage: 'boom' });
    const api = queue({
      entries: [],
      enqueueFiles: jest.fn().mockResolvedValue({ accepted: [created], rejected: [] }),
    });
    const { container } = renderUpload(api);
    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));
    await waitFor(() => expect(api.enqueueFiles).toHaveBeenCalled());

    mockUseUploadQueueContext.mockReturnValue({ ...api, entries: [failed] });
    rerenderUpload();

    expect(await screen.findByRole('button', { name: 'Remove clip.mp4' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload another video' })).not.toBeInTheDocument();
  });

  it('is offered on a finished (ready) row the page enqueued itself', async () => {
    const created = entry();
    const done = entry({ status: 'ready', videoId: 55, videoStatus: 'processed' });
    const api = queue({
      entries: [],
      enqueueFiles: jest.fn().mockResolvedValue({ accepted: [created], rejected: [] }),
    });
    const { container } = renderUpload(api);
    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));
    await waitFor(() => expect(api.enqueueFiles).toHaveBeenCalled());

    mockUseUploadQueueContext.mockReturnValue({ ...api, entries: [done] });
    rerenderUpload();

    expect(await screen.findByRole('button', { name: 'Upload another video' })).toBeInTheDocument();
  });
});

describe('VideoUpload · reselect after reload', () => {
  // A reload loses the file handle: the browser cannot re-open the file itself.
  // The adopted row must say so and offer the picker — and a file chosen in
  // that state RESUMES the existing attempt, never starts a second upload.
  it('offers "Choose file to resume" on an adopted reselect_required row', async () => {
    const stalled = entry({ status: 'reselect_required', progress: 50 });
    renderUpload(queue({ entries: [stalled] }));

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    const resume = screen.getByRole('button', { name: 'Reselect clip.mp4 to resume' });
    expect(resume).toHaveTextContent('Choose file to resume');
  });

  it('routes a chosen file to reselectFiles, not enqueueFiles', async () => {
    const stalled = entry({ status: 'reselect_required', progress: 50 });
    const reselectFiles = jest.fn().mockResolvedValue(undefined);
    const enqueueFiles = jest.fn().mockResolvedValue({ accepted: [], rejected: [] });
    const api = queue({ entries: [stalled], reselectFiles, enqueueFiles });
    const { container } = renderUpload(api);

    // Adopted on mount; the picker now belongs to the stalled attempt.
    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();

    const file = new File(['0123456789'], 'clip.mp4', { type: 'video/mp4' });
    selectFile(container, file);

    await waitFor(() => expect(reselectFiles).toHaveBeenCalledWith([file]));
    expect(enqueueFiles).not.toHaveBeenCalled();
  });

  it('does not offer the resume picker on a normal uploading row', async () => {
    renderUpload(queue({ entries: [entry({ status: 'uploading' })] }));

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.queryByText('Choose file to resume')).not.toBeInTheDocument();
  });
});

describe('VideoUpload · adoption seeds the tags field', () => {
  it('joins the entry tags into the comma-separated input', async () => {
    const hydrated = entry({ tags: ['a', 'b'] });
    renderUpload(queue({ entries: [hydrated] }));

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Separate tags with commas')).toHaveValue('a, b');
  });

  it('leaves the tags input empty when the entry has none', async () => {
    renderUpload(queue({ entries: [entry({ tags: null })] }));

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Separate tags with commas')).toHaveValue('');
  });
});

describe('VideoUpload · metadata mirror sends isPublic only when it differs from the row', () => {
  // The mirror effect used to restate `isPublic` on every render. The render
  // right after adopting a rebuilt row re-PUT the row's own stored value over
  // whatever the creator had since set in Videos Management — in either
  // direction. Visibility now travels only when the form disagrees with the
  // row (or there is no row to disagree with yet).
  function mirrorCalls(api: UploadQueueApi, localId: string) {
    return (api.updateMetadata as jest.Mock).mock.calls
      .filter((call) => call[0] === localId)
      .map((call) => call[1] as Record<string, unknown>);
  }

  it('adopting a rebuilt row whose isPublic matches the seeded visibility mirrors WITHOUT an isPublic key', async () => {
    const hydrated = entry({ localId: 'resumed-1', title: 'Persisted', isPublic: true });
    const api = queue({ entries: [hydrated] });
    renderUpload(api);

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Public/ })).toHaveAttribute('aria-checked', 'true');

    await waitFor(() => expect(mirrorCalls(api, 'resumed-1').length).toBeGreaterThan(0));
    const calls = mirrorCalls(api, 'resumed-1');
    // The other fields still mirror…
    expect(calls[calls.length - 1]).toMatchObject({ title: 'Persisted' });
    // …but NOT visibility: the row already holds `true`, restating it would
    // clobber a newer change made elsewhere.
    for (const patch of calls) {
      expect(patch).not.toHaveProperty('isPublic');
    }
  });

  it('adopting a rebuilt PRIVATE row (seeded private) likewise sends no isPublic', async () => {
    const hydrated = entry({ localId: 'resumed-2', isPublic: false });
    const api = queue({ entries: [hydrated] });
    renderUpload(api);

    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Private/ })).toHaveAttribute('aria-checked', 'true');

    await waitFor(() => expect(mirrorCalls(api, 'resumed-2').length).toBeGreaterThan(0));
    for (const patch of mirrorCalls(api, 'resumed-2')) {
      expect(patch).not.toHaveProperty('isPublic');
    }
  });

  it('toggling visibility in the UI sends isPublic (the form now disagrees with the row)', async () => {
    const hydrated = entry({ localId: 'resumed-1', isPublic: true });
    const api = queue({ entries: [hydrated] });
    renderUpload(api);
    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();
    await waitFor(() => expect(mirrorCalls(api, 'resumed-1').length).toBeGreaterThan(0));
    const before = mirrorCalls(api, 'resumed-1').length;

    fireEvent.click(screen.getByRole('radio', { name: /Private/ }));

    await waitFor(() => expect(mirrorCalls(api, 'resumed-1').length).toBeGreaterThan(before));
    const latest = mirrorCalls(api, 'resumed-1').slice(-1)[0];
    expect(latest).toMatchObject({ isPublic: false });
  });

  it('toggling back to the row\'s stored value drops isPublic again', async () => {
    const hydrated = entry({ localId: 'resumed-1', isPublic: true });
    const api = queue({ entries: [hydrated] });
    renderUpload(api);
    expect(await screen.findByText('clip.mp4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /Private/ }));
    await waitFor(() =>
      expect(mirrorCalls(api, 'resumed-1').slice(-1)[0]).toMatchObject({ isPublic: false }),
    );

    fireEvent.click(screen.getByRole('radio', { name: /Public/ }));
    await waitFor(() => {
      const latest = mirrorCalls(api, 'resumed-1').slice(-1)[0];
      expect(latest).toMatchObject({ title: 'clip' });
      expect(latest).not.toHaveProperty('isPublic');
    });
  });

  it('a fresh in-session row (row isPublic false, page default public) gets isPublic:true on its FIRST mirror', async () => {
    // A brand-new row is created private by the queue; the page defaults to
    // public. The disagreement must reach the row, or the creator's default
    // is silently lost.
    const created = entry({ localId: 'new-1', isPublic: false });
    const enqueueFiles = jest.fn().mockResolvedValue({ accepted: [created], rejected: [] });
    const api = queue({ entries: [], enqueueFiles });
    const { container } = renderUpload(api);

    expect(screen.getByRole('radio', { name: /Public/ })).toHaveAttribute('aria-checked', 'true');
    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));
    await waitFor(() => expect(enqueueFiles).toHaveBeenCalled());

    await waitFor(() => expect(mirrorCalls(api, 'new-1').length).toBeGreaterThan(0));
    expect(mirrorCalls(api, 'new-1')[0]).toMatchObject({ isPublic: true });

    // Once the queue reports the row (still `false` until the PATCH lands),
    // the poll-driven re-render does not fire the mirror again on its own.
    const count = mirrorCalls(api, 'new-1').length;
    mockUseUploadQueueContext.mockReturnValue({ ...api, entries: [created] });
    rerenderUpload();
    expect(mirrorCalls(api, 'new-1').length).toBe(count);
  });
});

describe('VideoUpload · AI description assistant', () => {
  const AI_TEXT = [
    'A hook line.',
    '',
    '\u2022 A bullet',
    '\u2022 Another bullet',
    '',
    '#basetube #web3',
  ].join('\n');

  it('tells the generator what the page already knows', async () => {
    mockGenerateVideoDescription.mockResolvedValue({
      description: AI_TEXT,
      suggestedTitle: 'A Better Title',
      keywords: ['base'],
      hashtags: ['#basetube'],
    });
    renderUpload(queue());

    fireEvent.change(screen.getByPlaceholderText('Video title'), {
      target: { value: 'My clip' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'a rough draft' },
    });
    fireEvent.change(screen.getByPlaceholderText('Separate tags with commas'), {
      target: { value: 'web3, base' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Write with AI/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'stub-generate' }));

    await waitFor(() => expect(mockGenerateVideoDescription).toHaveBeenCalled());
    expect(mockGenerateVideoDescription).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My clip',
        existingDescription: 'a rough draft',
        tags: 'web3, base',
        channelName: 'Test channel',
        // The channel bio is stored as editor HTML; the generator gets prose.
        channelDescription: 'Weekly build logs',
        language: navigator.language,
      }),
    );
    // Nothing on the queue entry says how long the video is, so nothing is
    // claimed about it.
    expect(mockGenerateVideoDescription.mock.calls[0][0]).not.toHaveProperty('durationSeconds');

    await waitFor(() => expect(aiPanelProps?.hashtags).toEqual(['#basetube']));
    expect(aiPanelProps?.generatedKeywords).toEqual(['base']);
  });

  it('applies the AI text as paragraphs, blank lines and bullets intact', async () => {
    mockGenerateVideoDescription.mockResolvedValue({
      description: AI_TEXT,
      suggestedTitle: 'A Better Title',
    });
    renderUpload(queue());

    fireEvent.change(screen.getByPlaceholderText('Video title'), {
      target: { value: 'My clip' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Write with AI/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'stub-generate' }));

    fireEvent.click(await screen.findByRole('button', { name: 'stub-use-description' }));

    const editor = screen.getByLabelText('Description') as HTMLTextAreaElement;
    await waitFor(() =>
      expect(editor.value).toBe(
        '<p>A hook line.</p><p></p><p>\u2022 A bullet</p><p>\u2022 Another bullet</p>' +
          '<p></p><p>#basetube #web3</p>',
      ),
    );
  });
});
