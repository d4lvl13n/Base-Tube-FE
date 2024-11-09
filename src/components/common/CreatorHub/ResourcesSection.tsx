import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Megaphone, DollarSign, Users, ChartBar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ResourceItem = ({ 
  icon: Icon, 
  title, 
  description, 
  link 
}: { 
  icon: any, 
  title: string, 
  description: string,
  link?: string 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <motion.div 
      onClick={handleClick}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: 'rgba(250, 117, 23, 0.1)',
      }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-start space-x-4 p-4 rounded-xl 
        bg-gray-900/50 border border-gray-800/30 backdrop-blur-sm
        transition-colors duration-200
        ${link ? 'cursor-pointer hover:border-[#fa7517]/30' : ''}
      `}
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
};

const ResourcesSection: React.FC = () => {
  const resources = [
    {
      icon: BookOpen,
      title: 'Content Creation Tips',
      description: 'Learn best practices for creating engaging Web3 content'
    },
    {
      icon: ChartBar,
      title: 'Analytics Guide',
      description: 'Understand your audience and content performance',
      link: '/creator-hub/resources'
    },
    {
      icon: Megaphone,
      title: 'Marketing Strategies',
      description: 'Discover how to grow your audience and reach'
    },
    {
      icon: DollarSign,
      title: 'Monetization Options',
      description: 'Explore various ways to monetize your content'
    },
    {
      icon: Users,
      title: 'Community Engagement',
      description: 'Build and nurture your community effectively'
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
          Resources for Creators
        </h2>
        <div className="grid gap-4">
          {resources.map((resource) => (
            <ResourceItem key={resource.title} {...resource} />
          ))}
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
  );
};

export default ResourcesSection;