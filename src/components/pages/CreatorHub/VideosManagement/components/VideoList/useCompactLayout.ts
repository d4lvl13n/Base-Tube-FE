import { useEffect, useState } from 'react';

/** Tailwind's `md` breakpoint — below it the list stops being a table. */
const COMPACT_QUERY = '(max-width: 767px)';

/**
 * Is the viewport narrow enough that the list should be cards rather than a
 * table?
 *
 * This is a media *query*, not a set of `md:` classes on table cells. Reflowing
 * `<tr>`/`<td>` from table layout to flex depends on a chain of overrides that
 * is easy to break and, when it breaks, silently serves the phone layout to a
 * desktop — which is exactly what happened. Asking the browser the question
 * once and rendering the right thing cannot half-apply.
 *
 * The answer is read synchronously on the first render, so there is no frame
 * of the wrong layout before an effect corrects it.
 */
export function useCompactLayout(): boolean {
  const [compact, setCompact] = useState<boolean>(() => matches());

  useEffect(() => {
    const list = mediaQueryList();
    if (!list) return;
    const update = () => setCompact(list.matches);
    update();
    // `addEventListener` on a MediaQueryList is the modern spelling; Safari
    // below 14 only has the deprecated `addListener`.
    if (typeof list.addEventListener === 'function') {
      list.addEventListener('change', update);
      return () => list.removeEventListener('change', update);
    }
    if (typeof list.addListener === 'function') {
      list.addListener(update);
      return () => list.removeListener(update);
    }
    return undefined;
  }, []);

  return compact;
}

function mediaQueryList(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(COMPACT_QUERY);
}

function matches(): boolean {
  return mediaQueryList()?.matches ?? false;
}
