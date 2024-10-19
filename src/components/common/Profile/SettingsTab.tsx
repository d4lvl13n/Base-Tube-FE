// src/components/common/Profile/SettingsTab.tsx

import React, { useState, useEffect } from 'react';
import { getProfileSettings, updateProfileSettings } from '../../../api/profile';

interface SettingsTabProps {
  loading?: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ loading = false }) => {
  const [email, setEmail] = useState('');
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getProfileSettings();
        setEmail(settings.email);
        setNotificationPreferences({
          emailNotifications: settings.emailNotifications,
          smsNotifications: settings.smsNotifications,
        });
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateProfileSettings({
        email,
        ...notificationPreferences,
      });
      // Optionally show success message
    } catch (err) {
      console.error('Error updating settings:', err);
      // Optionally show error message
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-800 h-12 rounded mb-4"></div>
        <div className="bg-gray-800 h-48 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Account Settings</h3>
      <div className="mb-4">
        <label className="block mb-1">Email</label>
        <input
          type="email"
          className="w-full p-2 rounded bg-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <h4 className="text-lg font-bold mb-2">Notification Preferences</h4>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={notificationPreferences.emailNotifications}
            onChange={(e) =>
              setNotificationPreferences({
                ...notificationPreferences,
                emailNotifications: e.target.checked,
              })
            }
            className="mr-2"
          />
          Email Notifications
        </label>
        <label className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={notificationPreferences.smsNotifications}
            onChange={(e) =>
              setNotificationPreferences({
                ...notificationPreferences,
                smsNotifications: e.target.checked,
              })
            }
            className="mr-2"
          />
          SMS Notifications
        </label>
      </div>
      <button
        className="px-4 py-2 bg-[#fa7517] text-black rounded"
        onClick={handleSaveSettings}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};

export default SettingsTab;
