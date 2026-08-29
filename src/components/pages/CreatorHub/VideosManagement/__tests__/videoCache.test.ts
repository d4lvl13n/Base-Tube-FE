import { QueryClient } from '@tanstack/react-query';
import type { Video } from '../../../../../types/video';
import {
  ChannelVideoPage,
  ChannelVideoPages,
  channelVideosKey,
  dropInactiveChannelVideos,
  matchesChannelVideoQuery,
  mergeDefined,
  patchCachedChannelVideos,
  removeCachedChannelVideos,
} from '../videoCache';

const CHANNEL = '7';

function video(overrides: Partial<Video> = {}): Video {
  return {
    id: 1,
    channel_id: 7,
    title: 'Marrakech en 4K',
    description: '<p>Souks et médina</p>',
    duration: 90,
    views_count: 0,
    likes_count: 0,
    is_public: true,
    status: 'processed',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    thumbnail_url: 'https://cdn.example/thumb.jpg',
    ...overrides,
  } as Video;
}

function pages(...groups: Video[][]): ChannelVideoPages {
  const total = groups.reduce((sum, group) => sum + group.length, 0);
  return {
    pages: groups.map((data, index) => ({
      data,
      pagination: { total, page: index + 1, limit: 2, totalPages: groups.length },
    })) as ChannelVideoPage[],
    pageParams: groups.map((_, index) => index + 1),
  };
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
}

describe('matchesChannelVideoQuery', () => {
  it('keeps everything when there is no filter', () => {
    expect(matchesChannelVideoQuery(video(), {})).toBe(true);
    expect(matchesChannelVideoQuery(video(), { sort: 'newest' })).toBe(true);
  });

  it('follows the visibility the creator just chose', () => {
    expect(matchesChannelVideoQuery(video({ is_public: true }), { visibility: 'private' })).toBe(false);
    expect(matchesChannelVideoQuery(video({ is_public: false }), { visibility: 'private' })).toBe(true);
    expect(matchesChannelVideoQuery(video({ is_public: false }), { visibility: 'public' })).toBe(false);
  });

  // A finished transcode is exactly what takes a row out of this list.
  it('reads Processing the way the server does', () => {
    for (const status of ['pending', 'processing', 'failed'] as const) {
      expect(matchesChannelVideoQuery(video({ status }), { status: 'processing' })).toBe(true);
    }
    for (const status of ['processed', 'completed'] as const) {
      expect(matchesChannelVideoQuery(video({ status }), { status: 'processing' })).toBe(false);
    }
  });

  it('matches a search against the title or the description, case-insensitively', () => {
    expect(matchesChannelVideoQuery(video(), { search: 'MARRAKECH' })).toBe(true);
    expect(matchesChannelVideoQuery(video(), { search: 'médina' })).toBe(true);
    expect(matchesChannelVideoQuery(video(), { search: 'lisbon' })).toBe(false);
  });

  // The description is stored as editor HTML; a creator searching for "p" must
  // not match every paragraph tag in the channel.
  it('searches the description as text, not as markup', () => {
    expect(matchesChannelVideoQuery(video({ title: 'x', description: '<p>a</p>' }), { search: '<p>' })).toBe(
      false,
    );
  });
});

describe('patchCachedChannelVideos', () => {
  it('edits the video in every cached list for the channel, not just the one on screen', () => {
    const cache = client();
    const all = channelVideosKey(CHANNEL, { sort: 'newest' });
    const search = channelVideosKey(CHANNEL, { sort: 'newest', search: 'marrakech' });
    cache.setQueryData(all, pages([video({ id: 1, is_public: true })]));
    cache.setQueryData(search, pages([video({ id: 1, is_public: true })]));

    patchCachedChannelVideos(cache, CHANNEL, new Set([1]), (v) => ({ ...v, is_public: false }));

    expect(cache.getQueryData<ChannelVideoPages>(all)!.pages[0].data[0].is_public).toBe(false);
    expect(cache.getQueryData<ChannelVideoPages>(search)!.pages[0].data[0].is_public).toBe(false);
  });

  // The Private list is defined by the thing the creator just changed. Leaving
  // the row there is a list whose own title says it cannot contain that row.
  it('takes the video out of a list it no longer belongs in, and says so', () => {
    const cache = client();
    const priv = channelVideosKey(CHANNEL, { visibility: 'private' });
    cache.setQueryData(priv, pages([video({ id: 1, is_public: false }), video({ id: 2, is_public: false })]));

    const moved = patchCachedChannelVideos(cache, CHANNEL, new Set([1]), (v) => ({
      ...v,
      is_public: true,
    }));

    expect(moved).toBe(true);
    const list = cache.getQueryData<ChannelVideoPages>(priv)!;
    expect(list.pages[0].data.map((v) => v.id)).toEqual([2]);
    expect(list.pages[0].pagination.total).toBe(1);
  });

  it('reports no movement when the edit leaves every list intact', () => {
    const cache = client();
    const all = channelVideosKey(CHANNEL, {});
    cache.setQueryData(all, pages([video({ id: 1, is_public: false })]));

    const moved = patchCachedChannelVideos(cache, CHANNEL, new Set([1]), (v) => ({
      ...v,
      is_public: true,
    }));

    expect(moved).toBe(false);
    expect(cache.getQueryData<ChannelVideoPages>(all)!.pages[0].data).toHaveLength(1);
  });

  // Identity is the whole memoisation story: an untouched row that comes back
  // as a new object rebuilds itself for no reason.
  it('leaves untouched pages and untouched videos exactly as they were', () => {
    const cache = client();
    const key = channelVideosKey(CHANNEL, {});
    const one = video({ id: 1 });
    const two = video({ id: 2 });
    const three = video({ id: 3 });
    const before = pages([one, two], [three]);
    cache.setQueryData(key, before);

    patchCachedChannelVideos(cache, CHANNEL, new Set([1]), (v) => ({ ...v, title: 'Renamed' }));

    const after = cache.getQueryData<ChannelVideoPages>(key)!;
    expect(after.pages[1]).toBe(before.pages[1]);
    expect(after.pages[0].data[1]).toBe(two);
    expect(after.pages[0].data[0]).not.toBe(one);
  });

  it('does not touch another channel\'s cache', () => {
    const cache = client();
    const mine = channelVideosKey(CHANNEL, {});
    const theirs = channelVideosKey('8', {});
    cache.setQueryData(mine, pages([video({ id: 1, is_public: true })]));
    cache.setQueryData(theirs, pages([video({ id: 1, is_public: true })]));

    patchCachedChannelVideos(cache, CHANNEL, new Set([1]), (v) => ({ ...v, is_public: false }));

    expect(cache.getQueryData<ChannelVideoPages>(theirs)!.pages[0].data[0].is_public).toBe(true);
  });
});

describe('removeCachedChannelVideos', () => {
  // The header counts the channel. Leaving `total` alone leaves "Videos · 62"
  // sitting over sixty-one videos until the cache expires.
  it('drops the rows and corrects the count on every page', () => {
    const cache = client();
    const key = channelVideosKey(CHANNEL, {});
    cache.setQueryData(key, pages([video({ id: 1 }), video({ id: 2 })], [video({ id: 3 })]));

    removeCachedChannelVideos(cache, CHANNEL, new Set([2]));

    const after = cache.getQueryData<ChannelVideoPages>(key)!;
    expect(after.pages[0].data.map((v) => v.id)).toEqual([1]);
    expect(after.pages[1].data.map((v) => v.id)).toEqual([3]);
    for (const page of after.pages) expect(page.pagination.total).toBe(2);
  });

  it('recomputes how many pages are left', () => {
    const cache = client();
    const key = channelVideosKey(CHANNEL, {});
    cache.setQueryData(key, pages([video({ id: 1 }), video({ id: 2 })], [video({ id: 3 })]));

    removeCachedChannelVideos(cache, CHANNEL, new Set([2, 3]));

    // Two gone of three, page size 2 — one page holds what is left.
    expect(cache.getQueryData<ChannelVideoPages>(key)!.pages[0].pagination.totalPages).toBe(1);
  });

  it('finds a row on whichever page it is on', () => {
    const cache = client();
    const key = channelVideosKey(CHANNEL, {});
    cache.setQueryData(key, pages([video({ id: 1 }), video({ id: 2 })], [video({ id: 3 })]));

    removeCachedChannelVideos(cache, CHANNEL, new Set([3]));

    expect(cache.getQueryData<ChannelVideoPages>(key)!.pages[1].data).toHaveLength(0);
  });
});

describe('mergeDefined', () => {
  // `PUT /videos/:id` answers from the model row, which has no signed
  // `thumbnail_url` — replacing the cached object with it blanked the artwork
  // of the row the creator had just edited.
  it('keeps a field the response simply does not carry', () => {
    const merged = mergeDefined(video(), { title: 'New title' } as Partial<Video>);

    expect(merged.title).toBe('New title');
    expect(merged.thumbnail_url).toBe('https://cdn.example/thumb.jpg');
  });

  it('still lets the response clear a field it deliberately sends as empty', () => {
    const merged = mergeDefined(video(), { description: '' } as Partial<Video>);

    expect(merged.description).toBe('');
  });
});

describe('dropInactiveChannelVideos', () => {
  /**
   * A patch can only edit rows a cache already HOLDS, so nothing it does puts
   * a newly-public video into a cached Public list that predates it. Those
   * lists are thrown away instead — but only this channel's.
   */
  it('clears this channel\'s cached filters', () => {
    const cache = client();
    const all = channelVideosKey(CHANNEL, {});
    const publicOnly = channelVideosKey(CHANNEL, { visibility: 'public' });
    cache.setQueryData(all, pages([video({ id: 1 })]));
    cache.setQueryData(publicOnly, pages([video({ id: 2 })]));

    dropInactiveChannelVideos(cache, CHANNEL);

    expect(cache.getQueryData(all)).toBeUndefined();
    expect(cache.getQueryData(publicOnly)).toBeUndefined();
  });

  // A creator with several channels must not have one channel's edit throw
  // away the list they are looking at on another.
  it('leaves every other channel alone', () => {
    const cache = client();
    const mine = channelVideosKey(CHANNEL, {});
    const theirs = channelVideosKey('8', {});
    const alsoTheirs = channelVideosKey('8', { visibility: 'private' });
    cache.setQueryData(mine, pages([video({ id: 1 })]));
    cache.setQueryData(theirs, pages([video({ id: 2 })]));
    cache.setQueryData(alsoTheirs, pages([video({ id: 3 })]));

    dropInactiveChannelVideos(cache, CHANNEL);

    expect(cache.getQueryData(mine)).toBeUndefined();
    expect(cache.getQueryData<ChannelVideoPages>(theirs)!.pages[0].data[0].id).toBe(2);
    expect(cache.getQueryData<ChannelVideoPages>(alsoTheirs)!.pages[0].data[0].id).toBe(3);
  });

  // Channel ids are compared as query-key values, so "7" must not sweep "70".
  it('does not mistake a channel whose id starts the same', () => {
    const cache = client();
    const similar = channelVideosKey('70', {});
    cache.setQueryData(similar, pages([video({ id: 9 })]));

    dropInactiveChannelVideos(cache, CHANNEL);

    expect(cache.getQueryData(similar)).toBeDefined();
  });
});
