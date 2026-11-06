import { useCallback, useEffect, useRef } from 'react';
import type { FocusEvent, PointerEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { videoQueryOptions } from '../queries/publicContent';
import { channelOverviewOptions } from './useChannelOverview';
import { loadChannelPage, loadVideoPage } from '../routes/publicRouteLoaders';

export const CONTENT_PREFETCH_DELAY_MS = 100;

function targetPath(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const href = target.closest('a[href]')?.getAttribute('href');
  return href && /^\/(video|channel)\/[^/?#]+$/.test(href) ? href : null;
}

/** Attach to existing cards or a collection: pointer movement, focus or press
 * signals intent. Pointer-enter alone (including scrolling) does not fetch. */
export function useContentPrefetch() {
  const client = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pendingPath = useRef<string | null>(null);
  const lastPath = useRef<string | null>(null);
  const cancel = useCallback(() => { clearTimeout(timer.current); pendingPath.current = null; }, []);
  useEffect(() => cancel, [cancel, client]);

  const prefetch = useCallback((path: string | null) => {
    cancel();
    if (!path || path === lastPath.current) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    const [, kind, encodedIdentifier] = path.split('/');
    let identifier: string;
    try { identifier = decodeURIComponent(encodedIdentifier); } catch { return; }
    lastPath.current = path;
    // All work is reads; speculative errors never interrupt a navigation.
    const work = kind === 'video'
      ? [loadVideoPage(), client.prefetchQuery({ ...videoQueryOptions(identifier), retry: false })]
      : [loadChannelPage(), client.prefetchInfiniteQuery({ ...channelOverviewOptions(identifier), retry: false })];
    void Promise.allSettled(work);
  }, [client, cancel]);

  return {
    onPointerMove: (event: Pick<PointerEvent<HTMLElement>, 'target' | 'pointerType' | 'movementX' | 'movementY'>) => {
      if (event.pointerType !== 'mouse' || (!event.movementX && !event.movementY)) return;
      const path = targetPath(event.target);
      if (path === pendingPath.current) return;
      cancel();
      if (!path || path === lastPath.current) return;
      pendingPath.current = path;
      timer.current = setTimeout(() => prefetch(path), CONTENT_PREFETCH_DELAY_MS);
    },
    onPointerDown: (event: Pick<PointerEvent<HTMLElement>, 'target'>) => prefetch(targetPath(event.target)),
    onFocus: (event: Pick<FocusEvent<HTMLElement>, 'target'>) => prefetch(targetPath(event.target)),
    onPointerOut: (event: Pick<PointerEvent<HTMLElement>, 'relatedTarget'>) => {
      if (targetPath(event.relatedTarget) !== pendingPath.current) cancel();
    },
    onBlur: cancel,
    onScrollCapture: cancel,
  };
}
