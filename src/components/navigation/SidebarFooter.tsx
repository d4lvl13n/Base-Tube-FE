import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import SidebarTooltip from './SidebarTooltip';
import { useSidebarView } from './SidebarViewContext';

export interface SidebarFooterProps {
  name: string;
  handle?: string | null;
  imageUrl?: string | null;
  /** Where the row goes. The profile page owns the account menu. */
  to?: string;
}

const BASE =
  'flex items-center rounded-md transition-colors duration-150 hover:bg-white/[0.04] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40 ' +
  'motion-reduce:transition-none';

/** The account row, pinned to the bottom of the column. */
const SidebarFooter: React.FC<SidebarFooterProps> = ({
  name,
  handle,
  imageUrl,
  to = '/profile',
}) => {
  const { collapsed } = useSidebarView();

  if (collapsed) {
    return (
      <SidebarTooltip label={name}>
        <Link
          to={to}
          aria-label={name}
          data-testid="sidebar-footer"
          className={`${BASE} h-9 w-9 justify-center`}
        >
          <Avatar src={imageUrl} name={name} size={24} showInitial={false} />
        </Link>
      </SidebarTooltip>
    );
  }

  return (
    <Link to={to} data-testid="sidebar-footer" className={`${BASE} gap-2.5 px-2 py-1.5`}>
      <Avatar src={imageUrl} name={name} size={28} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-gray-200">{name}</span>
        {handle && <span className="block truncate text-[11px] text-gray-400">@{handle}</span>}
      </span>
    </Link>
  );
};

export default SidebarFooter;
