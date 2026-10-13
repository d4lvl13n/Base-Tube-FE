import { useEffect, useState } from 'react';

/**
 * The three layouts of UP-UX §5.4, decided in JavaScript.
 *
 *   compact  < 768 px    list and editor are two views, with an explicit Back
 *   medium   768–1199 px the list folds above the editor; preview and fields stack
 *   wide     ≥ 1200 px   list beside the editor; preview and fields side by side
 *
 * Not with responsive display classes (`hidden md:block`, `md:hidden`):
 * `@coinbase/onchainkit/styles.css` ships its own compiled Tailwind with
 * `.hidden` / `.flex` / `.inline-flex` later in the document, so every
 * responsive display override in our stylesheet loses the cascade (see
 * `SidebarShell.tsx`). Layout widths go through inline styles for the same reason.
 */
export type WorkspaceLayout = 'compact' | 'medium' | 'wide';

const WIDE_QUERY = '(min-width: 1200px)';
const MEDIUM_QUERY = '(min-width: 768px)';

function currentLayout(): WorkspaceLayout {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'wide';
  if (window.matchMedia(WIDE_QUERY).matches) return 'wide';
  if (window.matchMedia(MEDIUM_QUERY).matches) return 'medium';
  return 'compact';
}

export function useWorkspaceLayout(): WorkspaceLayout {
  const [layout, setLayout] = useState<WorkspaceLayout>(currentLayout);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const queries = [window.matchMedia(WIDE_QUERY), window.matchMedia(MEDIUM_QUERY)];
    const onChange = () => setLayout(currentLayout());
    onChange();
    for (const query of queries) {
      if (typeof query.addEventListener === 'function') query.addEventListener('change', onChange);
      else query.addListener?.(onChange);
    }
    return () => {
      for (const query of queries) {
        if (typeof query.removeEventListener === 'function') query.removeEventListener('change', onChange);
        else query.removeListener?.(onChange);
      }
    };
  }, []);

  return layout;
}
