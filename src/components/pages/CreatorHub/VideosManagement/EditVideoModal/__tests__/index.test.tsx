import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Video } from '../../../../../../types/video';
import EditVideoModal from '../index';

const mockGetVideoById = jest.fn();
const mockOnUpdate = jest.fn();
const mockOnClose = jest.fn();
const mockOnDelete = jest.fn();

jest.mock('../../../../../../api/video', () => ({
  getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
  generateVideoDescription: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// TipTap needs a real editing surface; the page only needs a value and a
// change event, and the editor's own behaviour is covered by its own tests.
jest.mock('../../../../../common/RichTextEditor', () => ({
  __esModule: true,
  default: ({ content, onChange }: { content: string; onChange: (value: string) => void }) => (
    <textarea
      aria-label="Description"
      value={content}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

jest.mock('../../../../../common/AIAssistantPanel', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../../../common/AIThumbnailPanel', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../../../../hooks/useAIthumbnail', () => ({
  useAIthumbnail: () => ({
    generateForVideo: jest.fn(),
    generateFromPrompt: jest.fn(),
    generateWithReference: jest.fn(),
    refineThumbnail: jest.fn(),
    isGeneratingForVideo: false,
    isGeneratingFromPrompt: false,
    isGeneratingWithReference: false,
    isRefiningThumbnail: false,
  }),
}));

function video(overrides: Partial<Video> = {}): Video {
  return {
    id: 12,
    channel_id: 7,
    title: 'Marrakech en 4K',
    description: '<p>Souks et médina</p>',
    tags: 'travel',
    duration: 254,
    views_count: 10,
    likes_count: 2,
    is_public: false,
    status: 'processed',
    createdAt: '2026-08-21T10:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z',
    thumbnail_url: 'https://cdn.example/thumb.jpg',
    video_url: 'https://cdn.example/video.mp4',
    video_urls: { '1080p': 'https://cdn.example/1080.mp4' },
    ...overrides,
  } as Video;
}

function renderEditor(overrides: Partial<Video> = {}, withDelete = true) {
  return render(
    <MemoryRouter>
      <EditVideoModal
        video={video(overrides)}
        isOpen
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={withDelete ? mockOnDelete : undefined}
      />
    </MemoryRouter>,
  );
}

/** The FormData the page handed to `onUpdate`. */
function submitted(): FormData {
  return mockOnUpdate.mock.calls[0][1] as FormData;
}

beforeEach(() => {
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
  mockGetVideoById.mockResolvedValue(video());
  mockOnUpdate.mockResolvedValue(undefined);
});

describe('EditVideoModal header', () => {
  // Save is the one orange thing on the page; it must not invite a click that
  // would send an unchanged form.
  it('keeps Save disabled until something has actually changed', async () => {
    renderEditor();

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Discard' })).toBeNull();
    expect(screen.queryByText('Unsaved changes')).toBeNull();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A new title' } });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled());
    expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('puts everything back when the creator discards', async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A new title' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Discard' }));

    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Marrakech en 4K');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('names the video, its state and when it was last touched', () => {
    renderEditor();

    expect(screen.getByRole('heading', { name: 'Marrakech en 4K' })).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText(/Updated Aug 29/)).toBeInTheDocument();
  });

  it.each([
    ['processing', 'Processing'],
    ['pending', 'Processing'],
    ['failed', 'Failed'],
    ['completed', 'Processed'],
  ] as const)('reads %s as %s', (status, label) => {
    renderEditor({ status });

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('EditVideoModal saving', () => {
  it('sends the fields the endpoint accepts, and never a video file', async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Marrakech, revisited' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockOnUpdate).toHaveBeenCalled());
    expect(mockOnUpdate.mock.calls[0][0]).toBe('12');
    const body = submitted();
    expect(body.get('title')).toBe('Marrakech, revisited');
    expect(body.get('description')).toBe('<p>Souks et médina</p>');
    expect(body.get('tags')).toBe('travel');
    expect(body.get('is_public')).toBe('false');
    // `PUT /videos/:id` rejects a `video` field outright — the page must never
    // offer to send one, and must never send one.
    expect(body.get('video')).toBeNull();
    expect(body.has('video')).toBe(false);
  });

  it('offers no way to replace the source file', () => {
    renderEditor();

    expect(screen.queryByText(/Replace source video/i)).toBeNull();
    expect(screen.queryByText(/To replace the file/i)).toBeNull();
  });

  // ⌘S is what anyone with a form in front of them presses.
  it('saves on ⌘S once there is something to save', async () => {
    renderEditor();

    fireEvent.keyDown(window, { key: 's', metaKey: true });
    expect(mockOnUpdate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Saved by keyboard' } });
    fireEvent.keyDown(window, { key: 's', metaKey: true });

    await waitFor(() => expect(mockOnUpdate).toHaveBeenCalledTimes(1));
    expect(submitted().get('title')).toBe('Saved by keyboard');
  });

  it('saves on Ctrl-S too', async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Saved by keyboard' } });
    fireEvent.keyDown(window, { key: 'S', ctrlKey: true });

    await waitFor(() => expect(mockOnUpdate).toHaveBeenCalledTimes(1));
  });

  it('refuses to save a form it knows is incomplete', async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '   ' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});

describe('EditVideoModal leaving', () => {
  it('goes straight back when nothing has changed', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  // Never `window.confirm`: it blocks the page thread and cannot be driven.
  it('asks before throwing away unsaved edits', async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A new title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('leaves when the creator says to discard them', async () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A new title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Discard changes' }));

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('EditVideoModal preview', () => {
  // The page opens on a poster, not on a browser video widget: a raw <video>
  // with controls is the loudest thing on any screen it lands on.
  it('shows the poster first and swaps in the player on click', async () => {
    const view = renderEditor();

    /* eslint-disable testing-library/no-node-access, testing-library/no-container */
    expect(view.container.querySelector('video')).toBeNull();
    /* eslint-enable testing-library/no-node-access, testing-library/no-container */
    const play = screen.getByRole('button', { name: 'Play video' });

    fireEvent.click(play);

    /* eslint-disable testing-library/no-node-access, testing-library/no-container */
    await waitFor(() => expect(view.container.querySelector('video')).not.toBeNull());
    const player = view.container.querySelector('video');
    /* eslint-enable testing-library/no-node-access, testing-library/no-container */
    expect(player).toHaveAttribute('poster', 'https://cdn.example/thumb.jpg');
    expect(player).toHaveAttribute('controls');
    // Nothing plays without a click; there is no autoplay attribute.
    expect(player).not.toHaveAttribute('autoplay');
  });

  it('does not offer to play a video it has no URL for', () => {
    renderEditor({ video_url: undefined, video_urls: undefined });

    expect(screen.getByRole('button', { name: 'Preview unavailable' })).toBeDisabled();
  });

  it('says what it knows about the file and nothing it does not', () => {
    renderEditor();

    expect(screen.getByText('4:14')).toBeInTheDocument();
    expect(screen.getByText('1080p')).toBeInTheDocument();
    expect(screen.getByText('Uploaded Aug 21')).toBeInTheDocument();
  });

  it('omits the resolution when no rendition says what it is', () => {
    renderEditor({ video_urls: undefined });

    expect(screen.getByText('4:14')).toBeInTheDocument();
    expect(screen.queryByText('1080p')).toBeNull();
  });
});

describe('EditVideoModal visibility', () => {
  it('flips between public and private', async () => {
    renderEditor();

    const control = screen.getByRole('switch');
    expect(control).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(control);

    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockOnUpdate).toHaveBeenCalled());
    expect(submitted().get('is_public')).toBe('true');
  });

  // A video nobody can play must not be publishable — the server refuses it,
  // and the control should say so rather than let the creator find out.
  it('cannot publish a video that is still processing', () => {
    renderEditor({ status: 'processing', is_public: false });

    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.getByText(/finished processing/i)).toBeInTheDocument();
  });
});

describe('EditVideoModal danger zone', () => {
  it('hands the delete back to the page that owns the list', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: /Delete video/ }));

    expect(mockOnDelete).toHaveBeenCalledWith(12);
  });

  it('shows nothing to delete when the page cannot handle one', () => {
    renderEditor({}, false);

    expect(screen.queryByRole('button', { name: /Delete video/ })).toBeNull();
  });
});
