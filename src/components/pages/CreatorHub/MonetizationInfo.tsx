import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Users, Repeat, Crown, Lock, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../../common/Header';
import CreatorHubNav from './CreatorHubNav';
import { ChannelSelectionProvider } from '../../../contexts/ChannelSelectionContext';

const MonetizationInfo: React.FC = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  return (
    <ChannelSelectionProvider>
      <div className="min-h-screen bg-black">
        <Header onNavToggle={() => setIsNavCollapsed(!isNavCollapsed)} />
        <div className="flex">
          <CreatorHubNav isCollapsed={isNavCollapsed} onToggle={() => setIsNavCollapsed(!isNavCollapsed)} />
          
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 p-8 pt-24 max-w-7xl mx-auto space-y-12"
          >
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400">
                The NFT Content Pass: A New Era for Creators
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Transform how you share exclusive content with your community. The NFT Content Pass isn't just another subscription - 
                it's a revolutionary way to monetize your creativity and build lasting value with your community.
              </p>
            </div>

            {/* How It Works Section */}
            <div className="bg-black/50 rounded-2xl p-8 border border-gray-800/30 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-gray-400">
                Share exclusive content by placing it behind an NFT Content Pass. Your fans don't just subscribe - they purchase 
                these passes that grant access to your premium content. Think of it as a digital VIP badge that can be traded 
                between fans, generating revenue for you with every transfer.
              </p>
            </div>

            {/* For Creators Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">For Creators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <BenefitCard
                  icon={Coins}
                  title="Earn More"
                  description="Receive 90% of initial pass sales and ongoing royalties from every resale in the marketplace"
                />
                <BenefitCard
                  icon={TrendingUp}
                  title="Sustainable Revenue"
                  description="The NFT Content Pass creates lasting value as your community trades them"
                />
                <BenefitCard
                  icon={Repeat}
                  title="Permanent Revenue"
                  description="Unlike subscriptions that end, each Content Pass trade generates revenue - forever"
                />
                <BenefitCard
                  icon={Users}
                  title="Community Growth"
                  description="Turn your biggest fans into stakeholders in your success"
                />
              </div>
            </div>

            {/* For Community Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">For Your Community</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <BenefitCard
                  icon={Crown}
                  title="Own Their Access"
                  description="Fans own their pass - they can keep, trade, or sell it"
                />
                <BenefitCard
                  icon={TrendingUp}
                  title="Potential Returns"
                  description="As demand for your exclusive content grows, so can the value of their pass"
                />
                <BenefitCard
                  icon={Lock}
                  title="Exclusive Experience"
                  description="Access premium content unavailable anywhere else"
                />
              </div>
            </div>

            {/* Why It's Revolutionary Section */}
            <div className="bg-black/50 rounded-2xl p-8 border border-gray-800/30 backdrop-blur-sm space-y-4">
              <h2 className="text-2xl font-bold text-white">Why It's Revolutionary</h2>
              <p className="text-gray-400">
                Traditional platforms trap creators in a monthly chase for views. The NFT Content Pass creates a new way to 
                monetize exclusive content that rewards both you and your community through genuine ownership and tradeable access.
              </p>
            </div>

            {/* Simulator CTA Section */}
            <div className="text-center space-y-6 pb-12">
              <h2 className="text-2xl font-bold text-white">Ready to revolutionize how you share exclusive content?</h2>
              <p className="text-sm text-gray-400 italic mt-4">Coming soon to Base.Tube</p>
              
              {/* Updated Simulator Button with correct path */}
              <Link to="/creator-hub/nft-simulator">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 mx-auto px-8 py-4 bg-gradient-to-r 
                    from-[#fa7517] to-[#ff8c3a] text-black rounded-xl font-medium 
                    shadow-lg shadow-[#fa7517]/20 hover:shadow-[#fa7517]/30 
                    transition-shadow duration-300"
                >
                  <Calculator className="w-5 h-5" />
                  Try the NFT Content Pass Revenue Simulator
                </motion.button>
              </Link>
              <p className="text-sm text-gray-400">
                Estimate potential revenue based on your channel metrics
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </ChannelSelectionProvider>
  );
};

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon: Icon, title, description }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-black/50 rounded-xl p-6 border border-gray-800/30 backdrop-blur-sm"
  >
    <Icon className="w-8 h-8 text-[#fa7517] mb-4" />
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

export default MonetizationInfo; 