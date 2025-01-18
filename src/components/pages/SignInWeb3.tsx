import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wallet, Shield, Coins, Sparkles } from 'lucide-react';
import ConnectWalletButton from '../common/WalletWrapper/ConnectWalletButton';

const SignInWeb3: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Left Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-0 lg:w-1/2 lg:flex flex-col p-8 lg:p-12 relative overflow-hidden"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-4 transition-transform hover:scale-105">
          <img
            src="/assets/basetubelogo.png"
            alt="Base.Tube"
            className="w-24 h-24"
          />
          <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
            Base.Tube
          </span>
        </Link>

        {/* Main Content */}
        <div className="mt-12 lg:mt-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Main Title */}
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Start Creating on Base.Tube
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
                Unlock Your Web3 Journey
              </span>
            </h1>
          </motion.div>

          {/* Feature Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-2 gap-6"
          >
            <FeatureCard 
              icon={<Shield className="w-5 h-5 text-[#fa7517]" />}
              title="Censorship-Resistant"
              description="Censorship-resistant content through decentralized storage"
            />
            <FeatureCard 
              icon={<Coins className="w-5 h-5 text-[#fa7517]" />}
              title="Base Chain"
              description="Built on Base for mainstream Web3 adoption"
            />
            <FeatureCard 
              icon={<Wallet className="w-5 h-5 text-[#fa7517]" />}
              title="NFT Content Pass"
              description="Control access to your content through NFT passes"
            />
            <FeatureCard 
              icon={<Sparkles className="w-5 h-5 text-[#fa7517]" />}
              title="Web3 Features"
              description="Token-gated content and rewards"
            />
          </motion.div>

          {/* Quote - Hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 lg:mt-16 hidden lg:flex justify-center"
          >
            <blockquote className="text-xl lg:text-2xl font-medium leading-relaxed text-center max-w-2xl">
              <span className="bg-gradient-to-r from-[#fa7517]/80 to-orange-400/80 bg-clip-text text-transparent">
                "Where Creators Truly Own Their Story
                <br />
                The Web3 Future of Content is Here"
              </span>
            </blockquote>
          </motion.div>
        </div>

        {/* Subtle Gradient */}
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-to-t from-[#fa751720] to-transparent rounded-full blur-3xl" />
      </motion.div>

      {/* Connect Wallet Section */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 relative"
      >
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#fa751730] via-[#fa751710] to-[#fa751730] rounded-3xl blur-2xl" />
          
          {/* Wallet Connection Card */}
          <div className="bg-[#111114]/90 border border-gray-800/20 shadow-xl backdrop-blur-sm rounded-2xl p-6 lg:p-8 relative z-10">
            <div className="text-center mb-6 lg:mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400">Access Base.Tube with your Web3 wallet</p>
            </div>

            {/* Wallet Button */}
            <div className="flex justify-center mb-8">
              <ConnectWalletButton 
                className="w-full max-w-sm"
                customText="Connect to Base Network"
              />
            </div>

            {/* Additional Info */}
            <div className="space-y-4 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#fa7517]" />
                Your keys, your content - always in your control
              </p>
              <p className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#fa7517]" />
                Powered by Base L2 for minimal gas fees
              </p>
              <p className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#fa7517]" />
                Unlock exclusive features and rewards
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// FeatureCard Component (same as SignInPage)
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className="p-4 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
    style={{
      boxShadow: `
        0 0 20px 5px rgba(250, 117, 23, 0.1),
        0 0 40px 10px rgba(250, 117, 23, 0.05),
        inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
      `
    }}
  >
    <div className="relative z-10">
      <div className="p-2 bg-gray-900/50 rounded-lg w-fit">
        {icon}
      </div>
      <h3 className="font-semibold text-white mt-3">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
    
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
    
    {/* Subtle glow effect on hover */}
    <motion.div
      className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 0.03 }}
    />
  </motion.div>
);

export default SignInWeb3; 