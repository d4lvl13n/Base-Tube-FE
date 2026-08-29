// src/components/pages/CreatorHub/CreatorHubNav.tsx
import React from 'react';
import {
  BarChart2,
  DollarSign,
  ImageIcon,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Ticket,
  Tv,
  Upload,
  VideoIcon,
} from 'lucide-react';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';
import {
  SidebarItem,
  SidebarPrimaryAction,
  SidebarSection,
  SidebarShell,
  SidebarSwitcher,
} from '../../navigation';
import { setSidebarCollapsed, useSidebarCollapsed } from '../../navigation/sidebarState';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

/** The collapse control lives at the bottom of the column: the account is
 *  already in the header, so a second avatar there was redundant. */
const CollapseToggle: React.FC = () => {
  const collapsed = useSidebarCollapsed();
  return (
    <button
      type="button"
      onClick={() => setSidebarCollapsed(!collapsed)}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      data-testid="creator-hub-collapse-toggle"
      className={`flex h-9 w-full items-center gap-3 rounded-md text-[14px] text-gray-400
                  transition-colors hover:bg-white/[0.04] hover:text-white
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40
                  ${collapsed ? 'justify-center px-0' : 'px-2.5'}`}
    >
      {collapsed ? (
        <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      ) : (
        <>
          <PanelLeftClose className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span>Collapse</span>
        </>
      )}
    </button>
  );
};

/**
 * The Creator Hub column.
 *
 * One filled button (Upload), then flat sections — Content Studio is always
 * open (a collapsible group hid four rows behind a click for nothing), and
 * Monetization is itself the clickable row, with the pass rows under it.
 */
const CreatorHubNav: React.FC = () => {
  const { channels, selectedChannelId, setSelectedChannelId, isLoading } = useChannelSelection();

  const options = channels.map((channel) => ({
    id: channel.id.toString(),
    name: channel.name,
    handle: channel.handle,
    imageUrl: channel.channel_image_url ?? null,
  }));

  return (
    <SidebarShell
      label="Creator Hub navigation"
      className="fixed left-0 top-16 bottom-0 z-40"
      edgeToggle={false}
      top={
        <div className="space-y-2">
          <SidebarSwitcher
            options={options}
            activeId={selectedChannelId}
            onSelect={setSelectedChannelId}
            action={{ label: 'Create channel', to: '/create-channel' }}
            placeholder="Select channel"
            loading={isLoading}
          />
          <SidebarPrimaryAction icon={Upload} label="Upload" to="/creator-hub/upload" />
        </div>
      }
      footer={<CollapseToggle />}
    >
      <SidebarSection>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/creator-hub" end />
        <SidebarItem icon={BarChart2} label="Analytics" to="/creator-hub/analytics" />
        <SidebarItem icon={ImageIcon} label="Thumbnail Gallery" to="/thumbnail-gallery" />
      </SidebarSection>

      <SidebarSection label="Content Studio">
        <SidebarItem icon={Upload} label="Upload" to="/creator-hub/upload" />
        <SidebarItem icon={VideoIcon} label="Studio" to="/creator-hub/content-studio" />
        <SidebarItem icon={ImageIcon} label="Videos" to="/creator-hub/videos" />
        <SidebarItem icon={Tv} label="Channels" to="/creator-hub/channels" />
      </SidebarSection>

      <SidebarSection>
        <SidebarItem
          icon={DollarSign}
          label="Monetization"
          to="/creator-hub/monetization"
          badge="Beta"
        />
        <SidebarItem
          icon={Ticket}
          label="Content passes"
          to="/creator-hub/passes"
          disabled={!PASSES_ENABLED}
          indent
        />
        <SidebarItem
          icon={Plus}
          label="Create pass"
          to="/creator-hub/create-content-pass"
          disabled={!PASSES_ENABLED}
          indent
        />
      </SidebarSection>
    </SidebarShell>
  );
};

export default CreatorHubNav;
