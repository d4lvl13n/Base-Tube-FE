import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  readFilters,
  toSearchOptions,
  toggleCategory,
  writeFilters,
} from '../searchParams';

describe('readFilters', () => {
  it('reads the query, sort, categories and duration out of the URL', () => {
    const filters = readFilters(
      new URLSearchParams('query=marrakech&sort=views&category=Gaming&category=Sport&duration=medium')
    );

    expect(filters).toEqual({
      query: 'marrakech',
      sort: 'views',
      categories: ['Gaming', 'Sport'],
      duration: 'medium',
      channelId: null,
    });
  });

  it('falls back to the defaults for a missing or unknown value', () => {
    expect(readFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
    expect(readFilters(new URLSearchParams('sort=bogus&duration=forever')).sort).toBe('relevance');
    expect(readFilters(new URLSearchParams('sort=bogus&duration=forever')).duration).toBeNull();
  });

  it('still understands the legacy sort=date', () => {
    expect(readFilters(new URLSearchParams('sort=date')).sort).toBe('newest');
  });

  it('keeps a hashtag query intact', () => {
    expect(readFilters(new URLSearchParams('query=%23marrakech')).query).toBe('#marrakech');
  });
});

describe('writeFilters', () => {
  it('writes one category param per value', () => {
    const params = writeFilters({
      query: 'marrakech',
      sort: 'newest',
      categories: ['Gaming', 'Sport'],
      duration: 'short',
      channelId: null,
    });

    expect(params.toString()).toBe(
      'query=marrakech&sort=newest&category=Gaming&category=Sport&duration=short'
    );
  });

  it('leaves defaults out of the URL', () => {
    expect(writeFilters({ ...DEFAULT_FILTERS, query: 'marrakech' }).toString()).toBe(
      'query=marrakech'
    );
  });

  it('percent-encodes a hashtag query so it is not read as a fragment', () => {
    expect(writeFilters({ ...DEFAULT_FILTERS, query: '#marrakech' }).toString()).toBe(
      'query=%23marrakech'
    );
  });

  it('round-trips through readFilters', () => {
    const filters = {
      query: '#travel',
      sort: 'trending' as const,
      categories: ['Travel and events'],
      duration: 'long' as const,
      channelId: 66,
    };
    expect(readFilters(writeFilters(filters))).toEqual(filters);
  });
});

describe('toSearchOptions', () => {
  it('turns a duration bucket into the min/max the API takes', () => {
    expect(toSearchOptions({ ...DEFAULT_FILTERS, duration: 'short' }, 1, 20)).toMatchObject({
      minDuration: undefined,
      maxDuration: 240,
    });
    expect(toSearchOptions({ ...DEFAULT_FILTERS, duration: 'medium' }, 1, 20)).toMatchObject({
      minDuration: 240,
      maxDuration: 1200,
    });
    expect(toSearchOptions({ ...DEFAULT_FILTERS, duration: 'long' }, 1, 20)).toMatchObject({
      minDuration: 1200,
      maxDuration: undefined,
    });
  });

  it('passes the page, limit, sort and categories through', () => {
    expect(
      toSearchOptions({ ...DEFAULT_FILTERS, query: 'marrakech', sort: 'views', categories: ['Gaming'] }, 3, 20)
    ).toMatchObject({ query: 'marrakech', page: 3, limit: 20, sort: 'views', categories: ['Gaming'] });
  });
});

describe('filter helpers', () => {
  it('toggles a category on and off', () => {
    expect(toggleCategory([], 'Gaming')).toEqual(['Gaming']);
    expect(toggleCategory(['Gaming', 'Sport'], 'Gaming')).toEqual(['Sport']);
  });

  it('does not count the query itself as a filter', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: 'marrakech' })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, duration: 'short' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, categories: ['Gaming'] })).toBe(true);
  });
});
