import React from 'react';
import { render, screen } from '@testing-library/react';
import { Play } from 'lucide-react';
import StatsCard from '../StatsCard';

// CRA's jest preset runs with resetMocks: true, which wipes the
// window.matchMedia implementation installed by setupTests before each test.
// framer-motion reads it on mount, so re-install it here.
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
      dispatchEvent: () => false
    })
  });
});

describe('StatsCard trend badge', () => {
  it('renders no badge when `change` is omitted', () => {
    const { container } = render(<StatsCard icon={Play} title="Views" value="123" />);
    expect(container.textContent).not.toMatch(/[↑↓]/);
    expect(container.textContent).not.toContain('%');
  });

  it('renders no badge for 0, null, Infinity or NaN', () => {
    for (const change of [0, null, Infinity, -Infinity, NaN] as const) {
      const { container, unmount } = render(
        <StatsCard icon={Play} title="Views" value="123" change={change as number} />
      );
      expect(container.textContent).not.toMatch(/[↑↓]/);
      expect(container.textContent).not.toContain('Infinity');
      expect(container.textContent).not.toContain('NaN');
      unmount();
    }
  });

  it('renders a real percentage', () => {
    render(<StatsCard icon={Play} title="Views" value="123" change={12} />);
    expect(screen.getByText(/↑\s*12%/)).toBeInTheDocument();
  });

  it('renders a negative percentage as a down badge', () => {
    render(<StatsCard icon={Play} title="Views" value="123" change={-7} />);
    expect(screen.getByText(/↓\s*7%/)).toBeInTheDocument();
  });

  it('never prints Infinity or NaN coming from the value itself', () => {
    const { container } = render(
      <StatsCard icon={Play} title="Interaction rate" value="—" subtitle="0 views" />
    );
    expect(container.textContent).not.toContain('Infinity');
    expect(container.textContent).not.toContain('NaN');
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
