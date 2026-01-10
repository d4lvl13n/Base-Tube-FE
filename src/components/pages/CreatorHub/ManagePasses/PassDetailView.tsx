// src/components/pages/CreatorHub/ManagePasses/PassDetailView.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePassDetails, useAddVideoToPass } from '../../../../hooks/usePass';
import { Copy, ArrowLeft, Film, Plus, CheckSquare, Users, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import AddVideoDrawer from './AddVideoDrawer';

const PassDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { data: pass, isLoading, error } = usePassDetails(id);
  const addVideoMutation = useAddVideoToPass();
  
  const handleAddVideo = async (videos: { url: string, title?: string }[]) => {
    if (!id || videos.length === 0) return;
    
    try {
      // Process videos one by one
      for (const video of videos) {
        await addVideoMutation.mutateAsync({
          passId: id,
          data: { 
            src_url: video.url,
            ...(video.title ? { title: video.title } : {})
          }
        });
      }
      
      // Close drawer after all videos are added
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error adding videos:", error);
    }
  };
  
  const copyShareLink = () => {
    if (!pass) return;
    
    const shareUrl = `${window.location.origin}/p/${pass.slug || pass.id}`;
    navigator.clipboard.writeText(shareUrl);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-10"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-800 rounded-xl"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 h-96 rounded-xl"></div>
        </div>
      </div>
    );
  }
  
  if (error || !pass) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 mb-4">Failed to load pass details</p>
          <button 
            onClick={() => navigate('/creator-hub/passes')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Passes
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate total sold (minted + reserved for pending Stripe purchases)
  const totalSold = (pass.minted_count || 0) + (pass.reserved_count || 0);

  // Calculate remaining supply
  const remainingSupply = pass.supply_cap ?
    Math.max(0, pass.supply_cap - totalSold) :
    '∞'; // Infinity symbol for unlimited supply
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate('/creator-hub/passes')}
          className="mr-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{pass.title}</h1>
          <p className="text-gray-400">{pass.formatted_price} • {pass.tier} tier</p>
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Videos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <Film className="w-5 h-5 mr-2 text-orange-500" />
              Pass Videos
            </h2>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white font-medium inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Video
            </button>
          </div>
          
          {/* Videos grid */}
          {pass.videos && pass.videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pass.videos.map((video) => (
                <div 
                  key={video.id} 
                  className="bg-black border border-gray-800 rounded-lg overflow-hidden group hover:border-gray-700 transition-colors"
                >
                  <div className="relative aspect-video">
                    <img 
                      src={video.thumbnail_url} 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Film className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    {/* Display video title if available */}
                    {(video as any).title && (
                      <p className="font-medium text-sm truncate mb-1">
                        {(video as any).title}
                      </p>
                    )}
                    <div className="flex items-center text-xs">
                      <span className="px-2 py-1 bg-gray-800 rounded-full">{video.platform}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
              <Film className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No videos in this pass yet</p>
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white font-medium inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Video
              </button>
            </div>
          )}
        </div>
        
        {/* Right column - Pass details */}
        <div className="bg-black/30 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Pass Details</h2>
          
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
              <Users className="w-5 h-5 text-orange-500 mb-2" />
              <p className="text-sm text-gray-400">Purchases</p>
              <p className="text-xl font-bold">{totalSold}</p>
            </div>

            <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
              <DollarSign className="w-5 h-5 text-orange-500 mb-2" />
              <p className="text-sm text-gray-400">Revenue</p>
              <p className="text-xl font-bold">
                {(totalSold * pass.price_cents / 100).toFixed(2)}
              </p>
            </div>
          </div>
          
          {/* Supply information */}
          {pass.supply_cap && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Supply</span>
                <span className="text-gray-400">
                  {totalSold} / {pass.supply_cap} sold
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  style={{ width: `${Math.min(100, Math.round(totalSold / pass.supply_cap * 100))}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">
                {remainingSupply} passes remaining
              </p>
            </div>
          )}

          {/* Unlimited supply indicator */}
          {!pass.supply_cap && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Supply</span>
                <span className="text-gray-400">Unlimited</span>
              </div>
              <p className="text-sm text-gray-400">
                {totalSold} passes sold so far
              </p>
            </div>
          )}
          
          {/* Pass information */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Description</p>
              <p className="text-sm">{pass.description || "No description provided"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-1">Videos</p>
              <p className="text-sm">{pass.videos?.length || 0} videos in this pass</p>
            </div>
          </div>
          
          {/* Share section */}
          <div className="pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-3">Share Link</p>
            <div className="flex">
              <div className="flex-1 bg-black p-2 rounded-l-lg border border-gray-800 truncate text-sm text-gray-400">
                {`${window.location.origin}/p/${pass.slug || pass.id}`}
              </div>
              <button
                onClick={copyShareLink}
                className="p-2 bg-orange-600 hover:bg-orange-700 rounded-r-lg"
              >
                {copied ? <CheckSquare className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Use the new drawer component instead of the modal */}
      <AddVideoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleAddVideo}
        isLoading={addVideoMutation.status === 'pending'}
        passTitle={pass.title}
      />
    </div>
  );
};

export default PassDetailView;