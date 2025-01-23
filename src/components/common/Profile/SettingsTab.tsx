import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Shield, 
  LogOut,
  Edit3,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfileSettings, updateProfileSettings, updateProfile } from '../../../api/profile';
import Error from '../Error';
import Loader from '../Loader';
import { ProfileSettings } from '../../../types/user';
import { useAuth } from '../../../contexts/AuthContext';
import { useGeneratedName } from '../../../hooks/useGeneratedName';

type SettingsTabProps = {
  settings: ProfileSettings;
  errors: { [key: string]: string };
};

const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  errors
}) => {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Web3 auth checks
  const { isAuthenticated, user, setUser } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [showWeb3Modal, setShowWeb3Modal] = useState<boolean>(false);

  // AI Username Generation hook
  const {
    refreshCount,
    maxRefreshes,
    suggestions,
    selectedUsername,
    customUsername,
    isLoadingSuggestions,
    isUpdating,
    setSelectedUsername,
    setCustomUsername,
    refreshSuggestions,
  } = useGeneratedName();

  // Issue #2: Track a preview to show on upload
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Pre-fill with existing user data (if any)
  const [web3ProfileData, setWeb3ProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clerk-based or custom-based user settings
  const {
    data: userSettings,
    isLoading: isSettingsLoading,
    isError,
    error
  } = useQuery<ProfileSettings>({
    queryKey: ['settings'],
    queryFn: () => getProfileSettings(),
    initialData: settings,
    enabled: !isAuthenticated // only fetch if user not web3
  });

  // Mutation: update notification preferences
  const updateSettingsMutation = useMutation({
    mutationFn: updateProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  // Mutation: update web3 user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: FormData) => {
      return updateProfile(profileData);
    },
    onSuccess: (updatedProfile) => {
      setShowWeb3Modal(false);
      if (setUser && updatedProfile && user) {
        setUser({
          ...user,
          username: updatedProfile.username,
          email: updatedProfile.email,
          profile_image_url: updatedProfile.profile_image_url,
        });
      }
    }
  });

  // Toggle notification preference
  const handleToggleNotification = async (
    name: keyof ProfileSettings['notificationPreferences'],
    checked: boolean
  ) => {
    if (!userSettings) return;
    try {
      await updateSettingsMutation.mutateAsync({
        ...userSettings,
        notificationPreferences: {
          ...userSettings.notificationPreferences,
          [name]: checked
        }
      });
    } catch (err) {
      console.error('Error updating notification settings:', err);
    }
  };

  // Clerk or Web3 user
  const handleEditProfile = () => {
    if (isAuthenticated) {
      setShowWeb3Modal(true);
    } else {
      // For Clerk user
      navigate('/profile/settings');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  // Issue #1: Ensure we do NOT auto-generate an AI username.
  const handleSuggestClick = () => {
    refreshSuggestions();
  };

  // Issue #3: capture file input changes
  const handleFileChange = () => {
    if (fileInputRef.current?.files?.[0]) {
      setPreviewImage(URL.createObjectURL(fileInputRef.current.files[0]));
    }
  };

  // Web3 user form submit
  const handleWeb3ProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUsername = customUsername || selectedUsername || web3ProfileData.username;

    const formData = new FormData();
    formData.append('username', finalUsername.trim());
    formData.append('email', web3ProfileData.email.trim());
    
    if (fileInputRef.current?.files?.[0]) {
      formData.append('picture', fileInputRef.current.files[0]);
    }

    updateProfileMutation.mutate(formData);
  };

  // Return loaders or error states
  if (isSettingsLoading) {
    return <Loader />;
  }
  if (isError) {
    return <Error message={error?.message || 'Failed to load settings'} />;
  }

  // If Clerk user had no data
  if (!isAuthenticated && !userSettings) {
    return <Error message="No settings data available" />;
  }

  const defaultNotificationPreferences = {
    emailNotifications: false,
    smsNotifications: false
  };

  const notificationPreferences =
    userSettings?.notificationPreferences || defaultNotificationPreferences;

  return (
    <motion.div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-3">
          Account Settings
        </h1>
        <p className="text-gray-400 text-lg">
          Manage your account preferences and notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Preferences */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-900/50 rounded-lg">
                <Bell className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Notification Preferences
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold">Email Notifications</p>
                    <p className="text-sm text-gray-400">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.emailNotifications}
                    onChange={(e) => handleToggleNotification('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                    disabled={updateSettingsMutation.isPending}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fa7517]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fa7517]"></div>
                </label>
              </div>

              <div className="p-4 bg-gray-900/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold">SMS Notifications</p>
                    <p className="text-sm text-gray-400">Receive updates via SMS</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.smsNotifications}
                    onChange={(e) => handleToggleNotification('smsNotifications', e.target.checked)}
                    className="sr-only peer"
                    disabled={updateSettingsMutation.isPending}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fa7517]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fa7517]"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>

        {/* Account Information */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-900/50 rounded-lg">
                <Shield className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Account Information
              </h2>
            </div>
            
            <div className="space-y-4">
              <motion.button
                onClick={handleEditProfile}
                className="w-full p-4 bg-[#fa7517] hover:bg-[#fa7517]/90 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 className="w-5 h-5" />
                Edit Profile
                <ChevronRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={handleLogout}
                disabled={loading}
                className="w-full p-4 bg-gray-900/50 hover:bg-gray-900/70 text-white rounded-xl font-semibold transition-colors border border-gray-800/30 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-5 h-5" />
                {loading ? 'Signing out...' : 'Sign Out'}
              </motion.button>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>
      </div>

      {/* Web3 Edit Modal */}
      {showWeb3Modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/80 border border-gray-800/50 rounded-xl w-full max-w-md relative"
            style={{
              boxShadow: `
                0 0 20px 5px rgba(250, 117, 23, 0.1),
                0 0 40px 10px rgba(250, 117, 23, 0.05),
                inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
              `
            }}
          >
            {/* Scrollable container */}
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <form onSubmit={handleWeb3ProfileSubmit} className="space-y-6 relative z-10">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff9f55] bg-clip-text text-transparent">
                    Edit Profile (Web3)
                  </h3>

                  {/* Username Field + AI Suggestions */}
                  <label className="block">
                    <span className="text-sm text-gray-200">Username</span>
                    <input
                      type="text"
                      className="w-full mt-1 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-[#fa7517] transition-colors"
                      value={customUsername || (selectedUsername || web3ProfileData.username)}
                      onChange={(e) => {
                        setCustomUsername(e.target.value);
                        setSelectedUsername('');
                      }}
                      placeholder="Choose a username"
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSuggestClick}
                      disabled={refreshCount >= maxRefreshes || isLoadingSuggestions}
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <Sparkles size={16} />
                      {isLoadingSuggestions ? 'Loading...' : 'Suggest'}
                    </button>
                    <p className="text-xs text-gray-400">
                      {refreshCount}/{maxRefreshes} refreshes used
                    </p>
                  </div>

                  {/* Suggestions Grid */}
                  {suggestions?.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {suggestions.map((name) => (
                        <motion.button
                          key={name}
                          onClick={() => {
                            setSelectedUsername(name);
                            setCustomUsername('');
                          }}
                          type="button"
                          className={`relative flex items-center justify-center
                            rounded-md px-3 py-2 border transition-colors
                            ${
                              selectedUsername === name
                                ? 'text-[#fa7517] border-[#fa7517] bg-[#fa7517]/10'
                                : 'border-gray-700 hover:border-[#fa7517]/50 text-gray-200'
                            }`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          {name}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Email Field */}
                  <label className="block">
                    <span className="text-sm text-gray-200">Email</span>
                    <input
                      type="email"
                      className="w-full mt-1 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-[#fa7517] transition-colors"
                      value={web3ProfileData.email}
                      onChange={(e) =>
                        setWeb3ProfileData({
                          ...web3ProfileData,
                          email: e.target.value
                        })
                      }
                      placeholder="Enter your email"
                    />
                  </label>

                  {/* Profile Image Upload */}
                  <div>
                    <label className="block text-sm text-gray-200 mb-1">
                      Profile Image
                    </label>
                    <label
                      className="block p-3 border-2 border-dashed
                        border-gray-700 rounded-lg hover:border-[#fa7517]
                        transition-colors cursor-pointer text-gray-400
                        hover:text-[#fa7517]"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon size={20} />
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <span className="text-xs">
                            {fileInputRef.current?.files?.[0]?.name || 'Upload new image'}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowWeb3Modal(false)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating || updateProfileMutation.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-[#fa7517] to-[#ff9f55] rounded-lg text-black font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {(isUpdating || updateProfileMutation.isPending) ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent rounded-xl" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SettingsTab;