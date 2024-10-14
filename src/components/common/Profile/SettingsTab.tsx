import React from 'react';
import { motion } from 'framer-motion';
import { User, Wallet, Settings, ChevronRight } from 'lucide-react';

const SettingsTab: React.FC = () => {
  const settingsItems = [
    { icon: User, label: 'Account Information' },
    { icon: Wallet, label: 'Wallet Settings' },
    { icon: Settings, label: 'Preferences' },
  ];

  return (
    <div className="space-y-6">
      {settingsItems.map((item, index) => (
        <motion.div 
          key={index}
          className="bg-gray-800 rounded-xl p-4 flex items-center justify-between cursor-pointer"
          whileHover={{ scale: 1.02 }}
          style={{
            boxShadow: `0 0 10px 2px rgba(250, 117, 23, 0.3), 
                        0 0 30px 5px rgba(250, 117, 23, 0.2), 
                        0 0 50px 10px rgba(250, 117, 23, 0.1)`
          }}
          onClick={() => {/* Handle settings item click */}}
        >
          <div className="flex items-center">
            <item.icon size={24} className="mr-4" />
            <span>{item.label}</span>
          </div>
          <ChevronRight size={24} />
        </motion.div>
      ))}
    </div>
  );
};

export default SettingsTab;