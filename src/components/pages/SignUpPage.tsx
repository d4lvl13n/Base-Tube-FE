import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Wallet, Users, Trophy } from 'lucide-react';
import { FeatureCard } from './SignInWeb3/components/FeatureCard';

const SignUpPage: React.FC = () => {
  return (
    <>
      <style>
        {`
          @media (max-width: 1024px) {
            .hide-on-mobile {
              display: none;
            }
          }
        `}
      </style>
      <div className="h-screen bg-[#09090B] grid lg:grid-cols-2 grid-cols-1">
        {/* Left Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col p-8 lg:p-12 max-h-screen overflow-hidden"
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-4 transition-transform hover:scale-105">
            <img
              src="/assets/basetubelogo.png"
              alt="Base.Tube"
              className="w-16 h-16 lg:w-24 lg:h-24"
            />
            <span className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
              Base.Tube
            </span>
          </Link>

          {/* Main Content */}
          <div className="mt-6 lg:mt-12 relative z-10 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Join the Future of
                  <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent"> Content</span>
                </span>
              </h1>
            </motion.div>

            {/* Feature Cards Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 grid grid-cols-2 gap-6 hide-on-mobile relative z-20"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                <FeatureCard 
                  icon={<Play className="w-5 h-5 text-[#fa7517]" />}
                  title="Own Your Content"
                  description="True ownership with NFT Content Pass"
                  className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300"
                />
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                <FeatureCard 
                  icon={<Wallet className="w-5 h-5 text-[#fa7517]" />}
                  title="Earn $TUBE"
                  description="Get rewarded for your contributions"
                  className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300"
                />
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                <FeatureCard 
                  icon={<Users className="w-5 h-5 text-[#fa7517]" />}
                  title="Join Community"
                  description="Be part of decentralized governance"
                  className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300"
                />
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                <FeatureCard 
                  icon={<Trophy className="w-5 h-5 text-[#fa7517]" />}
                  title="Exclusive Access"
                  description="Special perks for creators"
                  className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300"
                />
              </div>
            </motion.div>

            {/* Quote Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 lg:mt-12 flex justify-center hide-on-mobile"
            >
              <blockquote className="text-xl lg:text-2xl font-medium leading-relaxed text-center max-w-2xl">
                <span className="bg-gradient-to-r from-[#fa7517]/80 to-orange-400/80 bg-clip-text text-transparent">
                  "Your Content, Your Rules, Your Digital Legacy"
                </span>
              </blockquote>
            </motion.div>
          </div>

          {/* Subtle Gradient */}
          <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-to-t from-[#fa751720] to-transparent rounded-full blur-3xl" />
        </motion.div>

        {/* Sign Up Form Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center justify-center p-4 lg:p-8 flex-shrink-0"
        >
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#fa751730] via-[#fa751710] to-[#fa751730] rounded-3xl blur-2xl" />
            
            <div id="clerk-captcha" className="mb-4"></div>
            
            <SignUp 
              routing="path" 
              path="/sign-up"
              signInUrl="/sign-in"
              afterSignUpUrl="/onboarding"
              redirectUrl="/onboarding"
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
                  socialButtons: "grid grid-cols-2 gap-2",
                  footer: "mt-8"
                }
              }}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SignUpPage;
