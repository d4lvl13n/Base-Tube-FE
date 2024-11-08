import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Shield, 
  LogOut,
  Edit3,
  ChevronRight
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfileSettings, updateProfileSettings } from '../../../api/profile';
import Error from '../Error';
import Loader from '../Loader';
import { ProfileSettings } from '../../../types/user';

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
  const [loading, setLoading] = useState<boolean>(false);

  const { 
    data: userSettings, 
    isLoading: isSettingsLoading,
    isError,
    error
  } = useQuery<ProfileSettings>({
    queryKey: ['settings'],
    queryFn: () => getProfileSettings(),
    initialData: settings
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

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

  const handleEditProfile = () => {
    navigate('/profile/settings');
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

  if (isSettingsLoading) {
    return <Loader />;
  }

  if (isError) {
    return <Error message={error?.message || 'Failed to load settings'} />;
  }

  if (!userSettings) {
    return <Error message="No settings data available" />;
  }

  // Default values for notification preferences
  const defaultNotificationPreferences = {
    emailNotifications: false,
    smsNotifications: false
  };

  // Safely access notification preferences with fallback to defaults
  const notificationPreferences = userSettings?.notificationPreferences || defaultNotificationPreferences;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-3">
          Account Settings
        </h1>
        <p className="text-gray-400 text-lg">Manage your account preferences and notifications</p>
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
    </motion.div>
  );
};

export default SettingsTab;