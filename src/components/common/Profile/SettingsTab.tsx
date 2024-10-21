// src/components/common/Profile/SettingsTab.tsx

import React, { useState, useEffect } from 'react';
import {
  getProfileSettings,
  updateProfileSettings,
} from '../../../api/profile';
import Loader from '../Loader';
import { motion } from 'framer-motion';
import { FaEnvelope, FaSms } from 'react-icons/fa';
import { Switch } from '@headlessui/react';

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface SettingsTabProps {}

const SettingsTab: React.FC<SettingsTabProps> = () => {
  const [email, setEmail] = useState('');
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>({
      emailNotifications: true,
      smsNotifications: false,
    });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settings = await getProfileSettings();
        setEmail(settings.email);
        setNotificationPreferences(settings.notificationPreferences || {});
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('An error occurred while fetching settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl shadow-lg space-y-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-3xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-transparent bg-clip-text">Account Settings</h3>
      
      {error && (
        <motion.div 
          className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 p-4 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p>{error}</p>
        </motion.div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-300">Email</label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-[#fa7517]"
              value={email}
              readOnly
            />
          </div>
        </div>

        <div>
          <h4 className="text-xl font-bold mb-4 text-gray-200">Notification Preferences</h4>
          <div className="space-y-4">
            <SwitchOption
              icon={<FaEnvelope className="text-[#fa7517]" />}
              label="Email Notifications"
              enabled={notificationPreferences.emailNotifications}
              setEnabled={(value) =>
                setNotificationPreferences({
                  ...notificationPreferences,
                  emailNotifications: value,
                })
              }
            />
            <SwitchOption
              icon={<FaSms className="text-[#fa7517]" />}
              label="SMS Notifications"
              enabled={notificationPreferences.smsNotifications}
              setEnabled={(value) =>
                setNotificationPreferences({
                  ...notificationPreferences,
                  smsNotifications: value,
                })
              }
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface SwitchOptionProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}

const SwitchOption: React.FC<SwitchOptionProps> = ({ icon, label, enabled, setEnabled }) => {
  return (
    <Switch.Group>
      <div className="flex items-center justify-between">
        <Switch.Label className="flex items-center space-x-3 cursor-pointer">
          {icon}
          <span>{label}</span>
        </Switch.Label>
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={`${
            enabled ? 'bg-[#fa7517]' : 'bg-gray-600'
          } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fa7517]`}
        >
          <span
            className={`${
              enabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
};

export default SettingsTab;
