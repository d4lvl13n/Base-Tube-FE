import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Shield, Coins, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BenefitItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="flex items-start space-x-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800/30 backdrop-blur-sm"
  >
    <div className="p-2 bg-gray-800/50 rounded-lg">
      <Icon className="w-5 h-5 text-[#fa7517]" />
    </div>
    <div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </motion.div>
);

const WhyCreateChannelSection: React.FC = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Rocket,
      title: 'Launch Your Web3 Presence',
      description: 'Start your journey in the decentralized content space'
    },
    {
      icon: Shield,
      title: 'Own Your Content',
      description: 'True ownership with blockchain-backed content security'
    },
    {
      icon: Coins,
      title: 'Direct Monetization',
      description: 'Earn crypto directly from your audience engagement'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connect with Web3 enthusiasts worldwide'
    }
  ];

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
      style={{
        boxShadow: `
          0 0 20px 5px rgba(250, 117, 23, 0.1),
          0 0 40px 10px rgba(250, 117, 23, 0.05),
          inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
        `
      }}
    >
      <div className="relative z-10">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-6">
          Why Create a Channel?
        </h2>
        <div className="grid gap-4">
          {benefits.map((benefit) => (
            <BenefitItem key={benefit.title} {...benefit} />
          ))}
        </div>

        {/* Call to Action Button */}
        <motion.button
          onClick={() => navigate('/create-channel')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 p-4 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-black rounded-xl 
            hover:from-[#ff8c3a] hover:to-[#ffad7d] transition-all flex items-center justify-center 
            font-medium shadow-lg shadow-orange-500/20"
        >
          Create Your Channel
        </motion.button>
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
};

export default WhyCreateChannelSection;