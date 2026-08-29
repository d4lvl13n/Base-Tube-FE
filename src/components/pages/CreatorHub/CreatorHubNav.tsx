// src/components/pages/CreatorHub/CreatorHubNav.tsx
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  BarChart2,
  DollarSign,
  ImageIcon,
  LayoutDashboard,
  Plus,
  Ticket,
  Tv,
  Upload,
  VideoIcon,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';
import {
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
  SidebarPrimaryAction,
  SidebarSection,
  SidebarShell,
  SidebarSwitcher,
} from '../../navigation';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

const STUDIO_PATHS = [
  '/creator-hub/upload',
  '/creator-hub/content-studio',
  '/creator-hub/videos',
  '/creator-hub/channels',
];

/**
 * The Creator Hub column.
 *
 * One filled button (Upload) and a flat list of rows. "Create channel" moved
 * into the switcher's menu and "Create content pass" into the monetization
 * group: both were full-width blocks competing with Upload for the same
 * attention, and the pass block did it with an animated gold border.
 */
const CreatorHubNav: React.FC = () => {
  const { channels, selectedChannelId, setSelectedChannelId, isLoading } = useChannelSelection();
  const { isSignedIn, user: clerkUser } = useUser();
  const { isAuthenticated, user: web3User } = useAuth();

  const options = channels.map((channel) => ({
    id: channel.id.toString(),
    name: channel.name,
    handle: channel.handle,
    imageUrl: channel.channel_image_url ?? null,
  }));

  const account = isAuthenticated && web3User
    ? {
        name: web3User.username || 'My wallet',
        handle: null as string | null,
        imageUrl: web3User.profile_image_url ?? null,
      }
    : isSignedIn && clerkUser
      ? {
          name: clerkUser.username || clerkUser.firstName || 'Account',
          handle: clerkUser.username ?? null,
          imageUrl: clerkUser.imageUrl ?? null,
        }
      : null;

  return (
    <SidebarShell
      label="Creator Hub navigation"
      className="fixed left-0 top-16 bottom-0 z-40"
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
      footer={
        account ? (
          <SidebarFooter
            name={account.name}
            handle={account.handle}
            imageUrl={account.imageUrl}
          />
        ) : undefined
      }
    >
      <SidebarSection>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/creator-hub" end />
        <SidebarGroup
          id="content-studio"
          icon={VideoIcon}
          label="Content Studio"
          paths={STUDIO_PATHS}
          primaryPath="/creator-hub/content-studio"
        >
          <SidebarItem icon={Upload} label="Upload" to="/creator-hub/upload" indent />
          <SidebarItem icon={VideoIcon} label="Studio" to="/creator-hub/content-studio" indent />
          <SidebarItem icon={ImageIcon} label="Videos" to="/creator-hub/videos" indent />
          <SidebarItem icon={Tv} label="Channels" to="/creator-hub/channels" indent />
        </SidebarGroup>
        <SidebarItem icon={BarChart2} label="Analytics" to="/creator-hub/analytics" />
        <SidebarItem icon={ImageIcon} label="Thumbnail Gallery" to="/thumbnail-gallery" />
      </SidebarSection>

      <SidebarSection label="Monetization">
        <SidebarItem
          icon={DollarSign}
          label="Overview"
          to="/creator-hub/monetization"
          badge="Beta"
        />
        <SidebarItem
          icon={Ticket}
          label="Content passes"
          to="/creator-hub/passes"
          disabled={!PASSES_ENABLED}
        />
        <SidebarItem
          icon={Plus}
          label="Create pass"
          to="/creator-hub/create-content-pass"
          disabled={!PASSES_ENABLED}
        />
      </SidebarSection>
    </SidebarShell>
  );
};

export default CreatorHubNav;
