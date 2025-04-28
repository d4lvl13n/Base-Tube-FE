import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Bot, Wand2, Upload, Image, Check, Video, Info, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { ThumbnailGenerationOptions, CustomThumbnailGenerationOptions, ThumbnailWithReferenceOptions } from '../../types/thumbnail';

interface AIThumbnailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  videoId?: number;
  videoTitle: string;
  videoDescription: string;
  onThumbnailGenerated: (thumbnailUrl: string) => void;
  isGeneratingForVideo: boolean;
  isGeneratingFromPrompt: boolean;
  isGeneratingWithReference: boolean;
  generateForVideo: (videoId: number, options?: ThumbnailGenerationOptions) => Promise<any>;
  generateFromPrompt: (options: CustomThumbnailGenerationOptions) => Promise<any>;
  generateWithReference: (options: ThumbnailWithReferenceOptions) => Promise<any>;
}

type GenerationTab = 'video' | 'custom';

// Interface for thumbnail item
interface ThumbnailItem {
  thumbnailUrl: string;
  thumbnailPath: string;
}

const AIThumbnailPanel: React.FC<AIThumbnailPanelProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  videoDescription,
  onThumbnailGenerated,
  isGeneratingForVideo,
  isGeneratingFromPrompt,
  isGeneratingWithReference,
  generateForVideo,
  generateFromPrompt,
  generateWithReference
}) => {
  // Tab management
  const [activeTab, setActiveTab] = useState<GenerationTab>('video');
  
  // Form states
  const [customPrompt, setCustomPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [style, setStyle] = useState('');
  const [background, setBackground] = useState<'transparent' | 'opaque' | 'auto'>('auto');
  const [referenceImageDetail, setReferenceImageDetail] = useState<'low' | 'high' | 'auto'>('high');
  
  // Error handling state
  const [error, setError] = useState<string | null>(null);
  
  // Regeneration counter
  const [regenerationCount, setRegenerationCount] = useState(0);
  const MAX_REGENERATIONS = 3;
  
  // Style presets based on content categories
  const stylePresets = [
    { 
      id: 'gaming', 
      label: 'Gaming', 
      prompt: 'Create a high-impact  thumbnail for a gaming video with dramatic lighting and vibrant colors. Feature a detailed 3D game character in dynamic action pose against a blurred game environment background. Add space for title text in the upper right. Use high contrast and focal depth to make the main subject pop. Render in photorealistic 3D style with lens flare effects.' 
    },
    { 
      id: 'tutorial', 
      label: 'Tutorial', 
      prompt: 'Design a professional tutorial thumbnail with a clean, organized composition. Use a soft gradient background in blue tones with subtle grid patterns. Show the main subject centered with supporting icons or elements arranged neatly. Include ample negative space for text overlay. Use soft, even lighting with minimal shadows and a modern, minimalist design style with clear iconography.'
    },
    { 
      id: 'vlog', 
      label: 'Vlog', 
      prompt: 'Create an authentic, eye-catching  vlog thumbnail. Feature a close-up perspective with warm, natural lighting and rich colors. Show genuine emotions with shallow depth of field to create intimacy. Use lifestyle photography aesthetics with slightly desaturated warm tones and film-like quality. Add subtle environmental elements that suggest the location or activity without distracting from the main subject.'
    },
    { 
      id: 'tech', 
      label: 'Tech Review', 
      prompt: 'Design a sleek, premium  tech review thumbnail. Show the product from a 3/4 angle against a minimal dark or gradient background with subtle tech patterns. Use dramatic product lighting with reflections on a glossy surface. Add geometric accent elements in contrasting neon colors. Employ professional product photography techniques with high detail, perfect focus, and subtle reflections to convey quality and innovation.'
    },
    { 
      id: 'cooking', 
      label: 'Cooking', 
      prompt: 'Create an appetizing cooking thumbnail with a hero shot of the finished dish. Use natural but enhanced lighting with strong depth of field to highlight texture and freshness. Incorporate vibrant, saturated food colors with steam or motion elements to suggest freshness. Style with professional food photography techniques including perfect garnishes, droplets of moisture, and complementary props like fresh ingredients or rustic tableware in soft focus.'
    }
  ];
  
  // Results state
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [lastPromptUsed, setLastPromptUsed] = useState<string>('');
  const [lastGenerationOptions, setLastGenerationOptions] = useState<any | null>(null);
  
  // Funny loading messages that rotate during generation
  const funnyLoadingMessages = [
    "Mixing special pixel paint...",
    "Convincing AI to be creative...",
    "Teaching robots about aesthetics...",
    "Calling all thumbnail artists...",
    "Brewing the perfect thumbnail potion...",
    "Consulting with design wizards...",
    "Polishing pixels to perfection...",
    "Dusting off the digital canvas...",
    "Negotiating with stubborn pixels...",
    "Harvesting clicks from the click farm...",
    "Calibrating the thumbnail-o-meter...",
    "Calculating perfect click-through ratios...",
    "Searching for the perfect color palette...",
    "Borrowing creativity from parallel universes...",
    "Adding secret sauce to your thumbnails...",
    "Loading inspiration.exe...",
    "Assembling the pixel dream team...",
    "Finding that perfect thumbnail angle...",
    "Turning caffeine into thumbnails...",
    "Waiting for the AI to finish its coffee break...",
    "Sharpening digital crayons...",
    "Unleashing the thumbnail unicorns...",
    "Warming up the color spectrum...",
    "Taming wild gradients...",
    "Consulting the thumbnail oracle...",
    "Rolling out the red carpet for your video...",
    "Summoning the pixel fairies...",
    "Running with scissors (safely)...",
    "Counting all the pixels (twice)...",
    "Making sure the thumbnail sparkles...",
    "Feeding the AI some fresh memes...",
    "Checking the thumbnail weather forecast...",
    "Spinning up the creativity turbines...",
    "Giving the AI a pep talk...",
    "Testing the thumbnail for maximum clickiness...",
    "Painting happy little clouds...",
    "Letting Bob Ross review your thumbnail...",
    "Making sure the thumbnail is cat-approved...",
    "Adding a dash of magic dust...",
    "Consulting the YouTube algorithm spirits...",
    "Making sure the thumbnail is dog-friendly...",
    "Polishing the shine on your play button...",
    "Running a thumbnail marathon...",
    "Making sure the thumbnail is gluten-free...",
    "Checking for hidden easter eggs...",
    "Giving the thumbnail a motivational speech...",
    "Letting the AI stretch its creative muscles...",
    "Making sure the thumbnail is selfie-ready...",
    "Triple-checking the awesomeness factor..."
  ];
  
  // Current loading message state
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  // Effect to rotate through loading messages every 3 seconds during generation
  useEffect(() => {
    if (isGeneratingForVideo || isGeneratingFromPrompt || isGeneratingWithReference) {
      setCurrentLoadingMessage(funnyLoadingMessages[Math.floor(Math.random() * funnyLoadingMessages.length)]);
      
      const interval = setInterval(() => {
        // Get a new random message, but make sure it's different from the current one
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * funnyLoadingMessages.length);
        } while (newIndex === loadingMessageIndex && funnyLoadingMessages.length > 1);
        
        setLoadingMessageIndex(newIndex);
        setCurrentLoadingMessage(funnyLoadingMessages[newIndex]);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isGeneratingForVideo, isGeneratingFromPrompt, isGeneratingWithReference, loadingMessageIndex]);
  
  // Handle reference image upload
  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setReferenceImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setReferenceImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle style preset selection
  const handleStylePresetClick = (preset: typeof stylePresets[0]) => {
    setCustomPrompt(preset.prompt);
    setStyle(preset.id);
  };
  
  // Handle regenerating thumbnails
  const handleRegenerateThumbnail = async () => {
    if (regenerationCount >= MAX_REGENERATIONS) {
      setError(`You've reached the maximum number of regenerations (${MAX_REGENERATIONS}). Try changing your prompt or settings.`);
      return;
    }
    
    if (!lastGenerationOptions) {
      setError('No previous generation found to regenerate from.');
      return;
    }
    
    setIsRegenerating(true);
    await handleGenerateThumbnail(true);
  };
  
  // Handle thumbnail generation based on active tab
  const handleGenerateThumbnail = async (isRegeneration = false) => {
    setError(null);
    
    try {
      let result;
      let options;
      
      if (activeTab === 'video') {
        if (!videoId) {
          // If no videoId yet (new upload), use prompt method with video title/description
          const generatedPrompt = `Create a thumbnail for video titled "${videoTitle}" with description "${videoDescription.substring(0, 100)}..."`;
          setLastPromptUsed(generatedPrompt);
          
          options = {
            prompt: generatedPrompt,
            style,
            background
          };
          
          result = await generateFromPrompt(options);
        } else {
          // Use video-specific endpoint if we have a videoId
          options = {
            style,
            background
          };
          
          result = await generateForVideo(videoId, options);
          setLastPromptUsed('Generated from video context');
        }
      } else if (activeTab === 'custom') {
        if (referenceImage) {
          // If we have a reference image, use the reference endpoint
          setLastPromptUsed(customPrompt || 'Generated from reference image');
          
          options = {
            referenceImage,
            videoId,
            customPrompt,
            style,
            background,
            referenceImageDetail
          };
          
          result = await generateWithReference(options);
        } else if (customPrompt) {
          // Otherwise, use the prompt endpoint
          setLastPromptUsed(customPrompt);
          
          options = {
            prompt: customPrompt,
            style,
            background
          };
          
          result = await generateFromPrompt(options);
        } else {
          setError('Please enter a prompt or upload a reference image');
          return;
        }
      }
      
      // Save the options for regeneration
      if (!isRegeneration) {
        setLastGenerationOptions(options);
        setRegenerationCount(0);
      } else {
        setRegenerationCount(prev => prev + 1);
      }
      
      // Handle the new API response format (multiple thumbnails)
      if (result?.data) {
        if (result.data.thumbnails) {
          // New format: multiple thumbnails
          const newThumbnails = result.data.thumbnails.map((item: ThumbnailItem) => item.thumbnailUrl);
          
          setGeneratedThumbnails(prev => [...newThumbnails, ...prev]);
          if (newThumbnails.length > 0) {
            setSelectedThumbnail(newThumbnails[0]);
          }
        } else if (result.data.thumbnailUrl) {
          // Backward compatibility: single thumbnail
          setGeneratedThumbnails(prev => [result.data.thumbnailUrl, ...prev]);
          setSelectedThumbnail(result.data.thumbnailUrl);
        }
      }
    } catch (error: any) {
      console.error('Error generating thumbnail:', error);
      setError(error.response?.data?.message || 
               error.message || 
              'Failed to generate thumbnail. Please try again.');
    } finally {
      if (isRegeneration) {
        setIsRegenerating(false);
      }
    }
  };
  
  // Handle applying the selected thumbnail
  const handleApplyThumbnail = () => {
    if (selectedThumbnail) {
      onThumbnailGenerated(selectedThumbnail);
      onClose();
    }
  };
  
  // Reset the panel state
  const resetPanel = () => {
    setCustomPrompt('');
    setReferenceImage(null);
    setReferenceImagePreview(null);
    setGeneratedThumbnails([]);
    setSelectedThumbnail(null);
    setLastPromptUsed('');
    setActiveTab('video');
    setError(null);
  };
  
  // Background transparency selector component
  const BackgroundSelector = () => (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="text-sm text-gray-400">Background</label>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-500 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 rounded-lg shadow-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <p><b>Transparent:</b> Creates a PNG with transparency, ideal for overlaying on different backgrounds.</p>
            <p className="mt-1"><b>Opaque:</b> Creates a PNG with a solid background determined by the content.</p>
            <p className="mt-1"><b>Auto:</b> Lets the AI model decide based on the content and style.</p>
          </div>
        </div>
      </div>
      <select 
        value={background}
        onChange={(e) => setBackground(e.target.value as 'transparent' | 'opaque' | 'auto')}
        className="w-full p-3 bg-gray-900/80 border border-gray-800/30 rounded-lg text-white focus:border-[#fa7517]/50 focus:ring-[#fa7517]/20 focus:ring-2 outline-none"
      >
        <option value="auto">Auto (AI Decides)</option>
        <option value="transparent">Transparent Background</option>
        <option value="opaque">Opaque Background</option>
      </select>
    </div>
  );
  
  // Determine if generation is in progress
  const isGenerating = isGeneratingForVideo || isGeneratingFromPrompt || isGeneratingWithReference;
  
  // New state for regenerating
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed right-0 top-0 bottom-0 h-screen w-[1000px] bg-black/90 z-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Border */}
            <div className="absolute left-0 inset-y-0 w-[2px] h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/30 via-[#fa7517]/10 to-[#fa7517]/30" />
            </div>

            {/* Content */}
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-800/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-tr from-[#fa7517] to-[#ff8c3a] p-2 rounded-lg shadow-lg">
                      <Zap className="w-5 h-5 text-black" />
                    </div>
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-400 text-transparent bg-clip-text">AI Thumbnail Studio</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onClose();
                      resetPanel();
                    }}
                    className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </motion.button>
                </div>
                <p className="text-gray-400">Create stunning thumbnails that drive higher click-through rates</p>
              </div>

              {/* Tabs - Improved with better indicators */}
              <div className="flex border-b border-gray-800/30 bg-black/30">
                {[
                  { id: 'video', label: 'From Video', icon: Video },
                  { id: 'custom', label: 'Custom Creator', icon: Sparkles }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as GenerationTab)}
                    className={`
                      relative flex-1 py-4 px-6 flex items-center justify-center gap-2 font-medium transition-all
                      ${activeTab === tab.id 
                        ? 'text-white' 
                        : 'text-gray-500 hover:text-gray-300'}
                    `}
                  >
                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#fa7517]' : ''}`} />
                    <span>{tab.label}</span>
                    
                    {/* Active tab indicator */}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a]"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Main Content - Scrollable Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Error display */}
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Error</p>
                        <p className="text-gray-300 text-sm mt-1">{error}</p>
                      </div>
                      <button 
                        onClick={() => setError(null)}
                        className="ml-auto p-1 hover:bg-black/20 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </motion.div>
                  )}
                  
                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-gray-900/20 rounded-xl p-6 border border-gray-800/30 shadow-inner"
                    >
                      {/* Video Context Tab */}
                      {activeTab === 'video' && (
                        <div className="space-y-6">
                          <div className="bg-[#fa7517]/10 rounded-lg p-4 border border-[#fa7517]/30 flex gap-3">
                            <Video className="w-5 h-5 text-[#fa7517] flex-shrink-0 mt-1" />
                            <div>
                              <p className="text-white">
                                Generate 3 thumbnails based on your video title and description.
                                {!videoId && " Since your video isn't uploaded yet, we'll use text-based generation."}
                              </p>
                              <p className="text-gray-400 text-sm mt-1">All thumbnails are generated at 1280×720 resolution in high quality.</p>
                            </div>
                          </div>
                          
                          {/* Background Selector */}
                          <BackgroundSelector />
                          
                          {/* Thumbnail Information */}
                          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                            <div className="flex items-center gap-2">
                              <Info className="w-5 h-5 text-gray-400" />
                              <p className="text-gray-300 text-sm">All thumbnails are generated at 1280×720 resolution in high quality PNG format with optional transparency.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Custom Creator Tab (Merged Prompt + Reference) */}
                      {activeTab === 'custom' && (
                        <div className="space-y-6">
                          {/* Info Banner */}
                          <div className="bg-[#fa7517]/10 rounded-lg p-4 border border-[#fa7517]/30 flex gap-3">
                            <Sparkles className="w-5 h-5 text-[#fa7517] flex-shrink-0 mt-1" />
                            <div>
                              <p className="text-white">
                                Create 3 custom thumbnails with your own prompt, reference image, or both combined for best results.
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                Upload an image for styling reference and/or use a detailed prompt to guide the AI.
                              </p>
                            </div>
                          </div>
                          
                          {/* Reference Image Upload */}
                          <div>
                            <label className="text-sm text-gray-400 mb-1 block">Reference Image (Optional)</label>
                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-[#fa7517]/50 transition-colors">
                              {referenceImagePreview ? (
                                <div className="relative">
                                  <img 
                                    src={referenceImagePreview} 
                                    alt="Reference" 
                                    className="mx-auto max-h-48 rounded shadow-md"
                                  />
                                  <button
                                    onClick={() => {
                                      setReferenceImage(null);
                                      setReferenceImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 shadow-lg hover:bg-black/90 transition-colors"
                                  >
                                    <X className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-75" />
                                  <p className="text-gray-400 mb-2">
                                    Drag & drop an image or{" "}
                                    <button
                                      onClick={() => document.getElementById('reference-image-input')?.click()}
                                      className="text-[#fa7517] hover:text-[#ff8c3a] font-medium"
                                    >
                                      browse
                                    </button>
                                  </p>
                                  <p className="text-gray-600 text-xs">
                                    Use an image that has the style or composition you want
                                  </p>
                                  <input
                                    id="reference-image-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleReferenceImageChange}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Prompt Input */}
                          <div>
                            <label className="text-sm text-gray-400 mb-1 block">{referenceImage ? 'Additional Instructions' : 'Custom Prompt'} {!referenceImage && '(Required)'}</label>
                            <textarea
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              placeholder={referenceImage ? "Add instructions to guide the AI..." : "Describe the thumbnail you want to generate..."}
                              rows={3}
                              className="w-full p-3 bg-gray-900/80 border border-gray-800/30 rounded-lg text-white resize-none focus:border-[#fa7517]/50 focus:ring-[#fa7517]/20 focus:ring-2 outline-none"
                            />
                          </div>
                          
                          {/* Style Presets */}
                          <div>
                            <label className="text-sm text-gray-400 mb-2 block">Style Presets</label>
                            <div className="grid grid-cols-2 gap-3">
                              {stylePresets.map(preset => (
                                <button
                                  key={preset.id}
                                  onClick={() => handleStylePresetClick(preset)}
                                  className="p-4 bg-gray-900/50 border border-gray-800/30 hover:border-[#fa7517]/50 rounded-lg text-white text-sm transition-all hover:bg-gray-900/80 hover:shadow-md text-left"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{preset.label}</span>
                                    <span className={`w-2 h-2 rounded-full ${
                                      preset.id === 'gaming' ? 'bg-red-500' :
                                      preset.id === 'tutorial' ? 'bg-blue-500' :
                                      preset.id === 'vlog' ? 'bg-green-500' :
                                      preset.id === 'tech' ? 'bg-purple-500' :
                                      'bg-yellow-500'
                                    }`}></span>
                                  </div>
                                  <span className="text-xs text-gray-400 line-clamp-2">{preset.prompt.substring(0, 60)}...</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Settings Group */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Background Selector */}
                            <BackgroundSelector />
                            
                            {/* Reference Image Detail (only shown when reference image present) */}
                            {referenceImage && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <label className="text-sm text-gray-400">Reference Detail Level</label>
                                  <div className="group relative">
                                    <Info className="w-4 h-4 text-gray-500 cursor-help" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 rounded-lg shadow-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      <p><b>Low:</b> Processes the reference image at lower resolution. Good for simple stylistic references.</p>
                                      <p className="mt-1"><b>High:</b> Higher resolution for better detail. Recommended for complex reference images.</p>
                                      <p className="mt-1"><b>Auto:</b> Lets the AI model decide the appropriate detail level.</p>
                                    </div>
                                  </div>
                                </div>
                                <select 
                                  id="reference-image-detail-select"
                                  value={referenceImageDetail}
                                  onChange={(e) => setReferenceImageDetail(e.target.value as 'low' | 'high' | 'auto')}
                                  className="w-full p-3 bg-gray-900/80 border border-gray-800/30 rounded-lg text-white focus:border-[#fa7517]/50 focus:ring-[#fa7517]/20 focus:ring-2 outline-none"
                                >
                                  <option value="low">Low (Faster)</option>
                                  <option value="high">High (Better Quality)</option>
                                  <option value="auto">Auto (AI Decides)</option>
                                </select>
                              </div>
                            )}
                          </div>
                          
                          {/* Thumbnail Information */}
                          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                            <div className="flex items-center gap-2">
                              <Info className="w-5 h-5 text-gray-400" />
                              <p className="text-gray-300 text-sm">All thumbnails are generated at 1280×720 resolution in high quality PNG format with optional transparency.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Generated Thumbnails */}
                  {generatedThumbnails.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white">Generated Thumbnails</h3>
                        <div className="flex items-center gap-2">
                          {regenerationCount > 0 && (
                            <span className="text-xs text-gray-400 bg-gray-800/80 px-2 py-1 rounded-full">
                              Regeneration {regenerationCount}/{MAX_REGENERATIONS}
                            </span>
                          )}
                          <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                            {lastPromptUsed.length > 30 ? lastPromptUsed.substring(0, 30) + '...' : lastPromptUsed}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {generatedThumbnails.map((thumbnail, index) => (
                          <motion.div 
                            key={index}
                            whileHover={{ y: -5, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            className={`
                              relative rounded-lg overflow-hidden border-2 cursor-pointer shadow-md
                              ${selectedThumbnail === thumbnail 
                                ? 'border-[#fa7517] shadow-[#fa7517]/30' 
                                : 'border-transparent hover:border-gray-700'}
                            `}
                            onClick={() => setSelectedThumbnail(thumbnail)}
                          >
                            <img 
                              src={thumbnail} 
                              alt={`Generated thumbnail ${index + 1}`} 
                              className="w-full aspect-video object-cover"
                            />
                            
                            {/* Batch indicator for recent generation */}
                            {index < 3 && (
                              <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                                Set {Math.floor(index / 3) + 1}
                              </div>
                            )}
                            
                            {/* Selected indicator */}
                            {selectedThumbnail === thumbnail && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute top-2 right-2 bg-[#fa7517] rounded-full p-1.5 shadow-lg"
                              >
                                <Check className="w-4 h-4 text-black" />
                              </motion.div>
                            )}
                            
                            {/* View in new window button */}
                            <motion.button
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent selection of the thumbnail
                                window.open(thumbnail, '_blank');
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                              </svg>
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>

                      {/* Regenerate Option */}
                      <motion.button
                        whileHover={isRegenerating ? {} : { y: -2 }}
                        whileTap={isRegenerating ? {} : { scale: 0.98 }}
                        onClick={handleRegenerateThumbnail}
                        disabled={isGenerating}
                        className={`
                          mt-4 mx-auto flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300
                          relative overflow-hidden
                          border border-gray-700 hover:border-[#fa7517]/50 transition-colors
                          ${isGenerating ? 'opacity-50 cursor-not-allowed bg-gradient-to-r from-gray-800 to-gray-700' : 'hover:bg-black/40'}
                        `}
                      >
                        {isRegenerating && isGenerating ? (
                          <>
                            {/* Progress bar */}
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 60, ease: "linear" }}
                              className="absolute left-0 bottom-0 h-1 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a]"
                            />
                            {/* Spinner */}
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 mr-2 text-white"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12C22 14.6522 20.9464 17.1957 19.0711 19.0711C17.1957 20.9464 14.6522 22 12 22C10.6868 22 9.38642 21.7413 8.17317 21.2388C6.95991 20.7362 5.85752 19.9997 4.92893 19.0711C3.05357 17.1957 2 14.6522 2 12C2 9.34784 3.05357 6.8043 4.92893 4.92893C6.8043 3.05357 9.34784 2 12 2Z" 
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60 30" />
                              </svg>
                            </motion.div>
                            <div className="flex flex-col items-center">
                              <span className="font-medium">Regenerating Thumbnails...</span>
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={currentLoadingMessage}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.3 }}
                                  className="text-xs text-gray-300 mt-1"
                                >
                                  {currentLoadingMessage}
                                </motion.span>
                              </AnimatePresence>
                            </div>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 text-[#fa7517]" />
                            <span>Regenerate thumbnails {regenerationCount > 0 ? `(${regenerationCount}/${MAX_REGENERATIONS})` : ''}</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with Generate Button */}
              <div className="p-6 border-t border-gray-800/30 bg-black/40">
                {selectedThumbnail ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApplyThumbnail}
                    className="w-full px-6 py-4 rounded-xl font-semibold
                      bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] hover:shadow-[#fa7517]/50
                      flex items-center justify-center space-x-3 shadow-lg"
                  >
                    <Check className="w-6 h-6" />
                    <span>Apply Selected Thumbnail</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={isGenerating ? {} : { scale: 1.02 }}
                    whileTap={isGenerating ? {} : { scale: 0.98 }}
                    onClick={() => handleGenerateThumbnail(false)}
                    disabled={isGenerating}
                    className={`w-full px-6 py-4 rounded-xl font-semibold
                      relative overflow-hidden
                      flex items-center justify-center space-x-3 shadow-lg
                      ${isGenerating 
                        ? 'bg-gradient-to-r from-gray-800 to-gray-700 cursor-wait' 
                        : 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] hover:shadow-[#fa7517]/30'
                      }`}
                  >
                    {isGenerating ? (
                      <>
                        {/* Loading progress bar animation */}
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 60, ease: "linear" }} // 60 seconds animation
                          className="absolute left-0 bottom-0 h-1 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a]"
                        />
                        
                        {/* Spinner animation */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 mr-2 text-white"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12C22 14.6522 20.9464 17.1957 19.0711 19.0711C17.1957 20.9464 14.6522 22 12 22C10.6868 22 9.38642 21.7413 8.17317 21.2388C6.95991 20.7362 5.85752 19.9997 4.92893 19.0711C3.05357 17.1957 2 14.6522 2 12C2 9.34784 3.05357 6.8043 4.92893 4.92893C6.8043 3.05357 9.34784 2 12 2Z" 
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60 30" />
                          </svg>
                        </motion.div>
                        
                        {/* Animated loading text */}
                        <div className="flex flex-col items-center">
                          <span className="font-medium">Generating Thumbnails...</span>
                          
                          {/* Funny loading message with animation */}
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={currentLoadingMessage}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="text-xs text-gray-300 mt-1"
                            >
                              {currentLoadingMessage}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-6 h-6" />
                        <span>Generate Thumbnails</span>
                        <Sparkles className="w-6 h-6" />
                      </>
                    )}
                  </motion.button>
                )}
                
                {/* Generation time estimate */}
                {isGenerating && (
                  <p className="text-gray-400 text-xs text-center mt-3">
                    Generation takes approximately 60 seconds. Please wait while we create your thumbnails.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIThumbnailPanel; 