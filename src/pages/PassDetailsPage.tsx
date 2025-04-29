import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePassDetails, useSignedVideoUrl, usePurchasedPasses } from '../hooks/usePass';
import UnlockButton from '../components/pass/UnlockButton';
import { motion } from 'framer-motion';
import { LockIcon, TrendingUp, Award, Globe, Clock, Star, Shield, PlayCircle, Check } from 'lucide-react';
import PremiumHeader from '../components/pass/PremiumHeader';
import PassVideoPlayer from '../components/pass/PassVideoPlayer';

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

const PassDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: pass, isLoading, error } = usePassDetails(slug);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Fetch passes user owns (if authenticated)
  const { data: purchasedPasses } = usePurchasedPasses();

  // Check for ownership by trying to get a signed URL
  // If the user already owns it, this should succeed
  const {
    data: signedUrl,
    isLoading: isUrlLoading,
    isError: isUrlError,
  } = useSignedVideoUrl(
    // If we have a pass with videos, try to get the signed URL
    pass?.videos?.[0]?.id || null,
    // Only enable this query if we have a pass with videos
    Boolean(pass?.videos?.[0]?.id)
  );

  // Determine if user already owns this pass
  const ownsViaList = purchasedPasses?.some(p => p.id === pass?.id);
  const alreadyOwns = Boolean(signedUrl) || ownsViaList;

  const navigate = useNavigate();

  useEffect(() => {
    if (pass) {
      document.title = `${pass.title} | Premium Content Pass`;
    }
  }, [pass]);

  if (isLoading) {
    return (
      <>
        <PremiumHeader />
      <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full opacity-30 animate-pulse blur-xl"></div>
              <div className="w-16 h-16 border-4 border-t-transparent border-orange-500 rounded-full animate-spin" />
            </div>
            <p className="text-gray-400 animate-pulse">Loading premium content...</p>
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
    if (!signedUrl) return null;
    
    return (
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg inline-flex">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">You already own this pass</span>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden shadow-2xl"
        >
          <PassVideoPlayer 
            signedUrl={signedUrl} 
            autoPlay={false}
            className="w-full aspect-video"
          />
        </motion.div>
      </div>
    );
  };

  // Unlock or View button based on ownership
  const renderActionButton = () => {
    if (isUrlLoading) {
      return (
        <div className="h-12 bg-black/40 rounded-lg animate-pulse w-32"></div>
      );
    }
    
    if (alreadyOwns) {
      return (
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Price</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              {pass.formatted_price}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/watch/${pass.id}`)}
            className="relative group overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-green-500/20 transition-all duration-300"
          >
            View Content
          </motion.button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Price</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
            {pass.formatted_price}
          </span>
        </div>
        <UnlockButton 
          passId={pass.id} 
          className="relative group overflow-hidden bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-orange-500/20 transition-all duration-300" 
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0f] to-[#09090B] text-white">
      <PremiumHeader passTitle={pass.title} creatorName={pass.channel?.name} />
      
      {/* Hero section */}
      <div className="relative w-full overflow-hidden pt-16">
        {Array.isArray(pass.videos) && pass.videos[0]?.thumbnail_url ? (
          <>
            {/* Background blur */}
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.35, scale: 1 }}
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
                {[...Array(20)].map((_, i) => (
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
              animate={{ opacity: 0.35, scale: 1 }}
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
                {[...Array(20)].map((_, i) => (
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
              <span className="text-white/90 text-sm font-medium">Exclusive Premium Content</span>
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
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl opacity-30 blur-md"></div>
              
              {Array.isArray(pass.videos) && pass.videos[0]?.thumbnail_url ? (
                <img
                  src={pass.videos[0].thumbnail_url}
                  alt={pass.title}
                  className="w-full h-auto rounded-xl shadow-2xl border border-white/10 relative z-10"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border border-white/10 relative z-10 overflow-hidden">
                  <img 
                    src="/assets/Content-pass.webp" 
                    alt="Premium Content Pass" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                      <p className="text-sm text-white/80">Unlock video</p>
                      <p className="text-xs text-white/50">Support the creator and get exclusive access</p>
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
                <span className="text-gray-400 text-sm font-medium">Premium Content</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {pass.title}
              </h1>
              
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ x: 5 }}
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
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl opacity-40 blur-md"></div>
                
                <div className="relative bg-black/60 backdrop-blur-md rounded-xl p-6 border border-white/10 space-y-4 shadow-xl z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-pink-500/5" />
                  
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-400" />
                    <p className="font-semibold text-lg">
                      {alreadyOwns ? 'You own this premium content' : 'Unlock this premium content'}
                    </p>
                  </div>
                  
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {alreadyOwns 
                      ? 'You already have access to this content. Enjoy watching!' 
                      : 'Support the creator and gain exclusive access to premium content'}
                  </p>
                
                {renderActionButton()}
               </div>
              </motion.div>
              
              {/* Features section */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <PassFeature icon={Globe} title="Premium Access" />
                <PassFeature icon={Clock} title="Lifetime Access" />
                <PassFeature icon={TrendingUp} title="" />
                <PassFeature icon={Award} title="Exclusive Content" />
              </div>
              
              {/* Security badge */}
              <div className="mt-8 flex justify-center">
                <motion.div 
                  whileHover={{ y: -2 }}
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
          <div className="prose prose-invert prose-sm">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {pass.description || 'No description available.'}
            </p>
          </div>
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
              <span>How Content Passes work</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                  <span className="font-bold text-orange-400">1</span>
                </div>
                <h3 className="font-medium mb-2">Purchase the pass</h3>
                <p className="text-sm text-gray-400">Buy this NFT pass to unlock access to exclusive content.</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                  <span className="font-bold text-orange-400">2</span>
                </div>
                <h3 className="font-medium mb-2">Instant access</h3>
                <p className="text-sm text-gray-400">Watch the content immediately after your purchase is processed.</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                  <span className="font-bold text-orange-400">3</span>
                </div>
                <h3 className="font-medium mb-2">Own the pass</h3>
                <p className="text-sm text-gray-400">Your pass is an asset you can keep or sell in our marketplace.</p>
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
      `}</style>
    </div>
  );
};

const PassFeature: React.FC<{ icon: React.FC<any>; title: string }> = ({ icon: Icon, title }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/5"
    >
      <Icon className="w-4 h-4 text-orange-400" />
      <span className="text-sm font-medium text-gray-300">{title}</span>
    </motion.div>
  );
};

export default PassDetailsPage; 