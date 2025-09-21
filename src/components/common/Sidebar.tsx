import React from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import FloatingSidebar from './FloatingSidebar';
import { Link } from 'react-router-dom';
import { Home, Flame, Compass, PlayCircle, User, Tv, Palette, Trophy } from 'lucide-react';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

const Sidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { navStyle } = useNavigation();

  // If floating style is selected, render FloatingSidebar
  if (navStyle === 'floating') {
    return <FloatingSidebar />;
  }

  // Otherwise render classic sidebar
  return (
    <nav className={`bg-[#000000] w-16 h-full flex flex-col items-center py-16 ${className}`}>
      <div className="flex-1 flex flex-col space-y-8">
        <Link to="/" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <Home size={24} />
        </Link>
        <Link to="/discover" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <Flame size={24} />
        </Link>
        <Link to="/nft-marketplace" className={`${!PASSES_ENABLED ? 'text-gray-600 hover:text-gray-600' : 'text-gray-400 hover:text-[#fa7517]'} cursor-pointer`}>
          <Compass size={24} />
        </Link>
        <Link to="/subscribed" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <PlayCircle size={24} />
        </Link>
        <Link to="/channel" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <Tv size={24} />
        </Link>
        <Link to="/profile" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <User size={24} />
        </Link>
        <Link to="/creator-hub" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <Palette size={24} />
        </Link>
        <Link to="/leaderboard" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <Trophy size={24} />
        </Link>
      </div>
    </nav>
  );
};

export default Sidebar;
