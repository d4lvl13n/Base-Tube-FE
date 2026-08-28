import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { UploadQueueApi, UploadQueueViewEntry } from '../../../../hooks/useUploadQueue';
import VideoUpload from '../VideoUpload';
import VideoActions from '../VideosManagement/components/VideoActions';

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
    // The queue is the source of truth for the row; the page only shows the
    // entry once its own `enqueueFiles` has claimed the localId.
    const api = queue({ enqueueFiles, entries: [created] });
    const { container } = renderUpload(api);

    expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument();

    const file = new File(['bytes'], 'clip.mp4', { type: 'video/mp4' });
    selectFile(container, file);

    await waitFor(() => expect(enqueueFiles).toHaveBeenCalledWith([file], 7));

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
    const api = queue({
      entries: [created],
      enqueueFiles: jest.fn().mockResolvedValue({ accepted: [created], rejected: [] }),
      abortEntry: jest.fn().mockResolvedValue(true),
    });
    const { container } = renderUpload(api);

    selectFile(container, new File(['bytes'], 'clip.mp4', { type: 'video/mp4' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel clip.mp4' }));

    await waitFor(() => expect(api.abortEntry).toHaveBeenCalledWith('local-1'));
    await waitFor(() => expect(api.removeEntry).toHaveBeenCalledWith('local-1'));
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

describe('VideoActions', () => {
  it('links to the real upload route', () => {
    render(
      <MemoryRouter>
        <VideoActions selectedVideos={[]} onBulkAction={jest.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Upload Video/i })).toHaveAttribute(
      'href',
      '/creator-hub/upload',
    );
  });
});
