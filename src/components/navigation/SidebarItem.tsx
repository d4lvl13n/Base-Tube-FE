import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import SidebarTooltip from './SidebarTooltip';
import { useSidebarView } from './SidebarViewContext';

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  /** Renders a `Link`. Omit it and pass `onClick` for a button row. */
  to?: string;
  onClick?: () => void;
  /** Overrides route matching — used by collapsible group headers. */
  active?: boolean;
  /** Match the path exactly instead of by prefix. */
  end?: boolean;
  /** Short word (`Beta`); a dot in the rail, a pill when expanded. */
  badge?: string;
  /** Keyboard hint rendered at the trailing edge when expanded. */
  shortcut?: string;
  /** Chevron and the like. Never rendered in the rail. */
  trailing?: React.ReactNode;
  disabled?: boolean;
  /** Nested under a group header. */
  indent?: boolean;
  /** Set on button rows that disclose a sub-list. */
  ariaExpanded?: boolean;
  className?: string;
}

export const isSidebarPathActive = (pathname: string, to: string, end = false): boolean => {
  if (to === '/') return pathname === '/';
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
};

const BASE =
  'group/item relative flex items-center rounded-md text-[14px] transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40 ' +
  'motion-reduce:transition-none';

/**
 * One navigation row.
 *
 * The rail is not the expanded row with its label hidden — it is a 36px square
 * button with no text node in it at all. Keeping a `hidden` label around is
 * what made the old collapsed nav render half a word behind the icon, and a
 * screen reader still read it twice.
 */
const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  to,
  onClick,
  active,
  end = false,
  badge,
  shortcut,
  trailing,
  disabled = false,
  indent = false,
  ariaExpanded,
  className = '',
}) => {
  const { collapsed } = useSidebarView();
  const location = useLocation();

  const isActive = active ?? (to ? isSidebarPathActive(location.pathname, to, end) : false);

  const stateClass = disabled
    ? 'cursor-not-allowed text-gray-600'
    : isActive
      ? 'bg-white/[0.07] text-white'
      : 'text-gray-400 hover:bg-white/[0.04] hover:text-white';

  const iconClass = `h-[18px] w-[18px] shrink-0 ${
    disabled ? 'text-gray-700' : isActive ? 'text-[#fa7517]' : 'text-current'
  }`;

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.();
  };

  const content = collapsed ? (
    <>
      <Icon className={iconClass} aria-hidden="true" />
      {badge && (
        <span
          data-testid="sidebar-item-dot"
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#fa7517]"
        />
      )}
    </>
  ) : (
    <>
      <Icon className={iconClass} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {badge && (
        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#fa7517] ring-1 ring-inset ring-[#fa7517]/30">
          {badge}
        </span>
      )}
      {shortcut && (
        <kbd className="shrink-0 font-sans text-[11px] text-gray-600">{shortcut}</kbd>
      )}
      {trailing}
    </>
  );

  const layoutClass = collapsed
    ? 'h-9 w-9 justify-center'
    : `h-9 gap-2.5 px-2.5 ${indent ? 'pl-9' : ''}`;

  const shared = {
    className: `${BASE} ${layoutClass} ${stateClass} ${className}`,
    'aria-current': isActive && to ? ('page' as const) : undefined,
    'aria-disabled': disabled || undefined,
    'data-active': isActive ? 'true' : 'false',
    'data-testid': 'sidebar-item',
    'aria-expanded': ariaExpanded,
  };

  const row =
    to && !disabled ? (
      <Link to={to} onClick={handleClick} aria-label={collapsed ? label : undefined} {...shared}>
        {content}
      </Link>
    ) : (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={collapsed ? label : undefined}
        {...shared}
      >
        {content}
      </button>
    );

  if (!collapsed) return row;

  return <SidebarTooltip label={label}>{row}</SidebarTooltip>;
};

export default SidebarItem;
