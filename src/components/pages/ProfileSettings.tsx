import React from 'react';
import { UserProfile as ClerkUserProfile } from '@clerk/clerk-react';
import { dark } from "@clerk/themes";
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { motion } from 'framer-motion';

const ProfileSettings: React.FC = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-300">
              Profile Settings
            </h1>
            
            <div 
              className="bg-white rounded-3xl overflow-hidden relative"
              style={{
                boxShadow: `
                  0 0 20px 5px rgba(250, 117, 23, 0.1),
                  0 0 40px 10px rgba(250, 117, 23, 0.05),
                  inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
                `,
                background: `
                  linear-gradient(145deg, rgba(250, 117, 23, 0.1), rgba(17, 24, 39, 1))
                `
              }}
            >
              <ClerkUserProfile 
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: '#fa7517',
                    colorBackground: '#000000',
                  },
                  elements: {
                    rootBox: "w-full h-full",
                    card: "bg-transparent shadow-none",
                    navbar: "true",
                    header: "true"
                  }
                }}
              />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ProfileSettings;