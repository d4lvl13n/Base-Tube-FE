import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Coins, Wallet, Sparkles } from 'lucide-react';
import { FeatureCard } from './components/FeatureCard';
import { WalletSection } from './components/WalletSection';

export const SignInWeb3UI: React.FC = () => (
  <>
    <style>
      {`
        @media (max-width: 1024px) {
          .hide-on-mobile {
            display: none;
          }
        }
      `}
    </style>
    <div className="h-screen bg-[#09090B] grid lg:grid-cols-2 grid-cols-1">
      {/* Left Section - Added max-h-screen */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col p-8 lg:p-12 max-h-screen overflow-hidden"
      >
        {/* Logo and Title Section */}
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
        <div className="mt-8 lg:mt-12 relative z-10 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Start Creating on  
                <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent"> Base.Tube</span>
              </span>
            </h1>
          </motion.div>

          {/* Feature Cards Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-2 gap-6 hide-on-mobile relative z-20"
          >
            {/* Feature Cards */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <FeatureCard 
                icon={<Shield className="w-5 h-5 text-[#fa7517]" />}
                title="Censorship-Resistant"
                description="Censorship-resistant content through decentralized storage"
                className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <FeatureCard 
                icon={<Coins className="w-5 h-5 text-[#fa7517]" />}
                title="Base Chain"
                description="Built on Base for mainstream Web3 adoption"
                className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <FeatureCard 
                icon={<Wallet className="w-5 h-5 text-[#fa7517]" />}
                title="NFT Content Pass"
                description="Control access to your content through NFT passes"
                className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <FeatureCard 
                icon={<Sparkles className="w-5 h-5 text-[#fa7517]" />}
                title="Web3 Features"
                description="Token-gated content and rewards"
                className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* Quote Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 lg:mt-12 flex justify-center hide-on-mobile"
          >
            <blockquote className="text-xl lg:text-2xl font-medium leading-relaxed text-center max-w-2xl">
              <span className="bg-gradient-to-r from-[#fa7517]/80 to-orange-400/80 bg-clip-text text-transparent">
                "Where Creators Truly Own Their Story
                <br className="hidden md:block" />
                The Web3 Future of Content is Here"
              </span>
            </blockquote>
          </motion.div>
        </div>

        {/* Subtle Gradient */}
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-to-t from-[#fa751720] to-transparent rounded-full blur-3xl" />
      </motion.div>

      {/* Right Section - Added flex-shrink-0 */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex items-center justify-center p-4 lg:p-8 flex-shrink-0"
      >
        <WalletSection className="w-full max-w-md" />
      </motion.div>
    </div>
  </>
);