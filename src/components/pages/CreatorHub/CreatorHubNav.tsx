// src/components/pages/CreatorHub/CreatorHubNav.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  VideoIcon,
  BarChart2,
  DollarSign,
  Tv,
  ChevronLeft,
  ChevronRight,
  Upload,
  LucideIcon
} from 'lucide-react';
import { ChannelSelector } from '../../common/CreatorHub/ChannelSelector';

interface SubItem {
  title: string;
  path: string;
}

interface NavigationItem {
  title: string;
  icon: LucideIcon;
  path: string;
  subItems?: SubItem[];
  badge?: string;
}

interface NavItemProps {
  item: NavigationItem;
  isCollapsed: boolean;
  isActive: boolean;
  onClick: () => void;
  isExpanded: boolean;
}

interface ActionButtonProps {
  icon: LucideIcon;
  label?: string;
  badge?: number;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}

interface CreatorHubNavProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const CreatorHubNav: React.FC<CreatorHubNavProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const navigationItems: NavigationItem[] = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/creator-hub',
    },
    {
      title: 'Content Studio',
      icon: VideoIcon,
      path: '/creator-hub',
      subItems: [
        { title: 'Videos Management', path: '/creator-hub/videos' },
        { title: 'Batch Upload', path: '/creator-hub/content-studio' },
        { title: 'Playlists', path: '/creator-hub/playlists' },
        { title: 'Channel Management', path: '/creator-hub/channels' }
      ]
    },
    {
      title: 'Analytics',
      icon: BarChart2,
      path: '/creator-hub/analytics',
    },
    {
      title: 'Monetization',
      icon: DollarSign,
      path: '/creator-hub/monetization',
      badge: 'NEW'
    }
  ];

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? '80px' : '256px' }}
      className="relative h-screen flex flex-col bg-black/50 border-r border-gray-800/30 backdrop-blur-sm overflow-hidden"
      style={{
        boxShadow: `
          0 0 20px 5px rgba(250, 117, 23, 0.1),
          0 0 40px 10px rgba(250, 117, 23, 0.05),
          inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
        `
      }}
    >
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="absolute right-0 top-6 bg-gray-900/50 p-1.5 rounded-l-lg border border-gray-800/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isCollapsed ? 
          <ChevronRight className="w-4 h-4 text-[#fa7517]" /> : 
          <ChevronLeft className="w-4 h-4 text-[#fa7517]" />
        }
      </motion.button>

      {/* Primary Actions */}
      <div className="p-4 border-b border-gray-800/30">
        <div className="space-y-3">
          <ActionButton
            icon={Tv}
            label={!isCollapsed ? "Create Channel" : undefined}
            className="w-full bg-gray-700/50 hover:bg-gray-600/50"
            onClick={() => navigate('/create-channel')}
          />
          <ActionButton
            icon={Upload}
            label={!isCollapsed ? "Upload Video" : undefined}
            className="w-full bg-[#fa7517] hover:bg-[#ff8c3a] text-black"
            onClick={() => navigate('/creator-hub/upload-video')}
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => (
          <NavItem
            key={item.title}
            item={item}
            isCollapsed={isCollapsed}
            isActive={location.pathname === item.path || 
            (item.subItems?.some(subItem => location.pathname === subItem.path) ?? false)}
            onClick={() => !isCollapsed && item.subItems && setExpandedItem(expandedItem === item.title ? null : item.title)}
            isExpanded={expandedItem === item.title}
          />
        ))}
      </nav>

      {/* Channel Selector */}
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-gray-800/30 mt-auto">
          <div className="pt-4">
            <ChannelSelector />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Helper Components
const ActionButton = ({ icon: Icon, label, badge, className = '', iconClassName = '', onClick }: ActionButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      relative p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2
      ${className || 'hover:bg-gray-800/50'}
    `}
  >
    <Icon className={`w-5 h-5 ${iconClassName || 'text-gray-400'}`} />
    {label && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    {badge && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#fa7517] rounded-full text-[10px] flex items-center justify-center text-black">
        {badge}
      </span>
    )}
  </motion.button>
);

const NavItem: React.FC<NavItemProps> = ({ item, isCollapsed, isActive, onClick, isExpanded }) => {
  const location = useLocation();
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`
        relative group cursor-pointer
        ${isActive ? 'bg-[#fa7517]/10' : 'hover:bg-gray-800/30'}
        rounded-lg transition-colors
      `}
    >
      <div
        onClick={onClick}
        className={`
          flex items-center px-4 py-2.5
          ${isActive ? 'text-[#fa7517]' : 'text-gray-400 hover:text-white'}
        `}
      >
        {item.path ? (
          <Link 
            to={item.path}
            className="flex items-center flex-1 overflow-hidden"
          >
            <item.icon className="w-5 h-5 min-w-[20px]" />
            {!isCollapsed && (
              <span className="ml-3 font-medium whitespace-nowrap">
                {item.title}
              </span>
            )}
          </Link>
        ) : (
          // For items without path (like Content Studio)
          <div className="flex items-center flex-1 overflow-hidden">
            <item.icon className="w-5 h-5 min-w-[20px]" />
            {!isCollapsed && (
              <span className="ml-3 font-medium whitespace-nowrap">
                {item.title}
              </span>
            )}
          </div>
        )}
        
        {!isCollapsed && (
          <>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[#fa7517] text-black rounded-full">
                {item.badge}
              </span>
            )}
            {item.subItems && (
              <svg
                className={`w-4 h-4 ml-2 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </>
        )}
      </div>
      
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-0 w-1 h-full bg-[#fa7517] rounded-r"
        />
      )}

      {/* Subitems */}
      {!isCollapsed && item.subItems && isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ml-4 mt-1 space-y-1"
        >
          {item.subItems.map((subItem) => (
            <Link
              key={subItem.title}
              to={subItem.path}
              className={`
                block px-4 py-2 rounded-lg text-sm
                ${location.pathname === subItem.path ? 'text-[#fa7517] bg-[#fa7517]/10' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'}
                transition-colors
              `}
            >
              {subItem.title}
            </Link>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default CreatorHubNav;