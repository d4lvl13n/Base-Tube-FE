import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Flame, Compass, PlayCircle, User, Tv } from 'lucide-react';

const Sidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <nav className={`bg-[#000000] w-16 h-full flex flex-col items-center py-16 ${className}`}>
      <div className="flex-1 flex flex-col space-y-8">
        <Link to="/" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <Home size={24} />
        </Link>
        <Link to="/discover" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
          <Flame size={24} />
        </Link>
        <Link to="/nft-marketplace" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
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
      </div>
    </nav>
  );
};

export default Sidebar;
