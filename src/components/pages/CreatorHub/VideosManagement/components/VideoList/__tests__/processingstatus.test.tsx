import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ProcessingVideo } from '../../../../../../../hooks/useVideoProcessing';
import { ProcessingStatus, phaseText } from '../processingstatus';

function row(overrides: Partial<ProcessingVideo> = {}): ProcessingVideo {
  return { videoId: 42, status: 'processing', renditions: [], ...overrides };
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
});

describe('ProcessingStatus', () => {
  it('says `inspecting` while the server has not decided what to make', () => {
    render(<ProcessingStatus videoId={42} processingStatus={row()} />);

    expect(screen.getByText('Processing · inspecting')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Processing');
    // No percentage anywhere — the bar pulses instead of claiming progress.
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('names the rendition being transcoded', () => {
    render(
      <ProcessingStatus
        videoId={42}
        processingStatus={row({
          renditions: [
            { quality: '480p', state: 'verified' },
            { quality: '720p', state: 'in_progress' },
          ],
        })}
      />,
    );

    expect(screen.getByText('Processing · transcoding 720p')).toBeInTheDocument();
  });

  it('reads a passthrough video as Ready, never as transcoding', () => {
    const passthrough = row({ status: 'processed', renditions: [] });

    expect(phaseText(passthrough)).toBe('Ready');

    render(<ProcessingStatus videoId={42} processingStatus={passthrough} />);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.queryByText(/transcoding/)).not.toBeInTheDocument();
    // Ready is an acknowledgement, not a state: no bar under it.
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('gives the reason a failure failed, plus a retry', async () => {
    const onRetry = jest.fn().mockResolvedValue(undefined);
    render(
      <ProcessingStatus
        videoId={42}
        processingStatus={row({ status: 'failed', error: { message: 'unsupported codec' } })}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('Failed · unsupported codec')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry processing' }));
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1));
  });

  it('falls back to a plain reason when the backend sent none', () => {
    render(<ProcessingStatus videoId={42} processingStatus={row({ status: 'failed' })} />);

    expect(screen.getByText('Failed · processing failed')).toBeInTheDocument();
  });

  it('renders nothing without a progress row', () => {
    const { container } = render(<ProcessingStatus videoId={42} />);

    expect(container).toBeEmptyDOMElement();
  });
});
