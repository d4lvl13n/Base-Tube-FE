import React from 'react';
import { useSidebarView } from './SidebarViewContext';

export interface SidebarSectionProps {
  /** Small uppercase heading. Replaced by a hairline in the rail. */
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * A group of rows.
 *
 * In the rail the heading becomes a hairline: the grouping is still visible,
 * but 60px cannot hold a word without truncating it to nonsense.
 */
const SidebarSection: React.FC<SidebarSectionProps> = ({ label, children, className = '' }) => {
  const { collapsed } = useSidebarView();

  return (
    <div className={`${className}`} role="group" aria-label={label}>
      {label &&
        (collapsed ? (
          <div className="mx-auto my-2 h-px w-6 bg-gray-800/60" aria-hidden="true" />
        ) : (
          <div className="px-2.5 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            {label}
          </div>
        ))}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
};

export default SidebarSection;
