import React from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  Star, 
  Award, 
  Wallet, 
  Play,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const faqSections = [
  {
    title: 'Moment NFTs',
    description: 'Learn about our unique NFT rewards system and how to earn them',
    icon: Star,
    path: '/faq/moment-nfts',
    color: 'text-[#fa7517]',
    bgColor: 'bg-[#fa7517]'
  },
  {
    title: 'Points System',
    description: 'Understanding how points are earned and calculated',
    icon: Award,
    path: '/faq/points-system',
    color: 'text-green-500',
    bgColor: 'bg-green-500'
  },
  {
    title: 'Wallet & Transactions',
    description: 'Information about your wallet and managing transactions',
    icon: Wallet,
    path: '/faq/wallet',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500'
  },
  {
    title: 'Content Creation',
    description: 'Guidelines and tips for creating and uploading content',
    icon: Play,
    path: '/faq/content-creation',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500'
  }
];

const FAQPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-6xl"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-black/50 rounded-lg">
            <HelpCircle className="w-6 h-6 text-[#fa7517]" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Frequently Asked Questions
          </h1>
        </div>
        <p className="text-gray-400">
          Find answers to common questions about our platform's features and functionality
        </p>
      </div>

      {/* FAQ Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {faqSections.map((section) => (
          <Link key={section.path} to={section.path}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-black/50 border border-gray-800/30 
                backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-black/50 rounded-lg`}>
                      <section.icon className={`w-5 h-5 ${section.color}`} />
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      {section.title}
                    </h2>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 
                    group-hover:text-[#fa7517] transition-colors" />
                </div>
                <p className="text-gray-400">
                  {section.description}
                </p>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />
              
              <motion.div
                className={`absolute inset-0 ${section.bgColor} opacity-0 blur-2xl transition-opacity duration-300`}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.03 }}
              />
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default FAQPage;