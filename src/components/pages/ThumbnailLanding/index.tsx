import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import ThumbnailLandingHeader from './ThumbnailLandingHeader';
import ThumbnailHero from './ThumbnailHero';
import CTRAuditPipeline from './CTRAuditPipeline';
import ThumbnailFeatures from './ThumbnailFeatures';
import ThumbnailFAQ from './ThumbnailFAQ';
import FinalCTA from './FinalCTA';

const ThumbnailLanding: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleSignInClick = () => {
    setShowSignIn(true);
    setShowSignUp(false);
  };

  const handleSignUpClick = () => {
    setShowSignUp(true);
    setShowSignIn(false);
  };

  const closeModals = () => {
    setShowSignIn(false);
    setShowSignUp(false);
  };

  const AuthModal = ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => {
    if (!isOpen) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={closeModals}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeModals}
            className="absolute -top-4 -right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-10 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="absolute -inset-1 bg-gradient-to-r from-[#fa751730] via-[#fa751710] to-[#fa751730] rounded-3xl blur-2xl" />
          
          <div className="relative">
            {children}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header */}
      <ThumbnailLandingHeader
        onSignInClick={handleSignInClick}
        onSignUpClick={handleSignUpClick}
      />

      {/* Hero Section - CTR-focused messaging */}
      <ThumbnailHero onSignUpClick={handleSignUpClick} />

      {/* CTR Audit Pipeline - The main USP visualization */}
      <CTRAuditPipeline />

      {/* Features Section - CTR-focused */}
      <ThumbnailFeatures />

      {/* FAQ Section */}
      <ThumbnailFAQ />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/assets/basetubelogo.png" 
                  alt="Base.Tube Logo" 
                  className="w-10 h-10"
                />
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
                    Base.Tube
                  </span>
                  <p className="text-xs text-gray-400">CTR Optimization</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                The AI-powered thumbnail optimization engine. Audit, analyze, and generate thumbnails that actually convert.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <div className="space-y-2">
                <a href="/ai-thumbnails/audit" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  CTR Audit
                </a>
                <a href="/ai-thumbnails/generate" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Generate Thumbnails
                </a>
                <a href="/ai-thumbnails/gallery" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  My Gallery
                </a>
                <a href="#features" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Features
                </a>
              </div>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <div className="space-y-2">
                <a href="/" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Base.Tube Platform
                </a>
                <a href="/creator-hub" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Creator Hub
                </a>
                <a href="/about" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  About Us
                </a>
                <a href="/contact" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Contact
                </a>
              </div>
            </div>

            {/* Support Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <a href="mailto:support@base.tube" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Help Center
                </a>
                <a href="/privacy" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Terms of Service
                </a>
                <a href="#faq" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  FAQ
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-12 pt-8 border-t border-gray-800/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                © 2025 Base.Tube. All rights reserved.
              </div>
              <div className="flex items-center gap-6">
                <a href="https://twitter.com/basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Twitter
                </a>
                <a href="https://youtube.com/@basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  YouTube
                </a>
                <a href="https://discord.gg/basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <AnimatePresence>
        {showSignIn && (
          <AuthModal key="signin-modal" isOpen={showSignIn}>
          <SignIn
            routing="virtual"
            signUpUrl=""
            afterSignInUrl="/ai-thumbnails/audit"
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: '#fa7517',
                colorBackground: '#000000',
                colorText: '#FFFFFF',
                colorTextSecondary: '#9CA3AF',
                colorInputBackground: '#18181B',
                colorInputText: '#FFFFFF',
                borderRadius: '0.75rem',
              },
              elements: {
                rootBox: "w-full",
                card: `
                  bg-[#111114]/90 
                  border border-gray-800/20 
                  shadow-xl 
                  backdrop-blur-sm 
                  rounded-2xl
                  relative
                  z-10
                `,
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "border-gray-800 bg-[#18181B] hover:bg-[#1F1F23] transition-colors",
                formButtonPrimary: `
                  bg-[#fa7517] hover:bg-[#fa7517]/90 
                  transition-all duration-300
                  shadow-lg shadow-[#fa7517]/20 hover:shadow-[#fa7517]/30
                `,
                formFieldInput: {
                  backgroundColor: '#18181B',
                  borderColor: '#27272A',
                  '&:focus': {
                    borderColor: '#fa7517',
                    boxShadow: '0 0 0 2px rgba(250, 117, 23, 0.2)'
                  }
                },
                card__main: "p-6",
                footer: "mt-8"
              }
            }}
          />
        </AuthModal>
        )}

        {showSignUp && (
          <AuthModal key="signup-modal" isOpen={showSignUp}>
          <SignUp
            routing="virtual"
            signInUrl=""
            afterSignUpUrl="/ai-thumbnails/audit"
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: '#fa7517',
                colorBackground: '#000000',
                colorText: '#FFFFFF',
                colorTextSecondary: '#9CA3AF',
                colorInputBackground: '#18181B',
                colorInputText: '#FFFFFF',
                borderRadius: '0.75rem',
              },
              elements: {
                rootBox: "w-full",
                card: `
                  bg-[#111114]/90 
                  border border-gray-800/20 
                  shadow-xl 
                  backdrop-blur-sm 
                  rounded-2xl
                  relative
                  z-10
                `,
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "border-gray-800 bg-[#18181B] hover:bg-[#1F1F23] transition-colors",
                formButtonPrimary: `
                  bg-[#fa7517] hover:bg-[#fa7517]/90 
                  transition-all duration-300
                  shadow-lg shadow-[#fa7517]/20 hover:shadow-[#fa7517]/30
                `,
                formFieldInput: {
                  backgroundColor: '#18181B',
                  borderColor: '#27272A',
                  '&:focus': {
                    borderColor: '#fa7517',
                    boxShadow: '0 0 0 2px rgba(250, 117, 23, 0.2)'
                  }
                },
                card__main: "p-6",
                footer: "mt-8"
              }
            }}
          />
        </AuthModal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThumbnailLanding;
