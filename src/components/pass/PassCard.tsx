import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pass } from '../../types/pass';
import { Shield, Star, ExternalLink, User, Award, Lock } from 'lucide-react';
import { usePurchasedPasses } from '../../hooks/usePass';

interface PassCardProps {
  pass: Pass;
  size?: 'normal' | 'large';
}

const PassCard: React.FC<PassCardProps> = ({ pass, size = 'normal' }) => {
  const { data: purchasedPasses } = usePurchasedPasses();
  const isOwned = purchasedPasses?.some(p => p.id === pass.id);
  
  // Get the first video's thumbnail or use fallback
  const thumbnail = pass.videos?.[0]?.thumbnail_url || '/assets/Content-pass.webp';

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'from-amber-500 to-amber-700 border-amber-400/30';
      case 'silver': return 'from-slate-300 to-slate-500 border-slate-300/30';
      case 'gold': return 'from-yellow-300 to-yellow-600 border-yellow-300/30';
      case 'platinum': return 'from-sky-300 to-sky-600 border-sky-300/30';
      default: return 'from-purple-400 to-purple-600 border-purple-300/30';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '✨';
    }
  };

  return (
    <Link to={isOwned ? `/watch/${pass.id}` : `/p/${pass.slug || pass.id}`} className="block w-full">
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={`rounded-xl overflow-hidden bg-black border border-gray-800 hover:border-gray-700 relative group ${
          size === 'large' ? 'col-span-2 row-span-2' : ''
        } ${isOwned 
          ? 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'shadow-lg hover:shadow-xl'
        }`}
        style={{
          aspectRatio: "4/5", // Fixed aspect ratio for all cards
          height: "auto",     // Height determined by aspect ratio
          width: "100%"       // Full width of parent
        }}
      >
        {/* Premium border glow effect - different for owned vs non-owned */}
        <motion.div 
          className={`absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 ${
            isOwned 
              ? 'bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30' 
              : 'bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20'
          }`}
          animate={{ 
            opacity: [0, 0.3, 0],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 4,
            ease: "easeInOut" 
          }}
        />
        
        {/* Thumbnail */}
        <div className="relative w-full h-full">
          {/* Image container with fixed aspect ratio */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src={thumbnail} 
              alt={pass.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-90 group-hover:brightness-100"
            />
            
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70" />
          </div>
          
          {/* Creator tag at top left */}
          <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 text-xs font-medium text-white/90">
            <User className="w-3 h-3 text-orange-400" />
            <span>{pass.channel?.name || 'Creator'}</span>
          </div>
          
          {/* Tier badge top right */}
          <div className="absolute top-3 right-3 z-10">
            <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full bg-gradient-to-r ${getTierColor(pass.tier)} text-white shadow-lg flex items-center gap-1`}>
              {getTierIcon(pass.tier)} {pass.tier}
            </span>
          </div>

          {/* Content overlay - central info */}
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            {/* Top section - empty since we moved badges elsewhere */}
            <div></div>
            
            {/* Middle icon button - only shows on hover */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
            >
              <div className={`w-16 h-16 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 ${
                isOwned 
                  ? 'bg-green-500/10 border border-green-500/30 group-hover:border-green-500/50' 
                  : 'bg-white/10 border border-white/20 group-hover:border-orange-500/40'
              }`}>
                {isOwned 
                  ? <ExternalLink className="w-6 h-6 text-green-400" /> 
                  : <Lock className="w-6 h-6 text-white" />
                }
              </div>
            </motion.div>
            
            {/* Bottom info section */}
            <div>
              <div className="space-y-2">
                {/* Title always visible */}
                <h3 className={`font-semibold text-white line-clamp-2 drop-shadow-md ${size === 'large' ? 'text-xl' : 'text-base'}`}>
                  {pass.title}
                </h3>
                
                {/* Price badge - only show for non-owned passes */}
                {!isOwned && (
                  <div className="inline-flex px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-bold text-white shadow-lg">
                    {pass.formatted_price}
                  </div>
                )}
                
                {/* Owner badge - show for owned passes */}
                {isOwned && (
                  <div className="inline-flex px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg text-white shadow-lg items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    <span className="font-bold">Owned</span>
                  </div>
                )}
                
                {/* Info section - appears on hover */}
                <div className="overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-20 opacity-0 group-hover:opacity-100">
                  <div className="pt-2">
                    <div className="flex items-center text-xs text-gray-400 space-x-2">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-orange-400 mr-1" />
                        <span>{pass.videos?.length || 1} video{(pass.videos?.length || 1) !== 1 ? 's' : ''}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center">
                        <Award className="w-3 h-3 text-orange-400 mr-1" />
                        <span>Content Pass</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtle animated light reflection */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className={`w-[120%] h-40 absolute -top-20 -left-20 transform rotate-30 opacity-0 ${
                isOwned
                  ? 'bg-gradient-to-r from-transparent via-green-500/10 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
              }`}
              animate={{
                left: ['120%', '-120%'],
                opacity: [0, 0.15, 0]
              }}
              transition={{
                repeat: Infinity,
                repeatDelay: 5,
                duration: 2.5,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default PassCard; 