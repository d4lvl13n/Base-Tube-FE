import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { usePassDetails, usePurchasedPasses } from '../hooks/usePass';
import { useTokenGate } from '../hooks/useTokenGate';
import PassVideoPlayer from '../components/pass/PassVideoPlayer';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Play, Info } from 'lucide-react';
import PremiumHeader from '../components/pass/PremiumHeader';
import VideoDescriptionPanel from '../components/pass/VideoDescriptionPanel';
import { PassVideo } from '../types/pass';

const WatchPassPage: React.FC = () => {
  const { passId } = useParams<{ passId: string }>();

  // Fetch pass details
  const {
    data: pass,
    isLoading: isPassLoading,
    error: passError,
  } = usePassDetails(passId);

  // Purchased passes check
  const { data: purchasedPasses } = usePurchasedPasses();
  const ownsPass = useMemo(() => purchasedPasses?.some(p => p.id === passId), [purchasedPasses, passId]);

  // Current video selection state
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Description panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedVideoForPanel, setSelectedVideoForPanel] = useState<any>(null);

  // Default to first video when pass data loads
  useEffect(() => {
    if (pass?.videos?.[0]?.id && !selectedVideoId) {
      setSelectedVideoId(pass.videos[0].id);
    }
  }, [pass?.videos, selectedVideoId]);

  // Token gating hook - must be called unconditionally
  const {
    signedUrl,
    isLoading: isGateLoading,
    is403,
    promptAuth,
  } = useTokenGate(selectedVideoId, { autoAuth: false });

  // Prompt auth if needed
  useEffect(() => {
    if (ownsPass && selectedVideoId && !signedUrl && !isGateLoading) {
      promptAuth();
    }
  }, [ownsPass, selectedVideoId, signedUrl, isGateLoading, promptAuth]);

  // Function to handle playing the next video
  const handleNextVideo = useCallback(() => {
    if (!pass?.videos || !selectedVideoId) return;

    const currentIndex = pass.videos.findIndex(v => v.id === selectedVideoId);
    if (currentIndex !== -1 && currentIndex < pass.videos.length - 1) {
      const nextVideo = pass.videos[currentIndex + 1];
      setSelectedVideoId(nextVideo.id);
    } // No looping for now
  }, [pass?.videos, selectedVideoId]);

  // Check if there is a next video
  const hasNextVideo = useMemo(() => {
    if (!pass?.videos || !selectedVideoId) return false;
    const currentIndex = pass.videos.findIndex(v => v.id === selectedVideoId);
    return currentIndex !== -1 && currentIndex < pass.videos.length - 1;
  }, [pass?.videos, selectedVideoId]);

  // Handle thumbnail click to open panel
  const handleThumbnailClick = (videoId: string) => {
    if (pass?.videos) {
      const video = pass.videos.find(v => v.id === videoId);
      if (video) {
        setSelectedVideoForPanel(video);
        setIsPanelOpen(true);
      }
    }
  };

  // Handle play from panel
  const handlePlayFromPanel = () => {
    if (selectedVideoForPanel) {
      setSelectedVideoId(selectedVideoForPanel.id);
      setIsPanelOpen(false);
    }
  };

  // --- Early returns --- 
  if (!passId) return <Navigate to="/" replace />;

  if (isPassLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading Pass Details…</div>
    );
  }

  if (passError || !pass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">Pass not found</div>
    );
  }

  // If still loading access (and a video is selected)
  if (selectedVideoId && isGateLoading && !signedUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">Verifying access…</div>
    );
  }

  // If user has no access
  if (!ownsPass && selectedVideoId && (is403 || !signedUrl)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8 text-center">
        <div>
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="mb-6">You don't own this pass yet.</p>
          <Link to={`/p/${passId ?? ''}`} className="px-6 py-3 bg-orange-500 rounded-lg inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />Back to Pass Page
          </Link>
        </div>
      </div>
    );
  }

  // --- Main Render --- 
  return (
    <div className="min-h-screen bg-black text-white">
      <PremiumHeader passTitle={pass.title} creatorName={pass.channel?.name} passId={passId} />
      <div className="mx-auto px-4 py-8 pt-20 space-y-8">
        {/* Video player */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Render only if a video is selected and we have access */}
          {selectedVideoId && signedUrl ? (
            <PassVideoPlayer 
              key={selectedVideoId} 
              signedUrl={signedUrl} 
              autoPlay 
              title={(pass.videos.find(v => v.id === selectedVideoId) as PassVideo)?.title || pass.title} 
              onNextVideo={hasNextVideo ? handleNextVideo : undefined} 
            />
          ) : (
            <div className="aspect-video w-full bg-gray-800 flex items-center justify-center text-gray-400">
              {selectedVideoId ? 'Loading video access...' : 'Select a video to play'}
            </div>
          )}
        </motion.div>

        {/* Videos grid */}
        {Array.isArray(pass.videos) && pass.videos.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pass.videos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => handleThumbnailClick(video.id)}
                className={`relative group border border-white/10 rounded-lg overflow-hidden transition-all duration-200 ${selectedVideoId === video.id ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-black' : 'hover:border-white/30'}`}
              >
                {/* Thumbnail */}
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={(video as PassVideo).title || pass.title} className="w-full h-full object-cover aspect-video" />
                ) : (
                  <div className="w-full aspect-video bg-gray-700 flex items-center justify-center text-gray-400 text-sm">No thumbnail</div>
                )}

                {/* Info badge */}
                <div className="absolute top-2 right-2">
                  <div className="bg-black/70 backdrop-blur-sm p-1 rounded-full">
                    <Info className="w-4 h-4 text-white/70" />
                  </div>
                </div>

                {/* Play overlay */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${selectedVideoId === video.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className="w-12 h-12 rounded-full bg-orange-500/80 flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-6 h-6 text-white" fill="white" />
                  </div>
                </div>
                
                {/* Video number */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs">
                  Video {index + 1}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Description Panel */}
      <VideoDescriptionPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        video={selectedVideoForPanel}
        passTitle={pass.title}
        creatorName={pass.channel?.name}
        onPlay={handlePlayFromPanel}
        videoIndex={selectedVideoForPanel ? pass.videos?.findIndex(v => v.id === selectedVideoForPanel.id) || 0 : 0}
        totalVideos={pass.videos?.length || 0}
      />
    </div>
  );
};

export default WatchPassPage; 