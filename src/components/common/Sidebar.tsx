import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  SidebarFooter,
  SidebarItem,
  SidebarSearch,
  SidebarSection,
  SidebarShell,
} from '../navigation';
import { navigationItems } from './navigationItems';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

/** Which rows sit under which heading. Order follows `navigationItems`. */
const BROWSE = ['/', '/discover', '/leaderboard', '/nft-marketplace'];
const YOURS = ['/subscribed', '/channel', '/profile'];
const CREATE = ['/creator-hub'];

const itemsFor = (paths: string[]) =>
  paths
    .map((path) => navigationItems.find((item) => item.path === path))
    .filter((item): item is (typeof navigationItems)[number] => Boolean(item));

/**
 * Where the column goes when the page does not say.
 *
 * Most pages hand in `fixed left-0 top-16 …` and offset their own content;
 * the ones that just drop a `<Sidebar />` into a flex row get a sticky column
 * that clears the fixed header instead of hiding its first rows under it.
 */
const DEFAULT_POSITION = 'sticky top-16 h-[calc(100vh-4rem)] self-start';

const Sidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isSignedIn, user: clerkUser } = useUser();
  const { isAuthenticated, user: web3User } = useAuth();

  const account = isAuthenticated && web3User
    ? {
        name: web3User.username || 'My wallet',
        handle: null,
        imageUrl: web3User.profile_image_url ?? null,
      }
    : isSignedIn && clerkUser
      ? {
          name: clerkUser.username || clerkUser.firstName || 'Account',
          handle: clerkUser.username ?? null,
          imageUrl: clerkUser.imageUrl ?? null,
        }
      : null;

  const renderItems = (paths: string[]) =>
    itemsFor(paths).map((item) => (
      <SidebarItem
        key={item.path}
        icon={item.Icon}
        label={item.label}
        to={item.path}
        end={item.path === '/'}
        disabled={Boolean(item.passGated) && !PASSES_ENABLED}
      />
    ));

  return (
    <SidebarShell
      label="Primary navigation"
      className={className || DEFAULT_POSITION}
      top={<SidebarSearch />}
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
      <SidebarSection>{renderItems(BROWSE)}</SidebarSection>
      <SidebarSection label="Yours">{renderItems(YOURS)}</SidebarSection>
      <SidebarSection label="Create">{renderItems(CREATE)}</SidebarSection>
    </SidebarShell>
  );
};

export default Sidebar;
