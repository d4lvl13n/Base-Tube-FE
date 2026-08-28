import React from 'react';
import { render, screen } from '@testing-library/react';
import type { UploadQueueApi } from '../../../hooks/useUploadQueue';
import UploadQueuePanel from '../UploadQueuePanel';
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
    ...overrides,
  } as unknown as UploadQueueApi;
}

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
