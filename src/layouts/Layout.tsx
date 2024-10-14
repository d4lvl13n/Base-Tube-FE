import React from 'react';
import { Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 p-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Hexagon size={32} className="text-base-orange" />
          <span className="text-2xl font-bold">Base.Tube</span>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:text-base-orange">Home</Link></li>
            <li><Link to="/discover" className="hover:text-base-orange">Discover</Link></li>
            <li><Link to="/subscribed" className="hover:text-base-orange">Subscribed</Link></li>
            <li><Link to="/nft-marketplace" className="hover:text-base-orange">NFT Marketplace</Link></li>
            <li><Link to="/profile" className="hover:text-base-orange">Profile</Link></li>
          </ul>
        </nav>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
