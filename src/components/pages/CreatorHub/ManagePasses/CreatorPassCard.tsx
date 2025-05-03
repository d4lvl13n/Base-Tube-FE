// src/components/pages/CreatorHub/ManagePasses/CreatorPassCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pass } from '../../../../types/pass';
import { ExternalLink, Copy, Check, Shield, Award } from 'lucide-react';

interface CreatorPassCardProps {
  pass: Pass;
}

const CreatorPassCard: React.FC<CreatorPassCardProps> = ({ pass }) => {
  const [copied, setCopied] = useState(false);
  
  // Get the first video's thumbnail or use fallback
  const thumbnail = pass.videos?.[0]?.thumbnail_url || '/assets/Content-pass.webp';
  
  // Calculate remaining supply
  const remainingSupply = pass.supply_cap ? 
    Math.max(0, pass.supply_cap - (pass.minted_count || 0)) : 
    '∞'; // Infinity symbol for unlimited supply

  // Format sales information
  const formatSales = () => {
    if (!pass.supply_cap) {
      return `${pass.minted_count || 0} sold (unlimited)`;
    }
    return `${pass.minted_count || 0} / ${pass.supply_cap} sold`;
  };

  // Handle copy URL to clipboard
  const handleCopyUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/p/${pass.slug || pass.id}`;
    navigator.clipboard.writeText(shareUrl);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get tier color for badge
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'from-amber-500 to-amber-700';
      case 'silver': return 'from-slate-300 to-slate-500';
      case 'gold': return 'from-yellow-300 to-yellow-600';
      case 'platinum': return 'from-sky-300 to-sky-600';
      default: return 'from-purple-400 to-purple-600';
    }
  };

  return (
    <Link to={`/creator-hub/passes/${pass.id}`}>
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl overflow-hidden bg-black border border-gray-800 hover:border-gray-700 relative group shadow-lg hover:shadow-xl"
      >
        {/* Thumbnail */}
        <div className="relative w-full pb-[56.25%]"> {/* 16:9 aspect ratio */}
          <img 
            src={thumbnail} 
            alt={pass.title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
          
          {/* Tier badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full bg-gradient-to-r ${getTierColor(pass.tier)} text-white shadow-lg`}>
              {pass.tier}
            </span>
          </div>
          
          {/* Copy URL button */}
          <button 
            onClick={handleCopyUrl}
            className="absolute top-3 left-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm p-2 rounded-full transition-colors duration-200"
          >
            {copied ? 
              <Check className="w-4 h-4 text-green-400" /> : 
              <Copy className="w-4 h-4 text-white" />
            }
          </button>
        </div>
        
        {/* Content info */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">
            {pass.title}
          </h3>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Award className="w-4 h-4 text-orange-400" />
              <span>{pass.videos?.length || 1} video{(pass.videos?.length || 1) !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-lg font-semibold">{pass.formatted_price}</span>
          </div>
          
          {/* Sales progress bar */}
          {pass.supply_cap && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{formatSales()}</span>
                <span className="text-gray-400">{Math.round((pass.minted_count || 0) / pass.supply_cap * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((pass.minted_count || 0) / pass.supply_cap * 100))}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Unlimited supply indicator */}
          {!pass.supply_cap && (
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {pass.minted_count || 0} sold
              </span>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">
                Unlimited supply
              </span>
            </div>
          )}
        </div>
        
        {/* View details link */}
        <div className="px-4 py-3 border-t border-gray-800 flex justify-between items-center">
          <span className="text-sm text-gray-400">View details</span>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
      </motion.div>
    </Link>
  );
};

export default CreatorPassCard;