import React from 'react';
import { render, screen } from '@testing-library/react';
import Highlight, { splitHighlight } from '../Highlight';

describe('splitHighlight', () => {
  it('splits marked runs out of plain text', () => {
    expect(splitHighlight('<mark>Marra</mark>kech in 4K')).toEqual([
      { text: 'Marra', marked: true },
      { text: 'kech in 4K', marked: false },
    ]);
  });

  it('returns one plain run when there is nothing to mark', () => {
    expect(splitHighlight('Marrakech')).toEqual([{ text: 'Marrakech', marked: false }]);
  });

  it('handles several marks in one string', () => {
    expect(splitHighlight('a <mark>b</mark> c <mark>d</mark>')).toEqual([
      { text: 'a ', marked: false },
      { text: 'b', marked: true },
      { text: ' c ', marked: false },
      { text: 'd', marked: true },
    ]);
  });

  it('degrades quietly on unbalanced tags', () => {
    expect(splitHighlight('</mark>loose')).toEqual([{ text: 'loose', marked: false }]);
    expect(splitHighlight('open <mark>rest')).toEqual([
      { text: 'open ', marked: false },
      { text: 'rest', marked: true },
    ]);
  });

  it('is empty for an empty string', () => {
    expect(splitHighlight('')).toEqual([]);
  });
});

describe('<Highlight />', () => {
  it('renders marked runs inside a mark element', () => {
    render(<Highlight text="<mark>Marra</mark>kech" />);
    expect(screen.getByText('Marra').tagName).toBe('MARK');
    expect(screen.getByText(/kech/)).toBeInTheDocument();
  });

  it('renders any other markup as text, never as DOM', () => {
    const { container } = render(
      <Highlight text={'<mark>hi</mark> <img src="x" onerror="alert(1)"><script>bad()</script>'} />
    );

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<img src="x" onerror="alert(1)">');
    expect(container.textContent).toContain('<script>bad()</script>');
  });

  it('does not treat a bare angle bracket as a tag', () => {
    const { container } = render(<Highlight text="3 < 4 and 5 > 4" />);
    expect(container.textContent).toBe('3 < 4 and 5 > 4');
  });
});
