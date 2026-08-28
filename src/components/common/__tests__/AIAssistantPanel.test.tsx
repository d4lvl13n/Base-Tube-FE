import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AIAssistantPanel from '../AIAssistantPanel';

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

const DESCRIPTION = [
  'Ten minutes that change how you think about on-chain video.',
  '',
  'We walk through the whole pipeline, end to end.',
  '',
  '• Direct-to-storage uploads',
  '• Token-gated playback',
  '',
  'Subscribe for a build log every week.',
  '',
  '#basetube #web3 #creators',
].join('\n');

function renderPanel(overrides: Partial<React.ComponentProps<typeof AIAssistantPanel>> = {}) {
  const props: React.ComponentProps<typeof AIAssistantPanel> = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'My clip',
    keywords: '',
    additionalInfo: '',
    onKeywordsChange: jest.fn(),
    onAdditionalInfoChange: jest.fn(),
    onGenerate: jest.fn(),
    isGenerating: false,
    mode: 'video',
    ...overrides,
  };
  return { ...render(<AIAssistantPanel {...props} />), props };
}

describe('AIAssistantPanel', () => {
  it('renders the description with its line breaks preserved', () => {
    renderPanel({ generatedDescription: DESCRIPTION });

    const body = screen.getByTestId('ai-generated-description');
    // The text is not flattened: the blank lines and bullets are still there…
    expect(body.textContent).toBe(DESCRIPTION);
    // …and CSS is what shows them, so `whitespace-pre-wrap` is load-bearing.
    expect(body.className).toContain('whitespace-pre-wrap');
  });

  it('shows the hashtags as chips under the description', () => {
    renderPanel({
      generatedDescription: DESCRIPTION,
      hashtags: ['#basetube', 'web3'],
    });

    const chips = screen.getByTestId('ai-hashtags');
    expect(chips).toHaveTextContent('#basetube');
    // A hashtag the backend sent bare still reads as one.
    expect(chips).toHaveTextContent('#web3');
  });

  it('shows the suggested keywords as chips', () => {
    renderPanel({
      generatedDescription: DESCRIPTION,
      generatedKeywords: ['on-chain video', 'creator economy'],
    });

    const chips = screen.getByTestId('ai-keywords');
    expect(chips).toHaveTextContent('on-chain video');
    expect(chips).toHaveTextContent('creator economy');
  });

  it('"Use This Title" hands the suggestion back', () => {
    const onAcceptTitle = jest.fn();
    renderPanel({ suggestedTitle: 'A Much Better Title', onAcceptTitle });

    expect(screen.getByText('A Much Better Title')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /use this title/i }));

    expect(onAcceptTitle).toHaveBeenCalledTimes(1);
  });

  it('"Use description" applies the full text when the draft is empty', () => {
    const onAcceptDescription = jest.fn();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    renderPanel({
      generatedDescription: DESCRIPTION,
      onAcceptDescription,
      hasExistingDescription: false,
    });

    fireEvent.click(screen.getByRole('button', { name: /use description/i }));

    expect(onAcceptDescription).toHaveBeenCalledWith(DESCRIPTION);
    // Nothing to lose, so nothing to ask.
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('asks before replacing a draft, and does nothing if the answer is no', () => {
    const onAcceptDescription = jest.fn();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderPanel({
      generatedDescription: DESCRIPTION,
      onAcceptDescription,
      hasExistingDescription: true,
    });

    fireEvent.click(screen.getByRole('button', { name: /use description/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onAcceptDescription).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /use description/i }));
    expect(onAcceptDescription).toHaveBeenCalledWith(DESCRIPTION);
    confirmSpy.mockRestore();
  });

  it('offers no "Use description" button to screens that cannot apply one', () => {
    // The channel and pass screens do not pass `onAcceptDescription`, so their
    // copy-and-paste flow is unchanged.
    renderPanel({ mode: 'channel', generatedDescription: DESCRIPTION });

    expect(screen.queryByRole('button', { name: /use description/i })).toBeNull();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('Regenerate asks for another draft, same as Generate', () => {
    const onGenerate = jest.fn();
    renderPanel({ generatedDescription: DESCRIPTION, onGenerate });

    fireEvent.click(screen.getByRole('button', { name: /regenerate/i }));
    fireEvent.click(screen.getByRole('button', { name: /generate content/i }));

    expect(onGenerate).toHaveBeenCalledTimes(2);
  });

  it('waits with skeleton lines, not a spinner', () => {
    renderPanel({ isGenerating: true });

    expect(screen.getByTestId('ai-description-skeleton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });

  it('renders nothing when closed', () => {
    renderPanel({ isOpen: false, generatedDescription: DESCRIPTION });

    expect(screen.queryByTestId('ai-generated-description')).toBeNull();
  });
});
