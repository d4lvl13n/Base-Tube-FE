import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import Button from './Button';

const Header: React.FC = () => {
  const { isSignedIn, user } = useUser();

  return (
    <header className="bg-[#000000] p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Menu className="text-gray-400 cursor-pointer" />
        <Link to="/" className="flex items-center space-x-2">
          <img src="/assets/basetubelogo.png" alt="Base.Tube Logo" className="w-16 h-16" />
          <span className="text-3xl font-bold bg-gradient-to-r from-[#fa7517] via-[#fa7517] to-white bg-clip-text text-transparent drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.28)]">
            Base.Tube
          </span>
        </Link>
      </div>
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative">
          <input 
            className="w-full bg-[#111] rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#fa7517] text-white"
            placeholder="Search or enter NFT Content Pass" 
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      {isSignedIn && user ? (
        <Link to="/profile">
          <img 
            src={user.imageUrl}
            alt="User Avatar" 
            className="w-10 h-10 rounded-full border-2 border-[#fa7517]"
          />
        </Link>
      ) : (
        <Link to="/sign-in">
          <Button>Sign In</Button>
        </Link>
      )}
    </header>
  );
};

export default Header;