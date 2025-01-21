import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { createChannel, checkHandleAvailability } from '../../api/channel';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import StepIndicator from '../common/StepIndicator';
import {
  Hexagon,
  ArrowRight,
  ArrowLeft,
  Facebook,
  Instagram,
  Twitter,
  User,
  FileText,
  Share2, 
  Image,
  HelpCircle,
  Sparkles,
  Bot,
  Wand2,
  X,
} from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/ConfirmationModal';
import { handleValidation, isValidHandle } from '../../types/channel';
import { stripHandleSuffix } from '../../utils/handleUtils';
import { useChannelAI } from '../../hooks/useChannelAI';
import RichTextEditor from '../common/RichTextEditor';
import AIAssistantPanel from '../common/AIAssistantPanel';

interface FormData {
  name: string;
  handle: string;
  description: string;
  channel_image: File | null;
  facebook_link: string;
  instagram_link: string;
  twitter_link: string;
}

const CreateChannelPage: React.FC = () => {
  const { session } = useCurrentUser();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [channelImagePreview, setChannelImagePreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [shouldFetchSuggestions, setShouldFetchSuggestions] = useState(false);
  const [showHandleHelpModal, setShowHandleHelpModal] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [showDescriptionHelpModal, setShowDescriptionHelpModal] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedHandle, setSuggestedHandle] = useState<string | undefined>();
  
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      channel_image: null,
      handle: '',
    },
  });
  const navigate = useNavigate();

  const totalSteps = 4;

  const watchedName = watch('name');
  const watchedHandle = watch('handle');

  const {
    isGeneratingHandle,
    suggestions: aiHandleSuggestions,
    generateHandleSuggestions,
    generateChannelDescription,
    clearSuggestions,
  } = useChannelAI();

  // Handle generation and validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchedName && watchedName.trim().length > 0 && !watchedHandle) {
        // Only generate handle if there isn't one already
        const suggestedHandle = watchedName
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .replace(/^_+|_+$/g, '')
          .substring(0, 29);

        setValue('handle', suggestedHandle, { shouldValidate: true });
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [watchedName, setValue, watchedHandle]);

  // Handle validation and availability check
  useEffect(() => {
    const validateHandle = async (handle: string) => {
      setIsCheckingHandle(true);
      setHandleError(null);

      const strippedHandle = stripHandleSuffix(handle);
      
      if (handleValidation.reservedHandles.includes(strippedHandle.toLowerCase())) {
        setHandleError('This handle is reserved. Please choose another one.');
        setHandleAvailable(false);
        setShouldFetchSuggestions(true);
        setIsCheckingHandle(false);
        return;
      }

      if (!isValidHandle(strippedHandle)) {
        setHandleError('Handle can only contain letters, numbers, and underscores.');
        setHandleAvailable(false);
        setIsCheckingHandle(false);
        return;
      }

      try {
        const handleCheck = await checkHandleAvailability(strippedHandle);
        setHandleAvailable(handleCheck.isAvailable);

        if (!handleCheck.isAvailable) {
          setHandleError('This handle is already taken.');
          setShouldFetchSuggestions(true);
        } else {
          clearSuggestions();
          setShouldFetchSuggestions(false);
        }
      } catch (error) {
        console.error('Handle validation failed:', error);
        setHandleError('Unable to verify handle availability.');
      } finally {
        setIsCheckingHandle(false);
      }
    };

    const timer = setTimeout(() => {
      if (watchedHandle?.trim()) {
        validateHandle(watchedHandle);
      } else {
        setHandleAvailable(null);
        clearSuggestions();
        setHandleError(null);
        setShouldFetchSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedHandle, clearSuggestions]);

  // Add this effect to handle suggestions separately
  useEffect(() => {
    if (shouldFetchSuggestions && watchedName) {
      const fetchSuggestions = async () => {
        await generateHandleSuggestions(watchedName, {
          description: watch('description')
        });
        setShouldFetchSuggestions(false);
      };
      fetchSuggestions();
    }
  }, [shouldFetchSuggestions, watchedName, generateHandleSuggestions, watch]);

  // Helper to check if we're on the final step
  const isLastStep = step === totalSteps;

  // Validate required fields for each step
  const canProceedFromStep = () => {
    switch (step) {
      case 1:
        // Name and handle are required
        return watchedName?.trim() && watchedHandle?.trim() && handleAvailable === true;
      case 2:
        // Description is required (minimum 20 characters)
        const description = watch('description');
        return description?.trim().length >= 20;
      case 3:
        // Social media links are optional
        return true;
      case 4:
        // Channel image is optional
        return true;
      default:
        return false;
    }
  };

  // Simple step navigation with validation
  const handleNextStep = () => {
    if (canProceedFromStep()) {
      setStep(step + 1);
    } else {
      // Show error message based on current step
      switch (step) {
        case 1:
          toast.error('Please enter a valid channel name and handle');
          break;
        case 2:
          toast.error('Please enter a description (minimum 20 characters)');
          break;
      }
    }
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const confirmCreateChannel = async () => {
    const data = watch();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('handle', stripHandleSuffix(data.handle));
    formData.append('description', data.description);
    formData.append('facebook_link', data.facebook_link);
    formData.append('instagram_link', data.instagram_link);
    formData.append('twitter_link', data.twitter_link);

    if (data.channel_image) {
      formData.append('channel_image', data.channel_image);
    }

    try {
      if (!session) throw new Error('User session not found');
      const token = await session.getToken();
      if (!token) throw new Error('Failed to get authentication token');

      const response = await createChannel(formData, token);
      if (response.success && response.channel?.handle) {
        toast.success('Channel created successfully!');
        return response.channel.handle;
      } else {
        throw new Error(response.message || 'Failed to create channel');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again later.');
      console.error('Error creating channel:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChannelImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-12"
          >
            <div className="flex flex-col lg:flex-row lg:space-x-12">
              <div className="space-y-6 flex-1">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Let's start with your channel name
                </h2>
                <div className="relative">
                  <input
                    {...register('name', { required: 'Channel name is required' })}
                    className="w-full px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800/30 
                      focus:ring-2 focus:ring-[#fa7517] focus:outline-none focus:border-transparent
                      text-lg text-white transition-all duration-300"
                    placeholder="Enter your channel name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                  />
                  {errors.name && (
                    <span className="text-red-500 mt-2 block text-sm">{errors.name.message}</span>
                  )}
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        Choose your channel handle
                      </h2>
                      <motion.button
                        type="button"
                        onClick={() => setShowHandleHelpModal(true)}
                        className="text-gray-400 hover:text-[#fa7517] transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <HelpCircle size={24} />
                      </motion.button>
                    </div>
                    <p className="text-gray-400 text-lg">
                      Your unique identifier on Base.Tube
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => generateHandleSuggestions(watchedName, { description: watch('description') })}
                    disabled={!watchedName || isGeneratingHandle}
                    className={`
                      flex items-center space-x-2 text-[#fa7517] 
                      hover:text-[#ff8c3a] transition-colors 
                      px-4 py-2 rounded-lg bg-[#fa7517]/10
                      ${!watchedName || isGeneratingHandle ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    whileHover={!isGeneratingHandle && watchedName ? { scale: 1.05 } : {}}
                    whileTap={!isGeneratingHandle && watchedName ? { scale: 0.95 } : {}}
                  >
                    {isGeneratingHandle ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4"
                        >
                          ⟳
                        </motion.div>
                        <span className="text-sm">Getting Suggestions...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">AI Suggestions</span>
                        <Bot className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>

                <div className="relative">
                  <div className="flex items-center">
                    <span className="text-gray-400 text-lg mr-3">channel/</span>
                    <div className="relative flex-1">
                      <input
                        {...register('handle', {
                          required: 'Handle is required',
                          validate: {
                            format: (value) => isValidHandle(stripHandleSuffix(value)) || 'Invalid handle format',
                            length: (value) => {
                              const stripped = stripHandleSuffix(value);
                              return (stripped.length >= 3 && stripped.length <= 29) || 
                                'Handle must be between 3 and 29 characters';
                            }
                          }
                        })}
                        className={`w-full px-4 py-3 bg-gray-900/50 rounded-lg border
                          text-lg transition-all duration-300
                          ${handleAvailable === true 
                            ? 'border-green-500/30 focus:ring-green-500' 
                            : 'border-gray-800/30 focus:ring-[#fa7517]'}
                          ${handleError ? 'border-red-500/50' : ''}
                          focus:outline-none focus:ring-2
                        `}
                        placeholder="your-channel-handle"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        .base
                      </span>
                      {isCheckingHandle && (
                        <motion.div
                          className="absolute right-16 top-1/2 transform -translate-y-1/2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          ⟳
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {handleError ? (
                      <motion.span
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 mt-2 block text-sm"
                      >
                        {handleError}
                      </motion.span>
                    ) : handleAvailable === true ? (
                      <motion.span
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-green-500 mt-2 block text-sm"
                      >
                        Handle is available!
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {aiHandleSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 p-6 bg-gray-900/50 rounded-xl border border-[#fa7517]/30"
                    >
                      <p className="text-[#fa7517] font-medium mb-4 text-lg">AI Suggested handles:</p>
                      <div className="flex flex-wrap gap-3">
                        {aiHandleSuggestions.map((suggestion) => (
                          <motion.button
                            type="button"
                            key={suggestion}
                            onClick={() => {
                              setValue('handle', stripHandleSuffix(suggestion), { shouldValidate: true });
                            }}
                            className="px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg 
                              hover:bg-gray-700 hover:text-white hover:shadow-lg hover:shadow-[#fa7517]/20 
                              border border-gray-700 hover:border-[#fa7517]/50
                              transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Handle Help Modal */}
            <AnimatePresence>
              {showHandleHelpModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gray-900 rounded-2xl p-8 w-full max-w-md relative border border-[#fa7517]"
                    style={{
                      boxShadow: '0 0 20px rgba(250, 117, 23, 0.5), 0 0 60px rgba(250, 117, 23, 0.3)',
                    }}
                  >
                    <button
                      onClick={() => setShowHandleHelpModal(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold text-[#fa7517] mb-4">About Channel Handles</h3>
                    <div className="space-y-4 text-gray-300">
                      <p>
                        Your channel handle is your unique identifier on Base.Tube. It's how viewers will find and share your channel.
                      </p>
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-[#fa7517] mb-2">Handle Requirements:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>3-29 characters long</li>
                          <li>Can contain letters, numbers, and underscores</li>
                          <li>Cannot contain spaces or special characters</li>
                          <li>Must be unique across Base.Tube</li>
                        </ul>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-[#fa7517] mb-2">Tips:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Keep it simple and memorable</li>
                          <li>Use your brand name if possible</li>
                          <li>Avoid numbers unless part of your brand</li>
                          <li>Consider using AI suggestions for ideas</li>
                        </ul>
                      </div>
                      <p className="text-sm text-gray-400 mt-4">
                        Your handle will appear as: <span className="text-white">channel/your-handle.base</span>
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">Tell viewers about your channel</h2>
                <motion.button
                  type="button"
                  onClick={() => setShowDescriptionHelpModal(true)}
                  className="text-gray-400 hover:text-[#fa7517] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <HelpCircle size={20} />
                </motion.button>
              </div>
              <motion.button
                type="button"
                onClick={() => setIsAIPanelOpen(true)}
                className="flex items-center space-x-2 text-[#fa7517] hover:text-[#ff8c3a] transition-colors px-4 py-2 rounded-lg bg-[#fa7517]/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">AI Assistant</span>
              </motion.button>
            </div>

            <p className="text-gray-300 mb-4">
              This is your chance to shine! Craft a compelling story that captures the essence of your channel. 
              Tell viewers what makes your content unique, what they'll discover, and why they should hit that subscribe button. 
              Remember, a great description not only attracts viewers but helps them find your amazing content.
            </p>

            {/* Description Input */}
            <Controller
              name="description"
              control={control}
              rules={{ 
                required: 'Description is required', 
                minLength: { value: 20, message: 'Description must be at least 20 characters' }
              }}
              render={({ field }) => (
                <RichTextEditor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Enter your channel description"
                  minHeight="300px"
                />
              )}
            />

            {errors.description && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-2 block"
              >
                {errors.description.message}
              </motion.span>
            )}

            {/* Description Help Modal */}
            <AnimatePresence>
              {showDescriptionHelpModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gray-900 rounded-2xl p-8 w-full max-w-md relative border border-[#fa7517]"
                    style={{
                      boxShadow: '0 0 20px rgba(250, 117, 23, 0.5), 0 0 60px rgba(250, 117, 23, 0.3)',
                    }}
                  >
                    <button
                      onClick={() => setShowDescriptionHelpModal(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold text-[#fa7517] mb-4">Crafting Your Channel Description</h3>
                    <div className="space-y-4 text-gray-300">
                      <p>
                        Your channel description is more than just text - it's your channel's story and your first impression on potential subscribers.
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Helps viewers discover your content through search</li>
                        <li>Showcases your channel's unique value proposition</li>
                        <li>Builds trust with your audience</li>
                        <li>Improves your channel's SEO</li>
                      </ul>
                      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium text-[#fa7517] mb-2">AI Assistant:</p>
                        <p className="text-gray-400">
                          Need help? Our AI Assistant can help you craft the perfect description by:
                        </p>
                        <ul className="list-disc list-inside text-gray-400 mt-2">
                          <li>Generating engaging content based on your keywords</li>
                          <li>Optimizing for search visibility</li>
                          <li>Maintaining your unique voice and style</li>
                          <li>Suggesting improvements to your existing description</li>
                        </ul>
                      </div>
                      <p className="text-sm text-gray-400 mt-4">
                        Click the AI Assistant button to get started with AI-powered description generation!
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <h2 className="text-2xl font-bold mb-4">Connect your social media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Facebook className="mr-2" />
                <Controller
                  name="facebook_link"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 bg-gray-800 rounded focus:ring-2 focus:ring-[#fa7517] focus:outline-none"
                      placeholder="Facebook profile URL"
                    />
                  )}
                />
              </div>
              <div className="flex items-center">
                <Instagram className="mr-2" />
                <Controller
                  name="instagram_link"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 bg-gray-800 rounded focus:ring-2 focus:ring-[#fa7517] focus:outline-none"
                      placeholder="Instagram profile URL"
                    />
                  )}
                />
              </div>
              <div className="flex items-center">
                <Twitter className="mr-2" />
                <Controller
                  name="twitter_link"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 bg-gray-800 rounded focus:ring-2 focus:ring-[#fa7517] focus:outline-none"
                      placeholder="Twitter profile URL"
                    />
                  )}
                />
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <h2 className="text-2xl font-bold mb-4">
              Upload your channel image
            </h2>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="channel_image"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700"
              >
                {channelImagePreview ? (
                  <img
                    src={channelImagePreview}
                    alt="Channel preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Hexagon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag
                      and drop
                    </p>
                    <div className="text-xs text-gray-500 space-y-1 text-center">
                      <p>Recommended: 1920x480px (4:1 ratio)</p>
                      <p>Minimum: 1280x320px</p>
                      <p>File types: PNG or JPG</p>
                      <p>Maximum file size: 3MB</p>
                    </div>
                  </div>
                )}
                <Controller
                  name="channel_image"
                  control={control}
                  defaultValue={null}
                  render={({ field }) => (
                    <input
                      id="channel_image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          field.onChange(e.target.files[0]);
                          handleImagePreview(e);
                        }
                      }}
                    />
                  )}
                />
              </label>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const navigationSteps = [
    { key: '1', icon: User, label: 'Name & Handle' },
    { key: '2', icon: FileText, label: 'Description' },
    { key: '3', icon: Share2, label: 'Social Media' },
    { key: '4', icon: Image, label: 'Image' },
  ];

  // Add a handler for AI description generation
  const handleGenerateDescription = async () => {
    if (!watchedName.trim()) {
      toast.error('Please enter a channel name first');
      return;
    }

    setIsGenerating(true);
    try {
      const { description: generated, suggestedHandle: suggested } = 
        await generateChannelDescription(watchedName, keywords, additionalInfo);
      
      console.log('Generated description:', generated);
      
      if (generated) {
        setValue('description', generated, { shouldValidate: true });
        setGeneratedDescription(generated);
      }
      if (suggested) {
        setSuggestedHandle(suggested);
      }
    } catch (error: any) {
      console.error('Description generation failed:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add this function
  const handleLaunchChannel = () => {
    const name = watch('name');
    const description = watch('description');

    // Validate required fields before showing modal
    if (!name?.trim() || !description?.trim() || description.trim().length < 20) {
      toast.error('Please fill in all required fields (name and description)');
      return;
    }

    // If validation passes, show the confirmation modal
    setIsModalOpen(true);
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="mb-16 text-center space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] bg-clip-text text-transparent">
                Create Your Channel
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Let's build something amazing together. Your journey starts here.
              </p>
            </div>

            <div className="mb-16">
              <StepIndicator
                steps={navigationSteps}
                activeStep={step.toString()}
                onStepClick={(stepKey) => setStep(parseInt(stepKey))}
              />
            </div>

            <div className="bg-gray-900/30 rounded-2xl p-8 lg:p-12 backdrop-blur-sm border border-gray-800/50">
              <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
              
              <div className="mt-12 flex justify-between items-center">
                {step > 1 && (
                  <motion.button
                    type="button"
                    onClick={handlePreviousStep}
                    className="bg-gray-800/80 text-white px-8 py-4 rounded-xl flex items-center 
                      transition-all duration-300 hover:bg-gray-700 border border-gray-700"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(250, 117, 23, 0.2)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="mr-3" /> Previous Step
                  </motion.button>
                )}
                
                {!isLastStep ? (
                  <motion.button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!canProceedFromStep()}
                    className={`bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black px-8 py-4 
                      rounded-xl flex items-center ml-auto font-medium
                      ${!canProceedFromStep() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    whileHover={canProceedFromStep() ? { scale: 1.02, boxShadow: '0 0 25px rgba(250, 117, 23, 0.5)' } : {}}
                    whileTap={canProceedFromStep() ? { scale: 0.98 } : {}}
                  >
                    <span className="flex items-center">
                      Next Step <ArrowRight className="ml-3" />
                    </span>
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleLaunchChannel}
                    disabled={isLoading || !canProceedFromStep()}
                    className={`bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black px-8 py-4 
                      rounded-xl flex items-center ml-auto font-medium
                      ${(isLoading || !canProceedFromStep()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    whileHover={!isLoading && canProceedFromStep() ? { scale: 1.02, boxShadow: '0 0 25px rgba(250, 117, 23, 0.5)' } : {}}
                    whileTap={!isLoading && canProceedFromStep() ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-3"
                        >
                          ⟳
                        </motion.div>
                        Creating Channel...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Launch Channel <Wand2 className="ml-3" />
                      </span>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Add a helper text to show required fields */}
            <div className="mt-4 text-sm text-gray-400">
              {step === 1 && (
                <p>* Channel name and handle are required</p>
              )}
              {step === 2 && (
                <p>* Channel description is required (minimum 20 characters)</p>
              )}
              {(step === 3 || step === 4) && (
                <p>* Required fields: Channel name and description</p>
              )}
            </div>
          </motion.div>
        </main>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={async () => {
          try {
            const handle = await confirmCreateChannel();
            if (handle) {
              setTimeout(() => {
                navigate(`/channel/${handle}`);
              }, 7000);
            }
          } catch (error) {
            console.error('Error creating channel:', error);
            setIsModalOpen(false);
          }
        }}
        title="Create Your Channel"
        message="Are you ready to create your Base.Tube channel?"
      />
      <AIAssistantPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        title={watchedName}
        keywords={keywords}
        additionalInfo={additionalInfo}
        onKeywordsChange={setKeywords}
        onAdditionalInfoChange={setAdditionalInfo}
        onGenerate={handleGenerateDescription}
        isGenerating={isGenerating}
        generatedDescription={generatedDescription}
        suggestedTitle={suggestedHandle}
        onAcceptTitle={() => {
          if (suggestedHandle) {
            setValue('handle', suggestedHandle, { shouldValidate: true });
            setSuggestedHandle(undefined);
          }
        }}
        mode="channel"
      />
    </div>
  );
};

export default CreateChannelPage;
