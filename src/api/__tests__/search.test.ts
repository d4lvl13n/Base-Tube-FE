import { buildSearchQuery } from '../search';

describe('buildSearchQuery', () => {
  it('always sends a query, so an empty one browses newest', () => {
    expect(buildSearchQuery({}).toString()).toBe('query=');
    expect(buildSearchQuery({ query: '' }).toString()).toBe('query=');
  });

  it('repeats category once per value', () => {
    expect(buildSearchQuery({ query: 'x', categories: ['Gaming', 'Sport'] }).getAll('category')).toEqual([
      'Gaming',
      'Sport',
    ]);
    expect(buildSearchQuery({ query: 'x', categories: ['Gaming'] }).toString()).toBe(
      'query=x&category=Gaming'
    );
  });

  it('omits page 1 and the filters that were not set', () => {
    expect(buildSearchQuery({ query: 'x', page: 1 }).toString()).toBe('query=x');
    expect(buildSearchQuery({ query: 'x', page: 3 }).get('page')).toBe('3');
    expect(buildSearchQuery({ query: 'x' }).has('minDuration')).toBe(false);
    expect(buildSearchQuery({ query: 'x' }).has('sort')).toBe(false);
  });

  it('keeps a zero minDuration, which is not the same as no minimum', () => {
    expect(buildSearchQuery({ query: 'x', minDuration: 0, maxDuration: 240 }).toString()).toBe(
      'query=x&minDuration=0&maxDuration=240'
    );
  });

  it('encodes a hashtag query rather than dropping it at the fragment', () => {
    expect(buildSearchQuery({ query: '#marrakech' }).toString()).toBe('query=%23marrakech');
  });

  it('carries the channel and the sort through', () => {
    const params = buildSearchQuery({ query: 'x', channelId: 66, sort: 'trending', limit: 20 });
    expect(params.get('channelId')).toBe('66');
    expect(params.get('sort')).toBe('trending');
    expect(params.get('limit')).toBe('20');
  });
});
