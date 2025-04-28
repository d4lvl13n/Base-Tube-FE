import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Code, Calendar, Users, Image, Zap, Lock, Copy, ExternalLink } from 'lucide-react';
import { ThumbnailItem } from '../../types/thumbnail';
import { formatNumber } from '../../utils/format';
import { useAIThumbnailGallery } from '../../hooks/useAIthumbnail';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ThumbnailDetailDrawerProps {
  thumbnailId: number;
  isOpen: boolean;
  onClose: () => void;
  fetchThumbnailById: (id: number) => Promise<ThumbnailItem>;
  onDownloadSuccess?: () => void;
}

export const ThumbnailDetailDrawer: React.FC<ThumbnailDetailDrawerProps> = ({
  thumbnailId,
  isOpen,
  onClose,
  fetchThumbnailById,
  onDownloadSuccess
}) => {
  // State
  const [thumbnail, setThumbnail] = useState<ThumbnailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  // Use thumbnail gallery functionality for download
  const { downloadThumbnail } = useAIThumbnailGallery();
  
  // Fetch thumbnail details
  useEffect(() => {
    if (isOpen && thumbnailId) {
      setIsLoading(true);
      setError(null);
      
      fetchThumbnailById(thumbnailId)
        .then(data => {
          setThumbnail(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching thumbnail details:', err);
          setError('Failed to load thumbnail details');
          setIsLoading(false);
        });
    }
  }, [thumbnailId, isOpen, fetchThumbnailById]);
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };
  
  // Download thumbnail
  const handleDownload = async () => {
    if (!thumbnail) return;
    
    setDownloadStatus('downloading');
    
    try {
      // Use the direct download method with blob
      const blob = await downloadThumbnail(thumbnail.id, 'blob') as Blob;
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail-${thumbnail.id}.webp`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloadStatus('downloaded');
      
      // Reset status after a while
      setTimeout(() => setDownloadStatus('idle'), 2000);
      
      // Notify parent of successful download
      if (onDownloadSuccess) {
        onDownloadSuccess();
      }
    } catch (err) {
      console.error('Error downloading thumbnail:', err);
      setError('Failed to download thumbnail. Please try again.');
      setDownloadStatus('idle');
      
      // Reset error after a while
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Copy prompt to clipboard
  const copyPrompt = () => {
    if (thumbnail?.prompt) {
      navigator.clipboard.writeText(thumbnail.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };
  
  // Prevent right-click on image
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with enhanced blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-40"
            onClick={onClose}
          />
          
          {/* Drawer with premium styling */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 300,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[85%] lg:w-[80%] bg-black/95 shadow-2xl z-50 overflow-hidden"
            style={{
              boxShadow: `
                -10px 0 30px rgba(0, 0, 0, 0.3),
                0 0 50px rgba(250, 117, 23, 0.15)
              `
            }}
          >
            {/* Gradient Border */}
            <div className="absolute left-0 inset-y-0 w-[3px] h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517] via-[#fa7517]/30 to-[#fa7517]" />
            </div>
            
            {/* Background Gradients */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-[#fa7517]/10 to-transparent opacity-30" />
              <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-[#fa7517]/10 to-transparent opacity-20" />
            </div>
            
            {/* Close Button - Moved to top-right */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(250, 117, 23, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-900/90 text-gray-400 hover:text-white transition-colors z-10 border border-gray-800/50"
            >
              <X className="w-5 h-5" />
            </motion.button>
            
            {isLoading ? (
              // Enhanced Loading State
              <div className="h-full flex flex-col items-center justify-center p-8">
                <motion.div
                  className="relative w-20 h-20"
                >
                  {/* Outer ring */}
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      boxShadow: ['0 0 20px rgba(250, 117, 23, 0.5)', '0 0 10px rgba(250, 117, 23, 0.2)', '0 0 20px rgba(250, 117, 23, 0.5)']
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#fa7517] border-l-[#fa7517]/50"
                  />
                  
                  {/* Inner ring */}
                  <motion.div
                    animate={{ rotate: -180 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-2 border-transparent border-t-[#fa7517]/70 border-r-[#fa7517]/30"
                  />
                  
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image className="w-8 h-8 text-[#fa7517]" />
                  </div>
                </motion.div>
                <p className="text-gray-400 mt-8 font-medium">Loading thumbnail details...</p>
                <div className="mt-3 w-48 h-1 bg-gray-800/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#fa7517]/30 via-[#fa7517] to-[#fa7517]/30"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
            ) : error ? (
              // Error State
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="mb-6 p-6 rounded-full bg-red-500/10"
                >
                  <X className="w-16 h-16 text-red-500" />
                </motion.div>
                <p className="text-gray-200 text-xl font-medium mb-3">Error Loading Thumbnail</p>
                <p className="text-gray-400 max-w-md">{error}</p>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(250, 117, 23, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-8 px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg flex items-center space-x-2 border border-gray-700/50"
                >
                  <span>Return to Gallery</span>
                </motion.button>
              </div>
            ) : thumbnail ? (
              // Thumbnail Details - Premium Layout
              <div className="flex flex-col h-full">
                {/* Header Section with minimal info - removed download button */}
                <div className="p-6 lg:p-8 border-b border-gray-800/30 backdrop-blur-sm bg-black/30">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-tr from-[#fa7517] to-[#ff8c3a] p-3 rounded-xl shadow-lg">
                      <Zap className="w-5 h-5 text-black" />
                    </div>
                    <div className="ml-3">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 text-transparent bg-clip-text">
                        AI-Generated Thumbnail
                      </h2>
                      <div className="text-gray-400 flex items-center space-x-2 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Generated on {formatDate(thumbnail.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main Content - Side-by-side without scroll */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 h-full">
                  {/* Left Side - Image - More sleek design */}
                  <div className="p-6 lg:p-8 flex flex-col justify-center">
                    {/* Image Preview - Enhanced & more sleek */}
                    <div className="relative bg-black/60 rounded-xl overflow-hidden border border-gray-800/50 shadow-2xl h-full max-h-[calc(100vh-180px)] flex items-center justify-center">
                      {/* Blur background for visual appeal */}
                      <div className="absolute inset-0" 
                        style={{ 
                          backgroundImage: `url(${thumbnail.thumbnailUrl})`, 
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: 'blur(30px)',
                          opacity: 0.15,
                          transform: 'scale(1.2)'
                        }}
                      />
                      
                      {/* Sleek glow effects */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#fa7517]/5 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-l from-[#fa7517]/5 to-transparent"></div>
                      
                      {/* Download tag overlay */}
                      <button
                        onClick={handleDownload}
                        disabled={downloadStatus === 'downloading'}
                        className="absolute top-3 right-3 z-20 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg hover:from-[#ff8c3a] hover:to-[#fa7517] transition-colors disabled:opacity-60"
                        title="Download thumbnail"
                      >
                        {downloadStatus === 'downloading' ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Download className="w-4 h-4" />
                          </motion.div>
                        ) : downloadStatus === 'downloaded' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="font-medium text-sm">Download</span>
                      </button>
                      
                      {/* Actual image */}
                      <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
                        <img
                          src={thumbnail.thumbnailUrl}
                          alt={`AI Generated Thumbnail`}
                          className="max-w-full max-h-full object-contain shadow-lg"
                          onContextMenu={handleContextMenu}
                          draggable="false"
                        />
                      </div>
                      
                      {/* Protection overlay */}
                      <div className="absolute inset-0 group">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
                          <div className="p-3 rounded-full bg-black/60 border border-white/20">
                            <Lock className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Usage Badge - Enhanced */}
                      {thumbnail.is_used && (
                        <div className="absolute top-3 left-3 px-4 py-1.5 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black rounded-full text-sm font-medium shadow-lg">
                          Used in Video
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Side - Reorganized Details */}
                  <div className="p-6 lg:p-8 lg:border-l border-gray-800/30 flex flex-col h-full overflow-y-auto">
                    {/* Title & Image ID badge */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <div className="p-1.5 bg-[#fa7517]/20 rounded-lg">
                          <Code className="w-4 h-4 text-[#fa7517]" />
                        </div>
                        AI Prompt
                      </h3>
                      <div className="px-3 py-1 bg-gray-800/70 rounded-lg text-gray-400 font-mono text-sm">
                        ID: #{thumbnail.id}
                      </div>
                    </div>
                    
                    {/* Prompt Section with Copy Button - Smaller and with icon inline */}
                    <div className="relative mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Prompt</span>
                        <motion.button
                          onClick={copyPrompt}
                          whileHover={{ scale: 1.05, backgroundColor: copiedPrompt ? 'rgba(34, 197, 94, 0.2)' : 'rgba(250, 117, 23, 0.2)' }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-1.5 rounded-md ${copiedPrompt ? 'bg-green-500/20 text-green-500' : 'bg-gray-800/80 text-gray-400 hover:text-white'} 
                            transition-colors border border-gray-700/50 flex items-center space-x-1`}
                        >
                          {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-xs">{copiedPrompt ? 'Copied' : 'Copy'}</span>
                        </motion.button>
                      </div>
                      
                      <motion.div 
                        className="p-4 bg-gradient-to-br from-gray-900/90 to-black rounded-xl text-gray-300 
                          whitespace-pre-wrap leading-relaxed border border-gray-800/40 max-h-[180px] overflow-y-auto"
                        whileHover={{ boxShadow: '0 0 20px rgba(250, 117, 23, 0.1)' }}
                      >
                        {thumbnail.prompt}
                      </motion.div>
                    </div>
                    
                    {/* Image Stats + Downloads - Grid layout (4 cards, no download button) */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800/30 backdrop-blur-sm">
                        <div className="text-xs text-gray-500 mb-1">Size</div>
                        <div className="text-white font-medium text-sm">{thumbnail.size}</div>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800/30 backdrop-blur-sm">
                        <div className="text-xs text-gray-500 mb-1">Quality</div>
                        <div className="text-white font-medium text-sm">{thumbnail.quality}</div>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800/30 backdrop-blur-sm">
                        <div className="text-xs text-gray-500 mb-1">Model</div>
                        <div className="text-white font-medium text-sm">{thumbnail.model}</div>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800/30 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1 text-[#fa7517] mb-1">
                          <Download className="w-4 h-4" />
                          <span className="text-xs text-gray-500">Downloads</span>
                        </div>
                        <div className="text-white font-medium text-sm">{formatNumber(thumbnail.download_count)}</div>
                      </div>
                    </div>
                    
                    {/* Creator Info Card - Enhanced with link */}
                    <div className="mb-4">
                      <Link 
                        to={thumbnail.channelHandle ? `/channel/${thumbnail.channelHandle}` : '#'} 
                        className={`flex items-center space-x-4 p-4 bg-[#fa7517]/10 rounded-xl border border-[#fa7517]/20
                          hover:bg-[#fa7517]/20 transition-all duration-300 group relative overflow-hidden
                          ${thumbnail.channelHandle ? '' : 'pointer-events-none opacity-80'}`}
                        onClick={(e) => !thumbnail.channelHandle && e.preventDefault()}
                      >
                        {/* Background glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#fa7517]/0 via-[#fa7517]/10 to-[#fa7517]/0 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="p-3 bg-[#fa7517]/20 rounded-full group-hover:bg-[#fa7517]/30 transition-colors">
                          <Users className="w-5 h-5 text-[#fa7517]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-[#fa7517]">Created by</div>
                          <div className="text-white font-medium flex items-center">
                            {thumbnail.username ? thumbnail.username : 'Anonymous'}
                            {thumbnail.username && (
                              <ExternalLink className="w-3.5 h-3.5 ml-2 text-[#fa7517] opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // No thumbnail state
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-6 opacity-30"
                >
                  <Image className="w-16 h-16 text-gray-500" />
                </motion.div>
                <p className="text-gray-400 text-xl">No thumbnail information available</p>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-8 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  Return to Gallery
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 