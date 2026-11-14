import { FALLBACK_DEFINITIONS, helpSections } from '../businessHelp';

const titles = (sections: ReturnType<typeof helpSections>) => sections.map((s) => s.title);
const entry = (sections: ReturnType<typeof helpSections>, term: string) =>
  sections.flatMap((s) => s.entries).find((e) => e.term === term)?.sentence;

describe('helpSections', () => {
  it('groups every definition under a few plain headings', () => {
    expect(titles(helpSections(undefined))).toEqual([
      'Earnings',
      'Buyers and passes',
      'Visits and conversion',
      'Opened and watched',
      'Days and periods',
      'Privacy and contact',
    ]);
  });

  it("uses the API's sentences when it answers, in the screens' words", () => {
    const sections = helpSections({ buyer: 'A buyer is anyone who paid.', refunded: 'Refunds come out of your share.' });
    expect(entry(sections, 'Buyers')).toBe('A buyer is anyone who paid.');
    expect(entry(sections, 'Refunded')).toBe('Refunds come out of your earnings.');
  });

  it('falls back to the sentences kept in the app when the API does not answer', () => {
    const sections = helpSections(undefined);
    expect(entry(sections, 'Visits')).toBe(FALLBACK_DEFINITIONS.visits);
    expect(entry(sections, 'Can email')).toBe(FALLBACK_DEFINITIONS.canContact);
    // Blank API sentences do not erase the kept ones.
    expect(entry(helpSections({ visits: '  ' }), 'Visits')).toBe(FALLBACK_DEFINITIONS.visits);
  });

  it('opens with the earnings sentence, the fee percentage and the card-fee line, and lists no fee, gross or net term', () => {
    const sections = helpSections(undefined);
    expect(sections[0].entries[0].term).toBe('Your earnings');
    expect(sections[0].entries[0].sentence).toContain("BaseTube's 10% fee");
    expect(sections[0].entries[0].sentence).toContain('before the card processing fee');
    const terms = sections.flatMap((s) => s.entries.map((e) => e.term));
    expect(terms.join(' ')).not.toMatch(/gross|net received|processing fee|platform fee/i);
    expect(new Set(terms).size).toBe(terms.length);
  });
});
