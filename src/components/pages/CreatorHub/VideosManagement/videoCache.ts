import { InfiniteData, QueryClient } from '@tanstack/react-query';
import { ChannelVideoQuery } from '../../../../api/channel';
import { Video, VideoStatus } from '../../../../types/video';
import { descriptionToPlainText } from '../../../../utils/descriptionText';

export interface ChannelVideoPage {
  data: Video[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type ChannelVideoPages = InfiniteData<ChannelVideoPage, number>;

/** The first element of every cached channel-video key. */
export const CHANNEL_VIDEOS_KEY = 'channelVideos';

export const channelVideosKey = (channelId: string, query: ChannelVideoQuery) =>
  [CHANNEL_VIDEOS_KEY, channelId, query] as const;

/** The statuses the "Processing" filter covers, mirroring the server's. */
const UNFINISHED: ReadonlySet<VideoStatus> = new Set<VideoStatus>([
  'pending',
  'processing',
  'failed',
]);

/**
 * Does this video still belong in a list that was fetched with this filter?
 *
 * The creator's edits change the answer. Making a video public takes it out of
 * the Private list; a transcode finishing takes it out of the Processing list.
 * Without this the row simply stayed where it was, and the creator was looking
 * at a list whose own title said it could not contain that row.
 *
 * This mirrors the server's `where` clause. It is allowed to be conservative
 * about `search` — the row it keeps is one the next real fetch would drop —
 * but it must never be *wrong* about visibility or status, which are the two
 * the creator can change from this page.
 */
export function matchesChannelVideoQuery(video: Video, query: ChannelVideoQuery): boolean {
  if (query.visibility === 'public' && !video.is_public) return false;
  if (query.visibility === 'private' && video.is_public) return false;
  if (query.status === 'processing' && !UNFINISHED.has(video.status)) return false;

  const search = query.search?.trim().toLowerCase();
  if (search) {
    const title = (video.title ?? '').toLowerCase();
    if (title.includes(search)) return true;
    return descriptionToPlainText(video.description).toLowerCase().includes(search);
  }
  return true;
}

/**
 * Rewrite one cached list.
 *
 * `apply` returns the video unchanged (keep it, no repaint), a new object
 * (keep it, repaint that row), or `null` (it does not belong here any more).
 * Pages that nothing happened to keep their identity, and so do the videos
 * inside them — which is what stops one switch flipping from rebuilding every
 * row on screen.
 */
function rewriteList(
  old: ChannelVideoPages,
  apply: (video: Video) => Video | null
): { next: ChannelVideoPages; removed: number } {
  let removed = 0;
  let changed = false;

  const pages = old.pages.map((page) => {
    let pageChanged = false;
    const data: Video[] = [];
    for (const video of page.data) {
      const result = apply(video);
      if (result === null) {
        removed += 1;
        pageChanged = true;
        continue;
      }
      if (result !== video) pageChanged = true;
      data.push(result);
    }
    if (!pageChanged) return page;
    changed = true;
    return { ...page, data };
  });

  if (!changed) return { next: old, removed: 0 };
  if (removed === 0) return { next: { ...old, pages }, removed: 0 };

  // The header counts the channel, not the rows on screen. Leaving `total`
  // alone after a delete leaves "Videos · 62" over sixty-one videos until the
  // cache expires.
  const adjusted = pages.map((page) => {
    const total = Math.max(0, page.pagination.total - removed);
    return {
      ...page,
      pagination: {
        ...page.pagination,
        total,
        totalPages: page.pagination.limit > 0 ? Math.ceil(total / page.pagination.limit) : 0,
      },
    };
  });
  return { next: { ...old, pages: adjusted }, removed };
}

/** Every cached list for one channel, with the filter it was fetched under. */
function channelLists(client: QueryClient, channelId: string) {
  return client
    .getQueryCache()
    .findAll({ queryKey: [CHANNEL_VIDEOS_KEY, channelId] })
    .map((query) => ({
      key: query.queryKey,
      filter: (query.queryKey[2] ?? {}) as ChannelVideoQuery,
      data: query.state.data as ChannelVideoPages | undefined,
    }));
}

/**
 * Edit some videos everywhere they are cached for this channel.
 *
 * "Everywhere" matters: the creator's filters are part of the query key, so
 * the same video can sit in the All list, the Private list and a search. Only
 * patching the list on screen left the others holding a video whose visibility
 * was a lie for the next five minutes.
 *
 * Returns true when the edit moved a video out of at least one list, i.e. when
 * the pagination underneath has shifted and needs reconciling.
 */
export function patchCachedChannelVideos(
  client: QueryClient,
  channelId: string,
  ids: ReadonlySet<number>,
  patch: (video: Video) => Video
): boolean {
  let membershipChanged = false;

  for (const list of channelLists(client, channelId)) {
    if (!list.data) continue;
    const { next, removed } = rewriteList(list.data, (video) => {
      if (!ids.has(video.id)) return video;
      const updated = patch(video);
      return matchesChannelVideoQuery(updated, list.filter) ? updated : null;
    });
    if (next !== list.data) client.setQueryData(list.key, next);
    if (removed > 0) membershipChanged = true;
  }

  return membershipChanged;
}

/** Take deleted videos out of every cached list and correct the totals. */
export function removeCachedChannelVideos(
  client: QueryClient,
  channelId: string,
  ids: ReadonlySet<number>
): void {
  for (const list of channelLists(client, channelId)) {
    if (!list.data) continue;
    const { next } = rewriteList(list.data, (video) => (ids.has(video.id) ? null : video));
    if (next !== list.data) client.setQueryData(list.key, next);
  }
}

/**
 * Put the pagination back on its feet after rows have left a list.
 *
 * Offset pagination cannot be repaired in place: once a row is gone, every
 * page after it is shifted by one, and the next "Load more" would skip exactly
 * one video — silently, and forever, because nothing refetches the pages that
 * are already loaded. The list on screen refetches the pages it holds; the
 * lists nobody is looking at are dropped rather than kept as a plausible lie,
 * so the next visit to that filter asks the server.
 */
export function reconcileChannelVideos(client: QueryClient, channelId: string): void {
  client.removeQueries({ queryKey: [CHANNEL_VIDEOS_KEY, channelId], type: 'inactive' });
  void client.refetchQueries({ queryKey: [CHANNEL_VIDEOS_KEY, channelId], type: 'active' });
}

/** Every field of `patch` that actually carries a value. */
export function mergeDefined(video: Video, patch: Partial<Video>): Video {
  const merged: Record<string, unknown> = { ...video };
  for (const [field, value] of Object.entries(patch)) {
    if (value !== undefined) merged[field] = value;
  }
  return merged as unknown as Video;
}
