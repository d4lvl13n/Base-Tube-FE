import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

export interface SidebarTooltipProps {
  label: string;
  children: React.ReactNode;
}

/**
 * The rail's label.
 *
 * It carries its own `Provider` so a collapsed row works wherever it is
 * rendered — inside the shell, inside the drawer, or on its own in a test.
 * Radix allows the nesting and the delay is the same at every level.
 */
const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label, children }) => (
  <Tooltip.Provider delayDuration={120} skipDelayDuration={300}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="z-[80] rounded-md border border-gray-800/60 bg-[#0f0f0f] px-2 py-1
                     text-[12px] text-gray-200 shadow-xl"
        >
          {label}
          <Tooltip.Arrow className="fill-[#0f0f0f]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

export default SidebarTooltip;
