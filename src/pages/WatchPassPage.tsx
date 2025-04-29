import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { usePassDetails, usePurchasedPasses } from '../hooks/usePass';
import { useTokenGate } from '../hooks/useTokenGate';
import PassVideoPlayer from '../components/pass/PassVideoPlayer';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Play } from 'lucide-react';
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

  // State to track which video is currently selected for playback
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // When pass details load (or change), default to first video
  useEffect(() => {
    if (firstVideoId) {
      setSelectedVideoId(firstVideoId);
    }
  }, [firstVideoId]);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <PremiumHeader passTitle={pass.title} creatorName={pass.channel?.name} />
      <div className="mx-auto px-4 py-8 pt-20 space-y-8">
        {/* Back link */}
        <Link to={`/p/${passId ?? ''}`} className="inline-flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to details
        </Link>

        {/* Video player */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {signedUrl ? (
            <PassVideoPlayer signedUrl={signedUrl} autoPlay title={pass.title} />
          ) : (
            <div className="aspect-video w-full bg-gray-800 flex items-center justify-center text-gray-400">Select a video to play</div>
          )}
        </motion.div>

        {/* Videos grid */}
        {Array.isArray(pass.videos) && pass.videos.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pass.videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideoId(video.id)}
                className={`relative group border border-white/10 rounded-lg overflow-hidden ${selectedVideoId === video.id ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-black' : ''}`}
              >
                {/* Thumbnail */}
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={pass.title} className="w-full h-full object-cover aspect-video" />
                ) : (
                  <div className="w-full aspect-video bg-gray-700 flex items-center justify-center text-gray-400 text-sm">No thumbnail</div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchPassPage; 