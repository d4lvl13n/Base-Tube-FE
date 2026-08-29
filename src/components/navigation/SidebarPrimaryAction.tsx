import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import SidebarTooltip from './SidebarTooltip';
import { useSidebarView } from './SidebarViewContext';

export interface SidebarPrimaryActionProps {
  icon: LucideIcon;
  label: string;
  to: string;
}

const BASE =
  'flex items-center rounded-md bg-[#fa7517] text-[14px] font-medium text-black ' +
  'transition-colors duration-150 hover:bg-[#ff8c3a] focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[#fa7517]/40 motion-reduce:transition-none';

/**
 * The one filled button in the sidebar.
 *
 * Three competing coloured blocks meant none of them was the primary action;
 * this is the only thing here that gets a fill.
 */
const SidebarPrimaryAction: React.FC<SidebarPrimaryActionProps> = ({ icon: Icon, label, to }) => {
  const { collapsed } = useSidebarView();

  if (collapsed) {
    return (
      <SidebarTooltip label={label}>
        <Link
          to={to}
          aria-label={label}
          data-testid="sidebar-primary-action"
          className={`${BASE} h-9 w-9 justify-center`}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </Link>
      </SidebarTooltip>
    );
  }

  return (
    <Link to={to} data-testid="sidebar-primary-action" className={`${BASE} h-9 gap-2 px-2.5`}>
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
};

export default SidebarPrimaryAction;
