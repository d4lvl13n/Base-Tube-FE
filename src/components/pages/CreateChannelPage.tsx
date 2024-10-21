import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { createChannel } from '../../api/channel';
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
} from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/ConfirmationModal';

interface FormData {
  name: string;
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
  const [channelImagePreview, setChannelImagePreview] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      channel_image: null,
    },
  });
  const navigate = useNavigate();

  const totalSteps = 4;

  const handleCreateChannel = async (data: FormData) => {
    if (!session) {
      toast.error('You must be logged in to create a channel.');
      return;
    }
    setIsModalOpen(true);
  };

  const confirmCreateChannel = async () => {
    const data = watch();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('facebook_link', data.facebook_link);
    formData.append('instagram_link', data.instagram_link);
    formData.append('twitter_link', data.twitter_link);

    if (data.channel_image) {
      formData.append('channel_image', data.channel_image);
    }

    try {
      if (!session) {
        throw new Error('User session not found');
      }
      const token = await session.getToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      const response = await createChannel(formData, token);
      if (response.success) {
        return response.channel.id;
      } else {
        throw new Error(response.message || 'Failed to create channel. Please try again.');
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
            <h2 className="text-2xl font-bold mb-4">Tell us about your channel</h2>
            <textarea
              {...register('description', {
                required: 'Description is required',
              })}
              className="w-full px-3 py-2 bg-gray-800 rounded focus:ring-2 focus:ring-[#fa7517] focus:outline-none"
              rows={4}
              placeholder="Describe your channel"
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
            {errors.description && (
              <span className="text-red-500 mt-1">
                {errors.description.message}
              </span>
            )}
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
    { key: '1', icon: User, label: 'Name' },
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
                {step < totalSteps ? (
                  <motion.button
                    type="button"
                    onClick={handleSubmit(() => setStep(step + 1))}
                    className="bg-[#fa7517] text-black px-6 py-3 rounded-full flex items-center ml-auto transition-all duration-300 hover:bg-[#ff8c3a]"
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(250, 117, 23, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next <ArrowRight className="ml-2" />
                  </motion.button>
                ) : (
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
            const channelId = await confirmCreateChannel();
            setTimeout(() => {
              navigate(`/channel/${channelId}`);
            }, 7000); // Increased from 3000 to 7000 milliseconds (7 seconds)
          } catch (error) {
            setIsModalOpen(false);
          }
        }}
        title="Create Your Channel"
        message="Are you ready to create your Base.Tube channel?"
      />
    </div>
  );
};

export default CreateChannelPage;
