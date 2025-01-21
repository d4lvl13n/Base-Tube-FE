import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, Rocket, Share2 } from 'lucide-react';
import { useGeneratedName } from '../../hooks/useGeneratedName';
import { useAuth } from '../../contexts/AuthContext';
import OnboardingSuccessAnimation from '../animations/OnboardingSuccessAnimation';
import { onboardingApi } from '../../api/onboarding';

const OnboardingWeb3: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  const {
    suggestions,
    selectedUsername,
    isLoadingSuggestions,
    setSelectedUsername,
    refreshSuggestions,
    isValid,
    isUpdating
  } = useGeneratedName();

  const handleComplete = async () => {
    if (!user || !selectedUsername || !isValid) return;

    try {
      // First update username
      await onboardingApi.updateUsername(selectedUsername);
      
      // Then complete onboarding
      const { user: updatedUser } = await onboardingApi.completeOnboarding();
      
      // Update local state
      setUser(updatedUser);
      
      // Show success animation first
      setShowSuccessAnimation(true);
      
      // Navigate home after animation completes (3 seconds)
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);

    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  // Redirect if user is already onboarded
  useEffect(() => {
    if (user?.onboarding_status === 'COMPLETED') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Show loading state if no authenticated user
  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] overflow-hidden">
      <AnimatePresence mode="wait">
        {showSuccessAnimation ? (
          <OnboardingSuccessAnimation />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto p-8"
          >
            {step === 1 && (
              <div className="text-center mb-12">
                <motion.h1 
                  className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#fa7517] to-[#ff9f55] text-transparent bg-clip-text"
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                >
                  Welcome to Base.Tube Beta
                </motion.h1>
                <motion.p 
                  className="text-gray-400 text-lg mb-12 max-w-3xl mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  You're among the first pioneers joining us in reshaping the future of digital content. 
                  As an early adopter, you'll help shape the platform that will revolutionize how creators 
                  and viewers interact, earn, and build together.
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <FeatureCard
                    icon={<Rocket />}
                    title="Early Access and Future Vision"
                    description="You're stepping into the future of content creation before anyone else. Soon, viewers will earn rewards just for watching and engaging, and creators will unlock new monetization possibilities."
                    delay={0.3}
                  />
                  <FeatureCard
                    icon={<Sparkles />}
                    title="Pioneer Rewards"
                    description="Being early isn't just about being first – it's about being foundational. As one of our pioneers, you'll hold a special place in Base.Tube's history."
                    delay={0.4}
                  />
                  <FeatureCard
                    icon={<Share2 />}
                    title="Growing Together"
                    description="Your voice matters more than you know. As a pioneer, you're not just a user – you're an ambassador of the Web3 content revolution."
                    delay={0.5}
                  />
                </div>

                <motion.button
                  onClick={() => setStep(2)}
                  className="bg-[#fa7517] text-black px-8 py-4 rounded-full font-medium text-lg hover:bg-[#ff8c3a] transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </div>
            )}

            {step === 2 && (
              <motion.div 
                className="max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-[#fa7517] to-[#ff9f55] text-transparent bg-clip-text">
                  Let's Personalize Your Experience
                </h2>
                <p className="text-gray-400 text-lg mb-8 text-center">
                  Choose a unique username that represents you in the Base.Tube community
                </p>
                
                <div className="space-y-8">
                  {/* Generated Suggestions */}
                  <div className="bg-black/30 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-[#fa7517]">
                        Pick Your Username
                      </h3>
                      <motion.button
                        onClick={() => refreshSuggestions()}
                        className="text-[#fa7517] hover:text-[#ff8c3a] transition-colors p-2 rounded-lg hover:bg-[#fa7517]/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isLoadingSuggestions}
                      >
                        <RefreshCw 
                          size={20} 
                          className={`${isLoadingSuggestions ? 'animate-spin' : ''}`}
                        />
                      </motion.button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {suggestions.map((name) => (
                        <motion.button
                          key={name}
                          onClick={() => setSelectedUsername(name)}
                          className={`p-4 rounded-xl text-lg transition-all relative overflow-hidden ${
                            selectedUsername === name
                              ? 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black font-medium'
                              : 'bg-black/30 hover:bg-black/50 text-white hover:border-[#fa7517]/50'
                          } border border-transparent`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="relative z-10">{name}</span>
                          {selectedUsername === name && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-[#fa7517]/20 to-[#ff8c3a]/20"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Complete Button */}
                  <motion.button
                    onClick={handleComplete}
                    className="w-full bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black px-8 py-4 rounded-full font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#fa7517]/20 transition-all"
                    disabled={!selectedUsername || !isValid || isUpdating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isUpdating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Updating...</span>
                        {/* Optional: Add a loading spinner */}
                      </div>
                    ) : (
                      'Continue to Base.Tube'
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => (
  <motion.div 
    className="p-8 bg-black/30 rounded-xl border border-gray-800 hover:border-[#fa7517] transition-all"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="text-[#fa7517] mb-4 text-3xl">{icon}</div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

export default OnboardingWeb3; 