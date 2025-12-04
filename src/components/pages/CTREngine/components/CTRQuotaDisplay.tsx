// src/components/pages/CTREngine/components/CTRQuotaDisplay.tsx
// Premium quota status display component

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart2, TrendingUp, Clock, Crown } from 'lucide-react';
import { CTRQuotaStatus, QuotaInfo } from '../../../../types/ctr';
import { formatQuotaLimit } from '../../../../api/ctr';

interface CTRQuotaDisplayProps {
  quota: CTRQuotaStatus;
  variant?: 'compact' | 'full';
  className?: string;
}

const QuotaBar: React.FC<{
  label: string;
  info: QuotaInfo;
  icon: React.ReactNode;
  delay?: number;
}> = ({ label, info, icon, delay = 0 }) => {
  const isUnlimited = info.limit === -1;
  const percentage = isUnlimited ? 0 : (info.used / info.limit) * 100;
  const isLow = !isUnlimited && percentage >= 80;
  const isExhausted = !isUnlimited && info.remaining === 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-gray-400">
          {icon}
          {label}
        </span>
        {/* Reframed as progress/achievement */}
        <span className={`font-semibold flex items-center gap-1.5 ${isExhausted ? 'text-gray-500' : 'text-white'}`}>
          <span className="text-[#fa7517]">{info.used}</span>
          <span className="text-gray-500">of {formatQuotaLimit(info.limit)}</span>
          {!isExhausted && <span className="text-emerald-400 text-xs">✓</span>}
        </span>
      </div>
      
      {/* Progress bar - always positive feeling */}
      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-gray-800/50">
        <motion.div
          className={`h-full rounded-full ${
            isExhausted
              ? 'bg-gradient-to-r from-gray-600 to-gray-500'
              : 'bg-gradient-to-r from-[#fa7517] to-orange-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: isUnlimited ? '0%' : `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.2 }}
        />
      </div>
    </motion.div>
  );
};

export const CTRQuotaDisplay: React.FC<CTRQuotaDisplayProps> = ({
  quota,
  variant = 'compact',
  className = '',
}) => {
  const resetTime = new Date(quota.audit.resetsAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const tierConfig = {
    anonymous: { 
      label: 'Guest', 
      color: 'text-gray-400 bg-white/10 border-white/20',
      icon: null
    },
    free: { 
      label: 'Free', 
      color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      icon: null
    },
    pro: { 
      label: 'Pro', 
      color: 'text-[#fa7517] bg-[#fa7517]/20 border-[#fa7517]/30',
      icon: <Crown className="w-3 h-3" />
    },
    enterprise: { 
      label: 'Enterprise', 
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      icon: <Zap className="w-3 h-3" />
    },
  };

  const tier = tierConfig[quota.tier];

  if (variant === 'compact') {
    const auditProgress = quota.audit.limit === -1 ? 0 : (quota.audit.used / quota.audit.limit) * 100;
    const genProgress = quota.generate.limit === -1 ? 0 : (quota.generate.used / quota.generate.limit) * 100;
    
    return (
      <div className={`flex items-center gap-4 px-4 py-2.5 bg-black/50 rounded-xl border border-gray-800/50 backdrop-blur-sm ${className}`}>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${tier.color}`}>
            {tier.icon}
            {tier.label}
          </span>
        </div>
        <div className="w-px h-6 bg-gray-800" />
        <div className="flex items-center gap-4 text-sm">
          {/* Audits - progress style */}
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Audits</span>
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 bg-black/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full transition-all"
                    style={{ width: `${Math.min(auditProgress, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{quota.audit.used}/{formatQuotaLimit(quota.audit.limit)}</span>
              </div>
            </div>
          </div>
          {/* Generations - progress style */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#fa7517]" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Creates</span>
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 bg-black/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full transition-all"
                    style={{ width: `${Math.min(genProgress, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{quota.generate.used}/{formatQuotaLimit(quota.generate.limit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black/50 border border-gray-800/30 rounded-2xl p-5 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#fa7517]" />
          Today's Progress
        </h3>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tier.color}`}>
          {tier.icon}
          {tier.label}
        </span>
      </div>
      
      <div className="space-y-4">
        <QuotaBar
          label="Audits completed"
          info={quota.audit}
          delay={0.1}
          icon={<BarChart2 className="w-4 h-4" />}
        />
        
        <QuotaBar
          label="Thumbnails created"
          info={quota.generate}
          delay={0.2}
          icon={<Zap className="w-4 h-4" />}
        />
      </div>
      
      <div className="mt-5 pt-4 border-t border-gray-800/50 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          Fresh start at {resetTime}
        </span>
        {quota.tier === 'free' && (
          <a 
            href="/pricing" 
            className="text-xs font-medium text-[#fa7517] hover:text-orange-400 transition-colors flex items-center gap-1"
          >
            Get more
            <TrendingUp className="w-3 h-3" />
          </a>
        )}
        {quota.tier === 'anonymous' && (
          <span className="text-xs font-medium text-blue-400">
            Sign in for 10x more
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Inline quota indicator for buttons - reframed as progress
export const QuotaIndicator: React.FC<{
  used: number;
  limit: number;
  type: 'audit' | 'generate';
}> = ({ used, limit, type }) => {
  const isUnlimited = limit === -1;
  const remaining = isUnlimited ? -1 : limit - used;
  const isExhausted = !isUnlimited && remaining <= 0;
  const typeLabel = type === 'audit' ? 'audit' : 'creation';
  
  return (
    <span className={`text-xs flex items-center gap-1 ${isExhausted ? 'text-gray-500' : 'text-gray-400'}`}>
      {isUnlimited ? (
        <>
          <Zap className="w-3 h-3 text-[#fa7517]" />
          Unlimited
        </>
      ) : isExhausted ? (
        <>
          <Clock className="w-3 h-3" />
          Back tomorrow
        </>
      ) : (
        <>
          <span className="text-[#fa7517]">{used}</span>
          <span>of {limit} {typeLabel}s today</span>
        </>
      )}
    </span>
  );
};

export default CTRQuotaDisplay;
