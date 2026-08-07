/**
 * Regression tests — the two invariants codex's review caught being violated:
 *
 * 1. The number format (locale) is NEVER pre-selected. Detection only badges an
 *    option, and Continue stays disabled until the USER clicks one — the click
 *    is the confirmation the parser rules demand (a wrong format multiplies
 *    every value in the file by 1000).
 * 2. EVERY close path resets. The parent keeps the modal mounted, so a close
 *    that skipped reset would resurrect the flow — including a checked locale —
 *    on the next open.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsImportModal } from '../AnalyticsImportModal';
import ctrApi from '../../../../../../api/ctr';

jest.mock('framer-motion', () => {
  const ReactActual = require('react');
  return {
    motion: {
      div: ReactActual.forwardRef(
        (
          { children, initial, animate, exit, transition, ...rest }: Record<string, unknown>,
          ref: React.Ref<HTMLDivElement>
        ) => ReactActual.createElement('div', { ref, ...rest }, children as React.ReactNode)
      ),
    },
  };
});

// The guide step's dropzone internals are not under test — replace it with a
// button that hands a file straight to the modal's analyze flow.
jest.mock('../ImportGuideStep', () => {
  const ReactActual = require('react');
  return {
    __esModule: true,
    default: ({ onFile }: { onFile: (file: File) => void }) =>
      ReactActual.createElement(
        'button',
        { type: 'button', onClick: () => onFile(new File(['x'], 'export.csv')) },
        'mock-upload'
      ),
  };
});

jest.mock('../../../../../../api/ctr', () => ({
  __esModule: true,
  ANALYTICS_IMPORT_UNAVAILABLE: 'ANALYTICS_IMPORT_UNAVAILABLE',
  default: {
    analyzeAnalyticsImport: jest.fn(),
    confirmAnalyticsImport: jest.fn(),
    commitAnalyticsImport: jest.fn(),
  },
}));

const mockedApi = ctrApi as jest.Mocked<typeof ctrApi>;

const analysisFixture = (detectedLocale: string | null) => ({
  importId: 'imp_1',
  status: 'needs_confirmation' as const,
  needsMapping: false,
  detectedColumns: [],
  suggestedMapping: {},
  detectedCoverage: { kind: 'unknown' as const },
  detectedLocale,
  rowCount: 12,
});

/** Upload the mocked file and wait for the coverage step to appear. */
async function reachCoverageStep() {
  fireEvent.click(screen.getByText('mock-upload'));
  await waitFor(() => {
    expect(screen.getByText('How are numbers written in this file?')).toBeInTheDocument();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (mockedApi.analyzeAnalyticsImport as jest.Mock).mockResolvedValue(analysisFixture('fr'));
});

describe('AnalyticsImportModal — number format is a user click, never a prefill', () => {
  it('starts with NO locale selected, badges the detected option, and gates Continue on a click', async () => {
    render(<AnalyticsImportModal isOpen onClose={jest.fn()} onImported={jest.fn()} />);
    await reachCoverageStep();

    // Detection produced fr — but nothing is checked, only badged.
    const localeRadios = screen.getAllByRole('radio', { name: /thousands/ });
    localeRadios.forEach((radio) => expect(radio).not.toBeChecked());
    expect(screen.getByText('Looks like your file')).toBeInTheDocument();

    // A complete coverage answer alone must NOT unlock Continue…
    fireEvent.click(screen.getByRole('radio', { name: /Lifetime totals/ }));
    const confirmButton = screen.getByRole('button', { name: /Confirm range/ });
    expect(confirmButton).toBeDisabled();

    // …only the user's own format click does.
    fireEvent.click(screen.getByRole('radio', { name: /1 234,56/ }));
    expect(confirmButton).toBeEnabled();
  });

  it('shows no badge at all when the backend could not detect a locale', async () => {
    (mockedApi.analyzeAnalyticsImport as jest.Mock).mockResolvedValue(analysisFixture(null));
    render(<AnalyticsImportModal isOpen onClose={jest.fn()} onImported={jest.fn()} />);
    await reachCoverageStep();

    expect(screen.queryByText('Looks like your file')).not.toBeInTheDocument();
    expect(screen.getByText(/We could not tell from the file/)).toBeInTheDocument();
  });
});

describe('AnalyticsImportModal — every close path resets', () => {
  it('Escape mid-flow resets: reopening starts back at the guide with no locale', async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <AnalyticsImportModal isOpen onClose={onClose} onImported={jest.fn()} />
    );
    await reachCoverageStep();
    fireEvent.click(screen.getByRole('radio', { name: /1 234,56/ }));

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    // The parent keeps the component mounted — simulate close then reopen.
    rerender(<AnalyticsImportModal isOpen={false} onClose={onClose} onImported={jest.fn()} />);
    rerender(<AnalyticsImportModal isOpen onClose={onClose} onImported={jest.fn()} />);

    // Back at the guide step: no resurrected coverage step, no checked locale.
    expect(screen.getByText('mock-upload')).toBeInTheDocument();
    expect(
      screen.queryByText('How are numbers written in this file?')
    ).not.toBeInTheDocument();
  });

  it('the X button resets too', async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <AnalyticsImportModal isOpen onClose={onClose} onImported={jest.fn()} />
    );
    await reachCoverageStep();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();

    rerender(<AnalyticsImportModal isOpen={false} onClose={onClose} onImported={jest.fn()} />);
    rerender(<AnalyticsImportModal isOpen onClose={onClose} onImported={jest.fn()} />);

    expect(screen.getByText('mock-upload')).toBeInTheDocument();
  });
});
