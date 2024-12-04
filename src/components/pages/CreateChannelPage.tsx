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
  
  const {
    register,
    handleSubmit,
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

  const handleCreateChannel = async (data: FormData) => {
    if (!session) {
      toast.error('You must be logged in to create a channel.');
      return;
    }

    try {
      const strippedHandle = stripHandleSuffix(data.handle);
      
      // Validate handle format first
      if (!isValidHandle(strippedHandle)) {
        toast.error('Invalid handle format. Please correct before continuing.');
        return;
      }

      // Final handle check
      const handleCheck = await checkHandleAvailability(strippedHandle);
      if (!handleCheck.isAvailable) {
        toast.error('Handle is no longer available. Please choose another.');
        return;
      }

      setIsModalOpen(true);
    } catch (error) {
      console.error('Pre-submission validation failed:', error);
      toast.error('Unable to validate handle. Please try again.');
    }
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
          >
            <h2 className="text-2xl font-bold mb-4">
              Let's start with your channel name
            </h2>
            <input
              {...register('name', { required: 'Channel name is required' })}
              className="w-full px-3 py-2 bg-gray-800 rounded focus:ring-2 focus:ring-[#fa7517] focus:outline-none"
              placeholder="Enter your channel name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
            {errors.name && (
              <span className="text-red-500 mt-1">{errors.name.message}</span>
            )}

            {/* Handle Input */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">Choose your channel handle</h2>
                  <motion.button
                    type="button"
                    onClick={() => setShowHandleHelpModal(true)}
                    className="text-gray-400 hover:text-[#fa7517] transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <HelpCircle size={20} />
                  </motion.button>
                </div>
                <motion.button
                  type="button"
                  onClick={() => generateHandleSuggestions(watchedName, { description: watch('description') })}
                  disabled={!watchedName || isGeneratingHandle}
                  className={`
                    px-4 py-2 rounded-lg font-medium
                    flex items-center space-x-2
                    transition-all duration-300
                    ${isGeneratingHandle 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] hover:shadow-[#fa7517]/50 shadow-lg'
                    }
                    ${!watchedName ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  whileHover={!isGeneratingHandle && watchedName ? { scale: 1.02 } : {}}
                  whileTap={!isGeneratingHandle && watchedName ? { scale: 0.98 } : {}}
                >
                  {isGeneratingHandle ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5"
                      >
                        ⟳
                      </motion.div>
                      <span className="text-white">Getting Suggestions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span className="text-black">Get AI Suggestions</span>
                      <Bot className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-gray-300 mb-4">
                Your handle is your unique identifier on Base.Tube. It's how others will find and mention you.
              </p>

              <div className="flex items-center">
                <span className="text-gray-300 mr-2">channel/</span>
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
                    className={`w-full px-3 py-2 bg-gray-800 rounded focus:ring-2 focus:outline-none
                      ${handleAvailable === true ? 'focus:ring-green-500' : 'focus:ring-[#fa7517]'}
                      ${handleError ? 'border-red-500' : ''}
                    `}
                    placeholder="your-channel-handle"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    .base
                  </span>
                  {isCheckingHandle && (
                    <motion.div
                      className="absolute right-12 top-1/2 transform -translate-y-1/2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ⟳
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Handle Status Messages */}
              <AnimatePresence mode="wait">
                {handleError ? (
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-500 mt-1 block"
                  >
                    {handleError}
                  </motion.span>
                ) : handleAvailable === true ? (
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-green-500 mt-1 block"
                  >
                    Handle is available!
                  </motion.span>
                ) : null}
              </AnimatePresence>

              {/* Handle Suggestions */}
              <div className="mt-2">
                <AnimatePresence>
                  {aiHandleSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-4 bg-gray-900/50 rounded-xl border border-[#fa7517]/30"
                    >
                      <p className="text-[#fa7517] font-medium mb-2">AI Suggested handles:</p>
                      <div className="flex flex-wrap gap-2">
                        {aiHandleSuggestions.map((suggestion) => (
                          <motion.button
                            type="button"
                            key={suggestion}
                            onClick={() => {
                              setValue('handle', stripHandleSuffix(suggestion), { shouldValidate: true });
                            }}
                            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg 
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
                  {aiHandleSuggestions.length === 0 && !isGeneratingHandle && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-gray-400 mt-2 italic"
                    >
                      No suggestions available at this time.
                    </motion.p>
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
                        Your channel handle is a unique identifier that:
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Makes your channel easy to find and share</li>
                        <li>Appears in your channel's URL</li>
                        <li>Can be used to mention your channel</li>
                        <li>Must be between 3 and 29 characters</li>
                      </ul>
                      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium text-[#fa7517] mb-2">Example:</p>
                        <p className="text-gray-400">
                          Handle: <span className="text-white">gaming_with_sara</span><br />
                          URL: base.tube/<span className="text-white">gaming_with_sara</span>
                        </p>
                      </div>
                      <p className="text-sm text-gray-400 mt-4">
                        You can use letters, numbers, and underscores. Choose something memorable that represents your channel!
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
            <div className="space-y-4">
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
                    <p className="text-xs text-gray-500">
                      PNG, JPG or GIF (MAX. 800x400px)
                    </p>
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

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <h1 className="text-4xl font-bold mb-8 text-center text-[#fa7517]">
              Create Your Channel
            </h1>
            <StepIndicator
              steps={navigationSteps}
              activeStep={step.toString()}
              onStepClick={(stepKey) => setStep(parseInt(stepKey))}
            />
            <form onSubmit={handleSubmit(handleCreateChannel)}>
              <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
              <div className="mt-8 flex justify-between">
                {step > 1 && (
                  <motion.button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="bg-gray-700 text-white px-6 py-3 rounded-full flex items-center transition-all duration-300 hover:bg-gray-600"
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(250, 117, 23, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="mr-2" /> Previous
                  </motion.button>
                )}
                {step < totalSteps && (
                  <motion.button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="bg-[#fa7517] text-black px-6 py-3 rounded-full flex items-center transition-all duration-300 hover:bg-orange-400"
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(250, 117, 23, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next <ArrowRight className="ml-2" />
                  </motion.button>
                )}
                {step === totalSteps && (
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#fa7517] text-black px-6 py-3 rounded-full flex items-center ml-auto transition-all duration-300 hover:bg-[#ff8c3a]"
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(250, 117, 23, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? 'Creating...' : 'Create Channel'}
                  </motion.button>
                )}
              </div>
            </form>
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
        title={watch('name')}
        keywords=""
        additionalInfo=""
        onKeywordsChange={() => {}}
        onAdditionalInfoChange={() => {}}
        onGenerate={() => {}}
        isGenerating={false}
        generatedDescription={watch('description')}
        mode="channel"
      />
    </div>
  );
};

export default CreateChannelPage;
