import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PlayCircle, Shield, ShoppingBag, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UnlockButton from './UnlockButton';

interface PassActionButtonProps {
  pass: {
    id: string;
    tier: string;
    formatted_price: string;
    supply_cap?: number;
    minted_count?: number;
  };
  alreadyOwns: boolean;
  isAccessLoading: boolean;
}

const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'from-amber-500 to-amber-700 border-amber-400/30';
      case 'silver': return 'from-slate-300 to-slate-500 border-slate-300/30';
      case 'gold': return 'from-yellow-300 to-yellow-600 border-yellow-300/30';
      case 'platinum': return 'from-sky-300 to-sky-600 border-sky-300/30';
      default: return 'from-purple-400 to-purple-600 border-purple-300/30';
    }
  };

  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      className={`text-xs font-bold uppercase px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(tier)} text-white border shadow-lg`}
    >
      {tier}
    </motion.span>
  );
};

const SupplyCap: React.FC<{ minted_count?: number, total?: number }> = ({ minted_count = 0, total }) => {
  if (!total) return null;
  
  const remaining = Math.max(0, total - minted_count);
  const percentLeft = (remaining / total) * 100;
  
  // Different color based on scarcity
  const getColor = () => {
    if (percentLeft < 10) return 'text-red-400 border-red-400/30';
    if (percentLeft < 30) return 'text-amber-400 border-amber-400/30';
    return 'text-green-400 border-green-400/30';
  };
  
  return (
    <span className={`text-xs px-3 py-1 rounded-full border ${getColor()} bg-black/40 backdrop-blur-sm ml-2`}>
      {remaining} / {total} left
    </span>
  );
};

const PassActionButton: React.FC<PassActionButtonProps> = ({
  pass,
  alreadyOwns,
  isAccessLoading,
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  if (isAccessLoading) {
    return (
      <div className="h-12 bg-black/40 rounded-lg animate-pulse w-32"></div>
    );
  }
  
  if (alreadyOwns) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TierBadge tier={pass.tier} />
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent opacity-80">
              {pass.formatted_price}
            </span>
          </div>
        </div>
        
        <motion.button
          whileHover={{ 
            scale: prefersReducedMotion ? 1 : 1.03,
            boxShadow: "0 0 20px 5px rgba(34, 197, 94, 0.3)"
          }}
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
          onClick={() => navigate(`/watch/${pass.id}`)}
          className="relative group overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 w-full flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-5 h-5" />
          Start Watching
        </motion.button>
        
        <button
          onClick={() => {}} // Would initiate share flow
          className="flex items-center justify-center gap-2 text-sm text-white/70 hover:text-white py-2"
        >
          <Gift className="w-4 h-4" />
          Gift this pass to a friend
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TierBadge tier={pass.tier} />
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
            {pass.formatted_price}
          </span>
        </div>
        
        {pass.supply_cap && (
          <SupplyCap 
            total={pass.supply_cap} 
            minted_count={pass.minted_count || 0} 
          />
        )}
      </div>
      
      <UnlockButton 
        passId={pass.id} 
        className="relative group overflow-hidden bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-orange-500/20 transition-all duration-300 w-full flex items-center justify-center gap-2" 
      />
      
      <div className="flex items-center justify-center gap-6 py-3">
        <div className="flex items-center gap-1 text-xs text-white/60">
          <Shield className="w-3 h-3 text-orange-400" />
          <span>Secure payment</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/60">
          <img src="/assets/base-logo.svg" alt="Base L2" className="w-3 h-3" />
          <span>Base L2</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/60">
          <ShoppingBag className="w-3 h-3 text-orange-400" />
          <span>NFT ownership</span>
        </div>
      </div>
    </div>
  );
};

export default PassActionButton; 