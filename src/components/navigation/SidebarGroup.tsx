import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import SidebarItem, { isSidebarPathActive } from './SidebarItem';
import { useSidebarView } from './SidebarViewContext';

export interface SidebarGroupProps {
  /** Stable key for the remembered open/closed state. */
  id: string;
  icon: LucideIcon;
  label: string;
  /** Routes owned by the group — any match marks the header active. */
  paths: string[];
  /** Where the header goes in the rail, where there is no room to expand. */
  primaryPath: string;
  children: React.ReactNode;
}

const storageKey = (id: string) => `bt.sidebar.group.${id}`;

const readOpen = (id: string, fallback: boolean): boolean => {
  try {
    const stored = window.localStorage.getItem(storageKey(id));
    return stored === null ? fallback : stored === 'true';
  } catch {
    return fallback;
  }
};

/**
 * A header row that opens a short list under it.
 *
 * The open/closed choice is remembered, but an active child always wins: you
 * should never land on a page whose entry in the nav is folded away.
 */
const SidebarGroup: React.FC<SidebarGroupProps> = ({
  id,
  icon,
  label,
  paths,
  primaryPath,
  children,
}) => {
  const { collapsed } = useSidebarView();
  const location = useLocation();
  const hasActiveChild = paths.some((path) => isSidebarPathActive(location.pathname, path));
  const [open, setOpen] = useState(() => readOpen(id, hasActiveChild));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(storageKey(id), next ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  };

  const expanded = open || hasActiveChild;

  if (collapsed) {
    return <SidebarItem icon={icon} label={label} to={primaryPath} active={hasActiveChild} />;
  }

  return (
    <div>
      <SidebarItem
        icon={icon}
        label={label}
        onClick={toggle}
        active={hasActiveChild}
        ariaExpanded={expanded}
        trailing={
          <ChevronDown
            data-testid="sidebar-group-chevron"
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform duration-150
                        motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
          />
        }
        className="w-full"
      />
      {expanded && (
        <div className="mt-0.5 space-y-0.5" data-testid="sidebar-group-items">
          {children}
        </div>
      )}
    </div>
  );
};

export default SidebarGroup;
