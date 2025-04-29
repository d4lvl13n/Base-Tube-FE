import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCheckoutStatus, useSignedVideoUrl } from '../hooks/usePass';
import PassVideoPlayer from '../components/pass/PassVideoPlayer';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [videoId, setVideoId] = useState<string | null>(null);

  // Poll for checkout status
  const { 
    data: checkoutStatus, 
    error: statusError, 
    isLoading: isStatusLoading,
    isError: isStatusError
  } = useCheckoutStatus(sessionId);

  // Only fetch video URL when we have a completed purchase with pass_id
  const {
    data: signedUrl,
    isLoading: isVideoLoading,
    isError: isVideoError,
    error: videoError
  } = useSignedVideoUrl(videoId, Boolean(videoId));

  // Handle initial invalid access
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
    }
  }, [sessionId, navigate]);

  // Set videoId when checkout is completed
  useEffect(() => {
    if (checkoutStatus?.status === 'completed' && checkoutStatus.pass_id) {
      // In a real implementation, you'd get the actual videoId from the pass details
      // Here we're assuming the pass has a single video and pass_id can be used
      // as the videoId for demonstration purposes
      setVideoId(checkoutStatus.pass_id);
    }
  }, [checkoutStatus]);

  if (!sessionId) return null;

  // Loading state - waiting for checkout confirmation
  if (isStatusLoading || (!isStatusError && checkoutStatus?.status === 'processing')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="space-y-6 text-center max-w-lg p-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="mx-auto w-12 h-12 text-orange-500"
          >
            <RefreshCw className="w-12 h-12" />
          </motion.div>
          <h1 className="text-3xl font-bold">Processing your purchase</h1>
          <p className="text-gray-300">
            Your payment was successful! We're now processing your access to the premium content.
            This usually takes a few seconds...
          </p>
        </div>
      </div>
    );
  }

  // Error with checkout status
  if (isStatusError || ['expired', 'open'].includes(checkoutStatus?.status || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="space-y-6 text-center max-w-lg p-8 bg-red-900/20 rounded-xl border border-red-500/20">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold">Payment issue</h1>
          <p className="text-gray-300">
            {statusError?.message || 
             `There was a problem with your purchase (Status: ${checkoutStatus?.status || 'unknown'}).`}
          </p>
          <div className="pt-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success but waiting for or error with video URL
  if (!signedUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="space-y-6 text-center max-w-lg p-8">
          {isVideoLoading ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="mx-auto w-12 h-12 text-orange-500"
              >
                <RefreshCw className="w-12 h-12" />
              </motion.div>
              <h1 className="text-3xl font-bold">Loading your premium content</h1>
              <p className="text-gray-300">
                Your access is confirmed! We're preparing your premium content for viewing...
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
              <h1 className="text-3xl font-bold">Content temporarily unavailable</h1>
              <p className="text-gray-300">
                {videoError?.message || "We're having trouble loading your premium content."}
              </p>
              <div className="pt-4 space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Success with video player
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Purchase Successful</span>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden shadow-2xl"
        >
          <PassVideoPlayer 
            signedUrl={signedUrl} 
            autoPlay={true}
            className="w-full aspect-video"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h1 className="text-2xl font-bold mb-4">Thank you for your purchase!</h1>
          <p className="text-gray-300">
            You now have access to this premium content. You can return to this page at any time
            to view it again. Enjoy!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage; 