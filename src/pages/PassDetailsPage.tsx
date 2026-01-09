import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePassDetails, usePurchasedPasses } from '../hooks/usePass';
import { useTokenGate } from '../hooks/useTokenGate';
import { useAccess } from '../hooks/useOnchainPass';
import { motion, useReducedMotion } from 'framer-motion';
import { LockIcon, TrendingUp, Award, Clock, Star, Shield, PlayCircle, ShoppingBag, CreditCard, Unlock, Crown } from 'lucide-react';
import PremiumHeader from '../components/pass/PremiumHeader';
import StickyPassHeader from '../components/pass/StickyPassHeader';
import PassActionButton from '../components/pass/PassActionButton';
import TestnetModeBadge from '../components/pass/TestnetModeBadge';

// Animation constants
const ANIMATIONS = {
  page: { duration: 0.7, delay: 0.4 },
  hero: { duration: 1.5, ease: "easeOut" },
  content: { duration: 0.7, delay: 0.2, ease: "easeOut" },
  steps: { delay: 0.6, duration: 0.5 },
  card: { type: "spring", stiffness: 300, damping: 10 },
  hover: { type: "spring", stiffness: 400, damping: 10 }
} as const;

// Styling constants
const STYLES = {
  glass: {
    background: 'bg-white/[0.02]',
    border: 'border-white/[0.05]',
    hoverBg: 'hover:bg-white/[0.06]',
    strongBg: 'bg-white/[0.03]'
  },
  tierColors: {
    bronze: 'from-amber-500 to-amber-700 border-amber-400/30',
    silver: 'from-slate-300 to-slate-500 border-slate-300/30', 
    gold: 'from-yellow-300 to-yellow-600 border-yellow-300/30',
    platinum: 'from-sky-300 to-sky-600 border-sky-300/30',
    default: 'from-purple-400 to-purple-600 border-purple-300/30'
  },
  gradients: {
    orange: 'from-orange-400 to-orange-600',
    orangeToPink: 'from-orange-500 to-pink-600'
  }
} as const;



const PassDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: pass, isLoading, error } = usePassDetails(slug);
  const prefersReducedMotion = useReducedMotion();
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch passes user owns (if authenticated)
  const { data: purchasedPasses } = usePurchasedPasses();

  // Determine if user owns via list query (fast-authenticated check)
  const ownsViaList = purchasedPasses?.some(p => p.id === pass?.id);

  // Fallback secure check: verify signed URL using token gate
  const firstVideoId = pass?.videos?.[0]?.id;
  const { hasAccess: hasSignedAccess, isLoading: isAccessLoading } = useTokenGate(firstVideoId, {
    autoAuth: false,
    maxRetries: 0,
    passId: pass?.id
  });

  // Lightweight access assertion from onchain access endpoint (caches list)
  const { data: accessData } = useAccess(pass?.id, { enabled: Boolean(pass?.id) });

  const alreadyOwns = ownsViaList || hasSignedAccess || Boolean(accessData?.data?.hasAccess);

  // Scroll position tracking for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 350);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  useEffect(() => {
    if (pass) {
      document.title = `${pass.title} | Premium Content Pass`;
    }
  }, [pass]);

  if (isLoading || isAccessLoading) {
    return (
      <>
        <PremiumHeader />
      <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full opacity-30 animate-pulse blur-xl"></div>
              <div className="w-16 h-16 border-4 border-t-transparent border-orange-500 rounded-full animate-spin" />
            </div>
            <p className="text-gray-400 animate-pulse" aria-live="polite">Loading premium content...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !pass) {
    return (
      <>
        <PremiumHeader />
      <div className="flex items-center justify-center min-h-screen bg-black text-red-500">
          <div className="text-center p-8 bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-xl max-w-md">
            <LockIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Error Loading Pass</h2>
            <p className="text-gray-400">{error?.message || 'Pass not found'}</p>
          </div>
        </div>
      </>
    );
  }





  // Determine if description is long and should be collapsed
  const isLongDescription = (pass.description?.length || 0) > 400;
  const displayDescription = isLongDescription && !expandedDesc 
    ? `${pass.description?.substring(0, 400)}...` 
    : pass.description;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0f] to-[#09090B] text-white">
      <PremiumHeader passTitle={pass.title} creatorName={pass.channel?.name} />
      <StickyPassHeader 
        isVisible={isScrolled}
        pass={pass}
        alreadyOwns={alreadyOwns}
      />
      
      {/* Hero section */}
      <div className="relative w-full overflow-hidden pt-16">
        {Array.isArray(pass.videos) && pass.videos[0]?.thumbnail_url ? (
          <>
            {/* Background blur */}
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={ANIMATIONS.hero}
              className="absolute inset-0 bg-cover bg-center blur-2xl"
              style={{ 
                backgroundImage: `url(${pass.videos[0].thumbnail_url})`,
                height: '100%',
              }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-[#09090B]" />
            
            {/* Animated particles effect */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <div className="particle-container">
                {prefersReducedMotion ? null : [...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="particle bg-white rounded-full absolute"
                    style={{
                      width: `${Math.random() * 4 + 1}px`,
                      height: `${Math.random() * 4 + 1}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.5 + 0.3,
                      animation: `float ${Math.random() * 10 + 15}s linear infinite`,
                      animationDelay: `${Math.random() * 10}s`
                    }} 
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Background blur with fallback image */}
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={ANIMATIONS.hero}
              className="absolute inset-0 bg-cover bg-center blur-2xl"
              style={{ 
                backgroundImage: `url('/assets/Content-pass.webp')`,
                height: '100%',
              }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-[#09090B]" />
            
            {/* Animated particles effect */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <div className="particle-container">
                {prefersReducedMotion ? null : [...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="particle bg-white rounded-full absolute"
                    style={{
                      width: `${Math.random() * 4 + 1}px`,
                      height: `${Math.random() * 4 + 1}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.5 + 0.3,
                      animation: `float ${Math.random() * 10 + 15}s linear infinite`,
                      animationDelay: `${Math.random() * 10}s`
                    }} 
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="relative pt-16 pb-12 px-4 max-w-7xl mx-auto">
          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-8 md:mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full px-5 py-2 border border-orange-500/30 backdrop-blur-md">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <span className="text-white/90 text-sm font-medium">Members-only Videos</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ANIMATIONS.content}
            className="grid md:grid-cols-5 gap-8 items-start"
          >
            {/* Thumbnail Section */}
            <motion.div 
              className="md:col-span-3 relative"
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
              transition={ANIMATIONS.card}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl opacity-30 blur-md"></div>
              
              {Array.isArray(pass.videos) && pass.videos[0]?.thumbnail_url ? (
                <img
                  src={pass.videos[0].thumbnail_url}
                  alt={`${pass.title} thumbnail`}
                  className="w-full h-auto rounded-xl shadow-2xl border border-white/10 relative z-10"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border border-white/10 relative z-10 overflow-hidden">
                  <img 
                    src="/assets/Content-pass.webp" 
                    alt={`${pass.title} thumbnail`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <motion.div 
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                  whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                  className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm cursor-pointer border border-white/20"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center shadow-xl">
                    <LockIcon className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
            </div>
              
              {/* Overlay information */}
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <PlayCircle className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-sm text-white/80">Unlock full series</p>
                      <p className="text-xs text-white/50">{pass.videos?.length || 1} video{pass.videos?.length !== 1 ? 's' : ''} in this pass</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Info card */}
            <motion.div 
              className="md:col-span-2 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full bg-gradient-to-r ${
                  STYLES.tierColors[pass.tier.toLowerCase() as keyof typeof STYLES.tierColors] || STYLES.tierColors.default
                } text-white border shadow-lg`}>
                  {pass.tier}
                </span>
                <span className="text-gray-400 text-sm font-medium">Premium Pass</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 text-shadow">
                {pass.title}
              </h1>
              
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ x: prefersReducedMotion ? 0 : 5 }}
                transition={ANIMATIONS.hover}
              >
                <div className={`bg-gradient-to-br ${STYLES.gradients.orangeToPink} rounded-full w-12 h-12 flex items-center justify-center uppercase text-sm font-bold shadow-lg`}>
                  {pass.channel?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium">{pass.channel?.name || 'Unknown Channel'}</p>
                  <p className="text-gray-400 text-sm">@{pass.channel?.user?.username || 'unknown'}</p>
                </div>
              </motion.div>
              
              {/* Purchase card with glass effect */}
              <motion.div 
                className="relative rounded-xl overflow-hidden"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl opacity-40 blur-md"></div>
                
                <div className="relative bg-black/60 backdrop-blur-md rounded-xl p-6 border border-white/10 space-y-4 shadow-xl z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-pink-500/5" />

                  <div className="absolute top-4 right-4">
                    <TestnetModeBadge />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-400" />
                    <p className="font-semibold text-lg">
                      {alreadyOwns ? 'You own this premium content' : 'Unlock premium content'}
                    </p>
                  </div>
                  
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {alreadyOwns 
                      ? 'You already have access to this content. Enjoy watching!' 
                      : 'Own this NFT pass and stream every video instantly. Yours forever—even if you sell it later.'}
                  </p>
                
                <PassActionButton 
                  pass={{
                    id: pass.id,
                    tier: pass.tier,
                    formatted_price: pass.formatted_price,
                    supply_cap: pass.supply_cap,
                    minted_count: pass.minted_count
                  }}
                  alreadyOwns={alreadyOwns}
                  isAccessLoading={isAccessLoading}
                />
               </div>
              </motion.div>
              
              {/* Features section */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <PassFeature 
                  icon={ShoppingBag} 
                  title="On-chain ownership" 
                  description="You own this NFT pass forever"
                />
                <PassFeature 
                  icon={Clock} 
                  title="Lifetime streaming" 
                  description="No expiration or renewals"
                />
                <PassFeature 
                  icon={TrendingUp} 
                  title="Resell on marketplace" 
                  description="Trade your pass anytime"
                />
                <PassFeature 
                  icon={Award} 
                  title="Creator exclusives" 
                  description="Special access content"
                />
              </div>
              
              {/* Security badge */}
              <div className="mt-8 flex justify-center">
                <motion.div 
                  whileHover={{ y: prefersReducedMotion ? 0 : -2 }}
                  className="flex items-center gap-2 bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-sm text-white/70"
                >
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span>Secure Stripe Payment • NFT Content Pass on Base L2</span>
                </motion.div>
            </div>
            </motion.div>
          </motion.div>
        </div>
      </div>



      {/* Description section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ANIMATIONS.page}
        className="max-w-4xl mx-auto px-4 py-16"
      >
        <div className="space-y-8">
          {/* About section with cleaner design */}
          <div className={`relative ${STYLES.glass.background} backdrop-blur-sm rounded-2xl border ${STYLES.glass.border} overflow-hidden`}>
            {/* Orange accent border */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${STYLES.gradients.orange}`}></div>
            
            {/* Award badge in corner */}
            <div className="absolute top-4 right-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-orange-400" />
              </div>
            </div>

            <div className="p-8 pl-12">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                About this premium content
              </h2>
              
              <div className="max-w-2xl">
                <div className="relative">
                  <div 
                    className="text-gray-300 text-base leading-relaxed mb-4 prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: displayDescription || 'No description available.' 
                    }}
                  />
                  
                  {isLongDescription && !expandedDesc && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none"></div>
                  )}
                </div>
                
                {isLongDescription && (
                  <button 
                    onClick={() => setExpandedDesc(!expandedDesc)}
                    className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                  >
                    {expandedDesc ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
              
              {/* Cleaner creator bio */}
              {pass.channel && (
                <div className="mt-8 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center uppercase text-sm font-bold shadow-lg">
                        {pass.channel?.name?.charAt(0) || '?'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{pass.channel?.name}</p>
                      <p className="text-gray-400 text-sm">@{pass.channel?.user?.username || 'unknown'}</p>
                    </div>
                    
                    <Link 
                      to={`/channel/${(pass.channel as any).id || ''}`} 
                      className="px-4 py-2 text-sm bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg border border-white/[0.1] transition-colors"
                    >
                      View Channel
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* How it works section - cleaner design */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] overflow-hidden"
          >
            {/* Lock icon badge */}
            <div className="absolute top-4 right-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <LockIcon className="w-4 h-4 text-orange-400" />
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-8 text-white">
                How it works
              </h2>
              
              {/* Step progression with connecting lines */}
              <div className="relative">
                {/* Progress line for desktop */}
                <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 opacity-30"></div>
                
                <div className="grid md:grid-cols-3 gap-8 md:gap-6">
                  {/* Step 1 */}
                  <div className="relative group">
                    <div className="bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-6 border border-white/[0.05] transition-all duration-300 h-full">
                      <div className="flex flex-col items-start">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg relative z-10">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-white text-lg mb-3">Purchase the pass</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Buy this NFT pass with credit card or crypto to unlock exclusive content.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="relative group">
                    <div className="bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-6 border border-white/[0.05] transition-all duration-300 h-full">
                      <div className="flex flex-col items-start">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg relative z-10">
                          <Unlock className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-white text-lg mb-3">Instant access</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Stream all content immediately after your purchase is processed.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="relative group">
                    <div className="bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-6 border border-white/[0.05] transition-all duration-300 h-full">
                      <div className="flex flex-col items-start">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg relative z-10">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-white text-lg mb-3">Own the pass</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Your pass is an asset you can keep or resell later in our marketplace.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
      </div>
      </motion.div>
      
      {/* CSS for animated particles */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-100px) translateX(20px); }
          100% { transform: translateY(-200px) translateX(0); opacity: 0; }
        }
        .particle-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .text-shadow {
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

// Enhanced PassFeature with description
const PassFeature: React.FC<{ icon: React.FC<any>; title: string; description: string }> = ({ 
  icon: Icon, 
  title,
  description 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div 
      whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
      className="flex flex-col gap-1 bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/5"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
      <p className="text-xs text-gray-400 pl-6">{description}</p>
    </motion.div>
  );
};

export default PassDetailsPage; 