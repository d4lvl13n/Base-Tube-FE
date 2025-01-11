import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Twitter, Link, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface VideoUploadSuccessProps {
  videoTitle: string;
  videoId: string | null;
  onClose: () => void;
  uploadProgress: number;
}

const VideoUploadSuccess: React.FC<VideoUploadSuccessProps> = ({ 
  videoTitle, 
  videoId, 
  onClose,
  uploadProgress 
}) => {
  const [showSharing, setShowSharing] = useState(false);
  const videoUrl = `${window.location.origin}/video/${videoId}`;

  useEffect(() => {
    if (uploadProgress === 100) {
      const timer = setTimeout(() => {
        setShowSharing(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {uploadProgress < 100 ? (
          <UploadProgressAnimation progress={uploadProgress} />
        ) : !showSharing ? (
          <UploadSuccessAnimation videoTitle={videoTitle} />
        ) : (
          <ShareOptions 
            videoUrl={videoUrl}
            videoTitle={videoTitle}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const UploadProgressAnimation: React.FC<{ progress: number }> = ({ progress }) => (
  <motion.div className="w-full max-w-md p-8">
    <motion.div
      className="w-40 h-40 mx-auto mb-8 relative"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#fa7517"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress / 100 }}
          transition={{ duration: 0.5 }}
          style={{
            rotate: -90,
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{progress}%</span>
      </div>
    </motion.div>
    <h2 className="text-2xl font-bold text-white text-center mb-2">Uploading...</h2>
    <p className="text-gray-400 text-center">Please don't close this window</p>
  </motion.div>
);

const UploadSuccessAnimation: React.FC<{ videoTitle: string }> = ({ videoTitle }) => {
  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main animation container */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 1.5, times: [0, 0.6, 1] }}
      >
        {/* Animated video player frame */}
        <motion.div
          className="relative w-48 h-48 bg-gradient-to-br from-[#fa7517] to-[#ff8c3a] rounded-2xl flex items-center justify-center overflow-hidden"
          animate={{
            borderRadius: ["16%", "24%", "16%"],
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        >
          {/* Play button that transforms into a star */}
          <motion.div
            className="relative"
            initial={{ scale: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 1.5, delay: 0.3 }}
          >
            {/* Animated play symbol morphing into a star */}
            <svg className="w-24 h-24" viewBox="0 0 24 24">
              <motion.path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0, fill: "rgba(0, 0, 0, 0)" }}
                animate={{ 
                  pathLength: 1,
                  fill: "rgba(0, 0, 0, 1)",
                }}
                transition={{ 
                  duration: 2,
                  fill: { delay: 1, duration: 1 }
                }}
              />
            </svg>
          </motion.div>

          {/* Animated rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border-2 border-white/30 rounded-2xl"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ 
                scale: [1, 2, 2],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.4,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
          ))}

          {/* Rotating gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </motion.div>

      {/* Title card with glass effect */}
      <motion.div
        className="absolute top-2/3 left-1/2 transform -translate-x-1/2 mt-12 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <h2 className="text-4xl font-bold text-[#fa7517] text-center mb-2">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              🎉 Amazing! 🎉
            </motion.span>
          </h2>
          <p className="text-xl text-white/90 text-center font-medium">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              "{videoTitle}" is ready to inspire the world!
            </motion.span>
          </p>
        </div>
      </motion.div>

      {/* Celebratory particles */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-${Math.random() > 0.5 ? '2' : '3'} h-${Math.random() > 0.5 ? '2' : '3'} 
            ${Math.random() > 0.5 ? 'bg-[#fa7517]' : 'bg-white'} rounded-full`}
          initial={{ 
            x: "50%",
            y: "50%",
            scale: 0,
            opacity: 0 
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: [0, 1, 0.5],
            opacity: [0, 1, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
      ))}

      {/* Rising stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute bottom-0 text-[#fa7517]"
          initial={{ 
            x: `${Math.random() * 100}%`,
            y: 100,
            opacity: 0,
            scale: 0.5
          }}
          animate={{
            y: -100,
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3,
            delay: i * 0.4,
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          ⭐
        </motion.div>
      ))}
    </motion.div>
  );
};

const ShareOptions: React.FC<{
  videoUrl: string;
  videoTitle: string;
  onClose: () => void;
}> = ({ videoUrl, videoTitle, onClose }) => {
  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(`Check out my new video: ${videoTitle}`)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      url: `https://wa.me/?text=${encodeURIComponent(`Check out my new video: ${videoTitle} ${videoUrl}`)}`,
    },
  ];

  return (
    <motion.div
      className="w-full max-w-2xl p-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Share Your Video</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {shareOptions.map((option) => (
          <motion.div
            key={option.name}
            className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            style={{
              boxShadow: `
                0 0 20px 5px rgba(250, 117, 23, 0.1),
                0 0 40px 10px rgba(250, 117, 23, 0.05),
                inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
              `
            }}
          >
            <div className="relative z-10">
              <div className="p-3 bg-gray-900/50 rounded-lg w-fit mb-4">
                <option.icon className="w-6 h-6" style={{ color: option.color }} />
              </div>
              <h3 className="text-white font-medium">{option.name}</h3>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          </motion.div>
        ))}
      </div>

      <motion.button
        onClick={() => {
          navigator.clipboard.writeText(videoUrl);
          toast.success('Video link copied to clipboard!');
        }}
        className="w-full p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden mb-4"
        whileHover={{ scale: 1.02 }}
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          <Link className="w-5 h-5 text-[#fa7517]" />
          <span className="text-white font-medium">Copy Link</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
      </motion.button>

      <motion.button
        onClick={onClose}
        className="w-full p-4 rounded-xl bg-[#fa7517] text-black font-medium hover:bg-[#ff8c3a] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Done
      </motion.button>
    </motion.div>
  );
};

export default VideoUploadSuccess;