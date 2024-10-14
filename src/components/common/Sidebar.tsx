import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Flame, Compass, PlayCircle, User } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <nav className="w-16 bg-[#000000] p-4 flex flex-col items-center space-y-6">
      <Link to="/" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
        <Home />
      </Link>
      <Link to="/discover" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
        <Flame />
      </Link>
      <Link to="/nft-marketplace" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
        <Compass />
      </Link>
      <Link to="/subscribed" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
        <PlayCircle />
      </Link>
      <Link to="/profile" className="text-gray-400 cursor-pointer hover:text-[#fa7517]">
        <User />
      </Link>
    </nav>
  );
};

export default Sidebar;