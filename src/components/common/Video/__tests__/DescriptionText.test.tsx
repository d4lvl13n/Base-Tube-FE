import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DescriptionText from '../DescriptionText';
import { descriptionToPreview } from '../../../../utils/descriptionText';

/** What the TipTap editor actually stores: one `<p>` per line, `•` as text. */
const EDITOR_HTML = [
  '<p>Bienvenue sur la chaine, toutes nos videos sont filmees en 4K</p>',
  '<p></p>',
  '<p>Abonnez-vous pour ne rien rater</p>',
  '<p></p>',
  '<p>• Camera : Sony A7</p>',
  '<p>• Montage : DaVinci</p>',
  '<p></p>',
  '<p>Plus d infos : https://base.tube/creators</p>',
  '<p></p>',
  '<p>#base #tube</p>',
].join('');

function renderDescription(props: React.ComponentProps<typeof DescriptionText>) {
  return render(
    <MemoryRouter>
      <DescriptionText {...props} />
    </MemoryRouter>,
  );
}

describe('DescriptionText with editor HTML', () => {
  // The whole point: the two sentences are two paragraphs. The old dock ran
  // them together as "…filmees en 4KAbonnez-vous…".
  it('renders one paragraph per line, with the blank lines respected', () => {
    const { container } = renderDescription({ content: EDITOR_HTML });

    const first = screen.getByText('Bienvenue sur la chaine, toutes nos videos sont filmees en 4K');
    const second = screen.getByText('Abonnez-vous pour ne rien rater');

    // Two paragraphs, not one run-on line: separate `<p>` elements, each with
    // the spacing that Tailwind's preflight had stripped from the old markup.
    expect(first.tagName).toBe('P');
    expect(second.tagName).toBe('P');
    expect(first).not.toBe(second);
    expect(first).toHaveClass('mb-3');
    expect(first).toHaveClass('whitespace-pre-wrap');
    expect(container.querySelectorAll('p').length).toBeGreaterThanOrEqual(2);
  });

  it('turns the bullet lines into one real list', () => {
    renderDescription({ content: EDITOR_HTML });

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Camera : Sony A7');
    expect(items[1]).toHaveTextContent('Montage : DaVinci');
  });

  it('renders the trailing hashtag line as links to search', () => {
    renderDescription({ content: EDITOR_HTML });

    expect(screen.getByRole('link', { name: '#base' })).toHaveAttribute(
      'href',
      '/search?query=%23base',
    );
    expect(screen.getByRole('link', { name: '#tube' })).toHaveAttribute(
      'href',
      '/search?query=%23tube',
    );
  });

  it('autolinks URLs safely', () => {
    renderDescription({ content: EDITOR_HTML });

    const link = screen.getByRole('link', { name: 'https://base.tube/creators' });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
  });

  // Nothing in a description is ever markup. A creator who types a tag gets
  // the tag back as text, not an element.
  it('never interprets the description as HTML', () => {
    const { container } = renderDescription({
      content: '<p>&lt;img src=x onerror=boom&gt; hello</p>',
    });

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=boom> hello')).toBeInTheDocument();
  });
});

describe('DescriptionText with legacy plain text', () => {
  it('renders \\n-separated plain text as paragraphs and bullets', () => {
    renderDescription({
      content: 'Premiere ligne\n\nDeuxieme ligne\n\n• un point\n• un autre\n\n#legacy',
    });

    expect(screen.getByText('Premiere ligne').tagName).toBe('P');
    expect(screen.getByText('Deuxieme ligne').tagName).toBe('P');
    expect(screen.getByText('Premiere ligne')).not.toBe(screen.getByText('Deuxieme ligne'));
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: '#legacy' })).toBeInTheDocument();
  });

  it('says so when there is nothing to show', () => {
    renderDescription({ content: '', emptyText: 'No description provided' });
    expect(screen.getByText('No description provided')).toBeInTheDocument();
  });
});

describe('DescriptionText truncation', () => {
  it('shows the opening block behind a Show more, and expands in place', () => {
    renderDescription({ content: EDITOR_HTML, collapsible: true });

    expect(
      screen.getByText('Bienvenue sur la chaine, toutes nos videos sont filmees en 4K'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Abonnez-vous pour ne rien rater')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));

    expect(screen.getByText('Abonnez-vous pour ne rien rater')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText('Abonnez-vous pour ne rien rater')).not.toBeInTheDocument();
  });

  it('leaves a short description alone', () => {
    renderDescription({ content: '<p>One line only</p>', collapsible: true });

    expect(screen.getByText('One line only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  // One unbroken paragraph is one line, so the line count alone never offered
  // a way out of it and the description filled the dock.
  it('offers Show more for a single very long line', () => {
    const wall = 'mot '.repeat(200).trim();
    renderDescription({ content: `<p>${wall}</p>`, collapsible: true });

    expect(wall.length).toBeGreaterThan(600);
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });

  it('clamps the collapsed block so the toggle changes something', () => {
    const wall = 'mot '.repeat(200).trim();
    const { container } = renderDescription({ content: `<p>${wall}</p>`, collapsible: true });

    expect(container.querySelector('.line-clamp-4')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(container.querySelector('.line-clamp-4')).toBeNull();
  });

  it('still leaves a short single line alone', () => {
    renderDescription({ content: '<p>' + 'a'.repeat(400) + '</p>', collapsible: true });
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });
});

describe('DescriptionText autolinking', () => {
  it('links an explicit http and https URL', () => {
    renderDescription({ content: '<p>See https://base.tube/a and http://example.com/b</p>' });

    expect(screen.getByRole('link', { name: 'https://base.tube/a' })).toHaveAttribute(
      'href',
      'https://base.tube/a',
    );
    expect(screen.getByRole('link', { name: 'http://example.com/b' })).toHaveAttribute(
      'href',
      'http://example.com/b',
    );
  });

  // A bare www. had to be given a scheme on the creator's behalf, and it
  // caught things that were never links.
  it('leaves a bare www. as text', () => {
    renderDescription({ content: '<p>Visit www.base.tube for more</p>' });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Visit www.base.tube for more')).toBeInTheDocument();
  });

  it('does not autolink other schemes', () => {
    renderDescription({ content: '<p>javascript:alert(1) and mailto:a@b.c and ftp://x.y</p>' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps the sentence punctuation out of the href', () => {
    renderDescription({ content: '<p>Go to https://base.tube/creators.</p>' });

    const link = screen.getByRole('link', { name: 'https://base.tube/creators' });
    expect(link).toHaveAttribute('href', 'https://base.tube/creators');
  });
});

describe('descriptionToPreview', () => {
  // The Videos Management cell. Line breaks become spaces, or the preview
  // reads "…filmees en 4KAbonnez-vous…" — two sentences welded into a word.
  it('strips the tags and joins the lines with spaces', () => {
    expect(descriptionToPreview(EDITOR_HTML)).toBe(
      'Bienvenue sur la chaine, toutes nos videos sont filmees en 4K ' +
        'Abonnez-vous pour ne rien rater • Camera : Sony A7 • Montage : DaVinci ' +
        'Plus d infos : https://base.tube/creators #base #tube',
    );
  });

  it('handles legacy plain text and empty input', () => {
    expect(descriptionToPreview('a\nb')).toBe('a b');
    expect(descriptionToPreview(undefined)).toBe('');
  });
});

describe('DescriptionText preview mode', () => {
  // The player overlay already has its own "View more"; a second toggle in the
  // same box would be two ways to do one thing.
  it('shows the opening block and no toggle', () => {
    renderDescription({ content: EDITOR_HTML, previewOnly: true });

    expect(
      screen.getByText('Bienvenue sur la chaine, toutes nos videos sont filmees en 4K'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Abonnez-vous pour ne rien rater')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
