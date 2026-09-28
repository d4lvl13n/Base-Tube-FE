import React from 'react';

import ThumbnailLandingHeader from './ThumbnailLandingHeader';
import ThumbnailHero from './ThumbnailHero';
import CTRAuditPipeline from './CTRAuditPipeline';
import ThumbnailFeatures from './ThumbnailFeatures';
import ThumbnailFAQ from './ThumbnailFAQ';
import FinalCTA from './FinalCTA';
import StudioWelcomeCard from '../CTREngine/components/StudioWelcomeCard';

const ThumbnailLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header: Sign In and Get Started use AI Thumbnails' own sign-in and sign-up */}
      <ThumbnailLandingHeader />

      {/* "Get Started" returns here: a new account's welcome, below the fixed header. */}
      <StudioWelcomeCard className="relative z-10 mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8" />

      {/* Hero Section - CTR-focused messaging */}
      <ThumbnailHero />

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
                  <p className="text-xs text-gray-400">Thumbnail Studio</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                AI thumbnail review and generation. See what's weakening your thumbnail, and fix it.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <div className="space-y-2">
                <a href="/ai-thumbnails/audit" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Thumbnail Review
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
                <a href="/refund" className="block text-sm text-gray-400 hover:text-[#fa7517] transition-colors">
                  Refund Policy
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
    </div>
  );
};

export default ThumbnailLanding;
