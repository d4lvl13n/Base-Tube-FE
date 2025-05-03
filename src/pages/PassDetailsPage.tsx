import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePassDetails, usePurchasedPasses } from '../hooks/usePass';
import { useTokenGate } from '../hooks/useTokenGate';
import UnlockButton from '../components/pass/UnlockButton';
import { motion, useReducedMotion } from 'framer-motion';
import { LockIcon, TrendingUp, Award, Globe, Clock, Star, Shield, PlayCircle, Check, ShoppingBag, Share2, Gift } from 'lucide-react';
import PremiumHeader from '../components/pass/PremiumHeader';

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
  });

  const alreadyOwns = ownsViaList || hasSignedAccess;

  // Scroll position tracking for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 350);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    if (pass) {
      document.title = `${pass.title} | Premium Content Pass`;
    }
  }, [pass]);

  // Get random fallback image when no thumbnail exists
  const getFallbackImage = () => {
    return '/assets/Content-pass.webp';
  };

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

  // Content player section when user already owns the pass
  const renderContentPlayer = () => {
    if (!hasSignedAccess) return null;
    
    return (
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg inline-flex">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Pass unlocked—you're in!</span>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden shadow-2xl"
        >
          <div className="w-full aspect-video bg-black/40 flex items-center justify-center rounded-xl">
            <motion.button
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
              onClick={() => navigate(`/watch/${pass.id}`)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-green-500/20 transition-all duration-300 flex items-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Start Watching
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Sticky header that appears on scroll
  const renderStickyHeader = () => {
    if (!isScrolled) return null;
    
    return (
      <motion.div 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="fixed top-16 left-0 right-0 bg-black/90 backdrop-blur-md z-40 border-b border-white/10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {Array.isArray(pass.videos) && pass.videos[0]?.thumbnail_url ? (
              <img 
                src={pass.videos[0].thumbnail_url} 
                alt={`${pass.title} thumbnail`}
                className="w-6 h-6 rounded object-cover"
              />
            ) : null}
            <span className="font-medium text-sm truncate max-w-[180px]">{pass.title}</span>
            <span className="text-orange-400 font-bold">{pass.formatted_price}</span>
          </div>
          
          {alreadyOwns ? (
            <button
              onClick={() => navigate(`/watch/${pass.id}`)}
              className="text-xs bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1"
            >
              <PlayCircle className="w-3 h-3" />
              Watch
            </button>
          ) : (
            <UnlockButton 
              passId={pass.id} 
              className="text-xs bg-orange-500 text-white px-3 py-1 rounded flex items-center gap-1" 
            />
          )}
        </div>
      </motion.div>
    );
  };

  // Unlock or View button based on ownership
  const renderActionButton = () => {
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

  // Determine if description is long and should be collapsed
  const isLongDescription = (pass.description?.length || 0) > 400;
  const displayDescription = isLongDescription && !expandedDesc 
    ? `${pass.description?.substring(0, 400)}...` 
    : pass.description;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0f] to-[#09090B] text-white">
      <PremiumHeader passTitle={pass.title} creatorName={pass.channel?.name} />
      {renderStickyHeader()}
      
      {/* Hero section */}
      <div className="relative w-full overflow-hidden pt-16">
        {Array.isArray(pass.videos) && pass.videos[0]?.thumbnail_url ? (
          <>
            {/* Background blur */}
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
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
              transition={{ duration: 1.5, ease: "easeOut" }}
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
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="grid md:grid-cols-5 gap-8 items-start"
          >
            {/* Thumbnail Section */}
            <motion.div 
              className="md:col-span-3 relative"
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
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
                <TierBadge tier={pass.tier} />
                <span className="text-gray-400 text-sm font-medium">Premium Pass</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 text-shadow">
                {pass.title}
              </h1>
              
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ x: prefersReducedMotion ? 0 : 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-full w-12 h-12 flex items-center justify-center uppercase text-sm font-bold shadow-lg">
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
                
                {renderActionButton()}
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

      {/* Display content player if already owns */}
      {alreadyOwns && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="max-w-6xl mx-auto px-4 py-8"
        >
          <div id="content-section" className="relative max-w-4xl mx-auto">
            {renderContentPlayer()}
          </div>
        </motion.div>
      )}

      {/* Description section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="max-w-6xl mx-auto px-4 py-12"
      >
        <div className="relative max-w-3xl">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-white/10 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-400" />
              <span>About this premium content</span>
            </h2>
            <div className="prose prose-invert prose-sm prose-h6:my-1">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {displayDescription || 'No description available.'}
              </p>
              
              {isLongDescription && (
                <button 
                  onClick={() => setExpandedDesc(!expandedDesc)}
                  className="text-orange-400 hover:text-orange-300 text-sm mt-2 font-medium"
                >
                  {expandedDesc ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
            
            {/* Creator bio card */}
            {pass.channel && (
              <div className="mt-8 bg-black/20 rounded-lg p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-full w-10 h-10 flex items-center justify-center uppercase text-xs font-bold shadow-lg">
                    {pass.channel?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{pass.channel?.name}</p>
                    <p className="text-gray-400 text-xs">Creator</p>
                  </div>
                  
                  <Link 
                    to={`/channel/${(pass.channel as any).id || ''}`} 
                    className="ml-auto text-xs bg-black/30 hover:bg-black/50 px-3 py-1 rounded-full border border-white/10"
                  >
                    View Channel
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* How it works section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-white/10 shadow-xl"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <LockIcon className="w-5 h-5 text-orange-400" />
              <span>How it works</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                  <span className="font-bold text-orange-400">1</span>
                </div>
                <h3 className="font-medium mb-2">Purchase the pass</h3>
                <p className="text-sm text-gray-400">Buy this NFT pass with credit card or crypto to unlock exclusive content.</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                  <span className="font-bold text-orange-400">2</span>
                </div>
                <h3 className="font-medium mb-2">Instant access</h3>
                <p className="text-sm text-gray-400">Stream all content immediately after your purchase is processed.</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                  <span className="font-bold text-orange-400">3</span>
                </div>
                <h3 className="font-medium mb-2">Own the pass</h3>
                <p className="text-sm text-gray-400">Your pass is an asset you can keep or resell later in our marketplace.</p>
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