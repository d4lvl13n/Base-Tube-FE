import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Wallet, Users, Trophy } from 'lucide-react';

const SignUpPage: React.FC = () => {
  return (
    <>
      <div className="min-h-screen bg-[#09090B] flex">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-0 lg:w-1/2 lg:flex flex-col p-8 lg:p-12 relative overflow-hidden"
        >
          {/* Logo Section */}
          <Link to="/" className="inline-flex items-center gap-4 transition-transform hover:scale-105">
            <img
              src="/assets/basetubelogo.png"
              alt="Base.Tube"
              className="w-24 h-24"
            />
            <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
              Base.Tube
            </span>
          </Link>

          {/* Hero Content */}
          <div className="mt-12 lg:mt-20 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Welcome to the
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
                  Future of Content
                </span>
              </h1>
            </motion.div>

            {/* Features Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 grid grid-cols-2 gap-6"
            >
              <FeatureCard 
                icon={<Play className="w-5 h-5 text-[#fa7517]" />}
                title="Own Your Content"
                description="True ownership with NFT Content Pass"
              />
              <FeatureCard 
                icon={<Wallet className="w-5 h-5 text-[#fa7517]" />}
                title="Earn $TUBE"
                description="Get rewarded for your contributions"
              />
              <FeatureCard 
                icon={<Users className="w-5 h-5 text-[#fa7517]" />}
                title="Join Community"
                description="Be part of decentralized governance"
              />
              <FeatureCard 
                icon={<Trophy className="w-5 h-5 text-[#fa7517]" />}
                title="Exclusive Access"
                description="Special perks for creators"
              />
            </motion.div>

            {/* Quote Section - Centered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 lg:mt-16 flex justify-center"
            >
              <blockquote className="text-xl lg:text-2xl font-medium leading-relaxed text-center max-w-2xl">
                <span className="bg-gradient-to-r from-[#fa7517]/80 to-orange-400/80 bg-clip-text text-transparent">
                  "Your Content, Your Rules, Your Digital Legacy"
                </span>
              </blockquote>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-to-t from-[#fa751720] to-transparent rounded-full blur-3xl" />
        </motion.div>

        {/* Sign Up Form Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-1/2 flex items-center justify-center p-8 relative"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#fa751710] via-transparent to-[#fa751710]" />
          
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#fa751730] via-[#fa751710] to-[#fa751730] rounded-3xl blur-2xl" />
            
            {/* Add CAPTCHA container */}
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
                  footer: "mt-8",
                  captchaContainer: `
                    bg-[#111114]/90 
                    border border-gray-800/20 
                    rounded-xl
                    p-4
                    mb-4
                  `,
                  captchaButton: `
                    bg-[#18181B] 
                    hover:bg-[#1F1F23] 
                    transition-colors
                    border border-gray-800
                    rounded-lg
                  `
                }
              }}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className="p-4 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
    style={{
      boxShadow: `
        0 0 20px 5px rgba(250, 117, 23, 0.1),
        0 0 40px 10px rgba(250, 117, 23, 0.05),
        inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
      `
    }}
  >
    <div className="relative z-10">
      <div className="p-2 bg-gray-900/50 rounded-lg w-fit">
        {icon}
      </div>
      <h3 className="font-semibold text-white mt-3">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
    
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
    
    {/* Subtle glow effect on hover */}
    <motion.div
      className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 0.03 }}
    />
  </motion.div>
);

export default SignUpPage;
