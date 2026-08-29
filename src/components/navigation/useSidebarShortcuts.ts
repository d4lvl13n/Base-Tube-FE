import { useEffect } from 'react';
import { setSidebarCollapsed } from './sidebarState';

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
};

/**
 * `[` closes the sidebar, `]` opens it.
 *
 * Two keys rather than one toggle: a toggle bound to a bare bracket fires from
 * muscle memory in the wrong direction half the time, and these are the keys
 * every editor already uses for exactly this.
 */
export const useSidebarShortcuts = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== '[' && event.key !== ']') return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      setSidebarCollapsed(event.key === '[');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
};
