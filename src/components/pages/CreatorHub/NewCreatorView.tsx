import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Rocket, Shield, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon: Icon, title, description }: { 
  icon: any, 
  title: string, 
  description: string 
}) => (
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
        <Icon className="w-5 h-5 text-[#fa7517]" />
      </div>
      <h3 className="font-semibold text-white mt-3">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
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

const NewCreatorView: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Rocket,
      title: "Launch Your Channel",
      description: "Start your journey in the decentralized content space"
    },
    {
      icon: Shield,
      title: "Own Your Content",
      description: "True ownership with blockchain-backed content security"
    },
    {
      icon: Coins,
      title: "Earn Rewards",
      description: "Get rewarded for quality content and engagement"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-8">
      <motion.div
        className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          boxShadow: `
            0 0 20px 5px rgba(250, 117, 23, 0.1),
            0 0 40px 10px rgba(250, 117, 23, 0.05),
            inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
          `
        }}
      >
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-[#fa7517]" />
            </div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-4">
              Start Your Creator Journey
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Create your first channel to begin sharing your content and building your community in the Web3 space.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <motion.button
              onClick={() => navigate('/create-channel')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] 
                text-black rounded-xl font-bold hover:from-[#ff8c3a] hover:to-[#ffad7d] 
                transition-all shadow-lg shadow-orange-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Channel
            </motion.button>
          </div>
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
    </div>
  );
};

export default NewCreatorView;