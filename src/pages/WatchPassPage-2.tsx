import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { usePassDetails, usePurchasedPasses } from '../hooks/usePass';
import { useTokenGate } from '../hooks/useTokenGate';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Play, Award, Shield, Info, ExternalLink } from 'lucide-react';
import PremiumHeader from '../components/pass/PremiumHeader';

const WatchPassPage: React.FC = () => {
  const { passId } = useParams<{ passId: string }>();

  // Fetch pass details to know videoId and other metadata
  const {
    data: pass,
    isLoading: isPassLoading,
    error: passError,
  } = usePassDetails(passId);

  const firstVideoId = pass?.videos?.[0]?.id;

  const { data: purchasedPasses } = usePurchasedPasses();
  const ownsPass = purchasedPasses?.some(p => p.id === passId);

  // State to track which video is currently selected for details
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // When pass details load (or change), default to first video
  useEffect(() => {
    if (firstVideoId && pass?.videos?.length) {
      setSelectedVideoId(firstVideoId);
      setSelectedVideo(pass.videos.find(v => v.id === firstVideoId));
    }
  }, [firstVideoId, pass?.videos]);

  // Update selected video when selectedVideoId changes
  useEffect(() => {
    if (selectedVideoId && pass?.videos) {
      setSelectedVideo(pass.videos.find(v => v.id === selectedVideoId));
    }
  }, [selectedVideoId, pass?.videos]);

  const {
    signedUrl,
    isLoading: isGateLoading,
    is403,
    promptAuth,
  } = useTokenGate(selectedVideoId, { autoAuth: false });

  if (!passId) return <Navigate to="/" replace />;

  if (isPassLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading…</div>
    );
  }

  if (passError || !pass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">Pass not found</div>
    );
  }

  // If still loading access
  if (isGateLoading && !signedUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">Verifying access…</div>
    );
  }

  // If user has no access redirect to landing
  if (!ownsPass && (is403 || !signedUrl)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8 text-center">
        <div>
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="mb-6">You don\'t own this pass yet.</p>
          <Link to={`/p/${passId ?? ''}`} className="px-6 py-3 bg-orange-500 rounded-lg inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />Back to Pass Page
          </Link>
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return 'from-amber-500 to-amber-700';
      case 'silver': return 'from-slate-300 to-slate-500';
      case 'gold': return 'from-yellow-300 to-yellow-600';
      case 'platinum': return 'from-sky-300 to-sky-600';
      default: return 'from-purple-400 to-purple-600';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <PremiumHeader passTitle={pass.title} creatorName={pass.channel?.name} />
      <div className="mx-auto max-w-7xl px-4 py-8 pt-20 space-y-8">
        {/* Back link */}
        <Link to={`/p/${passId ?? ''}`} className="inline-flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to details
        </Link>

        {/* Content grid layout - side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side: Video grid (takes 1/3 width on desktop) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" /> 
                <span>Your Content Pass</span>
              </h2>

              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${getTierColor(pass.tier)} text-white`}>
                  {pass.tier}
                </div>
                <div className="text-green-400 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Owned</span>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-400 mb-4">
                <p className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-orange-400" />
                  <span>{pass.videos?.length || 0} premium videos</span>
                </p>
                <p className="flex items-center gap-1">
                  <Info className="w-4 h-4 text-orange-400" />
                  <span>By {pass.channel?.name || 'Creator'}</span>
                </p>
              </div>
            </div>

            {/* Videos grid */}
            <div className="space-y-2">
              <h3 className="font-medium text-white/80">Pass Contents</h3>
              <div className="grid grid-cols-1 gap-3">
                {Array.isArray(pass.videos) && pass.videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideoId(video.id)}
                    className={`relative group flex border border-white/10 rounded-lg overflow-hidden ${selectedVideoId === video.id ? 'bg-gray-800 ring-1 ring-orange-500' : 'bg-gray-900/30 hover:bg-gray-800/50'} transition-all duration-200`}
                  >
                    {/* Thumbnail */}
                    <div className="w-24 h-16 shrink-0">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.platform || pass.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-sm">No thumb</div>
                      )}
                      
                      {/* Selection indicator */}
                      {selectedVideoId === video.id && (
                        <div className="absolute inset-0 bg-orange-500/20 border border-orange-500/50"></div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="p-2 text-left flex-1 flex items-center">
                      <p className="text-sm text-white/80 truncate group-hover:text-white">
                        {`Video ${pass.videos.indexOf(video) + 1}`}
                      </p>
                    </div>

                    {/* Icon on hover */}
                    <div className="flex items-center p-2">
                      <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedVideoId === video.id ? 'opacity-100' : ''}`}>
                        <ExternalLink className="w-4 h-4 text-orange-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right side: Selected video details (takes 2/3 width on desktop) */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 h-full">
              {/* Selected video thumbnail (large) */}
              {selectedVideo && (
                <div className="space-y-6">
                  <div className="aspect-video rounded-lg overflow-hidden relative group">
                    <img 
                      src={selectedVideo.thumbnail_url || '/assets/Content-pass.webp'} 
                      alt={pass.title || 'Video thumbnail'} 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Overlay content */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="bg-orange-500 w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Premium Content</h3>
                        <p className="text-gray-300 mb-4">This content is included in your pass</p>
                        
                        {/* View directly button */}
                        <a 
                          href={signedUrl || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg"
                        >
                          <Play className="w-4 h-4" />
                          View in New Tab
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video info section */}
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold">{pass.title}</h2>
                    <p className="text-gray-400">{pass.description || 'No description available for this video.'}</p>
                  </div>
                  
                  {/* Creator info */}
                  <div className="pt-4 mt-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center uppercase text-sm font-bold">
                        {pass.channel?.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="font-semibold">{pass.channel?.name || 'Creator'}</p>
                        <p className="text-sm text-gray-400">@{pass.channel?.user?.username || 'creator'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* No video selected state */}
              {!selectedVideo && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">Select a video from the list</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPassPage; 