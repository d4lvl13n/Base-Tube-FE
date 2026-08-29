import { createContext, useContext } from 'react';

/**
 * What the *rendered* sidebar looks like right now.
 *
 * `collapsed` is not the stored preference: inside the mobile drawer the
 * sidebar is always full width, whatever the desktop preference says. Items
 * read this rather than the store so a single component covers both.
 */
export interface SidebarView {
  collapsed: boolean;
}

export const SidebarViewContext = createContext<SidebarView>({ collapsed: false });

export const useSidebarView = (): SidebarView => useContext(SidebarViewContext);
