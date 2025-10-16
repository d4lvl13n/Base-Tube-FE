import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Rocket, Sparkles, Share2, RefreshCw, UserCircle } from 'lucide-react';
import { useGeneratedName } from '../../hooks/useGeneratedName';
import { useAuth } from '../../contexts/AuthContext';
import OnboardingSuccessAnimation from '../animations/OnboardingSuccessAnimation';
import { onboardingApi } from '../../api/onboarding';

type OnboardingStep = 'welcome' | 'username' | 'success';

const OnboardingWeb3: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  
  const {
    suggestions,
    selectedUsername,
    isLoadingSuggestions,
    setSelectedUsername,
    refreshSuggestions,
    isValid,
    isUpdating,
    refreshCount,
    maxRefreshes,
    customUsername,
    setCustomUsername
  } = useGeneratedName({ enabled: step === 'username' });

  const handleComplete = async () => {
    const finalUsername = customUsername || selectedUsername;
    if (!finalUsername || !isValid || !user) return;

    try {
      await onboardingApi.updateUsername(finalUsername);
      const { user: updatedUser } = await onboardingApi.completeOnboarding();

      setUser(updatedUser);
      setStep('success');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleAnimationComplete = () => {
    navigate('/', { replace: true });
  };

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
        {step === 'success' && (
          <motion.div
            key="success-animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center w-full h-screen"
          >
            <OnboardingSuccessAnimation onComplete={handleAnimationComplete} />
          </motion.div>
        )}

        {step === 'welcome' && (
          <motion.div
            key="welcome-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto p-8"
          >
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
                onClick={() => setStep('username')}
                className="bg-[#fa7517] text-black px-8 py-4 rounded-full font-medium text-lg hover:bg-[#ff8c3a] transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'username' && (
          <motion.div
            key="username-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto px-4 pt-16 md:pt-24"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center bg-gradient-to-r from-[#fa7517] to-[#ff9f55] text-transparent bg-clip-text">
              Let's Personalize Your Experience
            </h2>
            <p className="text-gray-400 text-base md:text-lg mb-12 text-center">
              Choose a unique username that represents you in the Base.Tube community
            </p>
            
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                <div className="p-4 md:p-6 rounded-lg bg-black/90 backdrop-blur-xl border border-white/10 relative transition-all duration-300 group-hover:border-[#fa7517]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fa7517] to-orange-400 flex items-center justify-center">
                      <UserCircle className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-white">Create Your Username</h3>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customUsername}
                      onChange={(e) => {
                        setCustomUsername(e.target.value);
                        if (e.target.value) setSelectedUsername('');
                      }}
                      placeholder="Enter your username"
                      className="w-full bg-black/30 rounded-lg px-4 py-3 
                        text-white placeholder-gray-500
                        border border-white/10 focus:border-[#fa7517]/30
                        focus:outline-none focus:ring-1 focus:ring-[#fa7517]/30
                        transition-all duration-300"
                    />
                    
                    {customUsername && (
                      <div className="text-sm text-gray-400 animate-in fade-in duration-200">
                        Username requirements:
                        <ul className="mt-1 space-y-1">
                          <li className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              customUsername.length >= 4 && customUsername.length <= 20
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`} />
                            4-20 characters long
                          </li>
                          <li className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              /^[a-zA-Z0-9]/.test(customUsername)
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`} />
                            Must start with a letter or number
                          </li>
                          <li className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              /^[a-zA-Z0-9][a-zA-Z0-9_]*$/.test(customUsername)
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`} />
                            Can contain letters, numbers, and underscores
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#09090B] text-gray-400">OR</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fa7517] to-orange-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-white">AI Generated Names</h3>
                    {refreshCount > 0 && (
                      <p className="text-xs text-gray-400">
                        {maxRefreshes - refreshCount} refreshes remaining
                      </p>
                    )}
                  </div>
                </div>
                
                <motion.button
                  onClick={refreshSuggestions}
                  className={`text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoadingSuggestions || refreshCount >= maxRefreshes}
                  title={
                    refreshCount >= maxRefreshes 
                      ? 'Maximum refreshes reached'
                      : 'Generate new names'
                  }
                >
                  <RefreshCw 
                    size={20} 
                    className={`transition-all duration-300 ${
                      isLoadingSuggestions ? 'animate-spin opacity-50' : ''
                    }`}
                  />
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence mode="wait">
                  {isLoadingSuggestions ? (
                    [...Array(suggestions.length || 6)].map((_, index) => (
                      <motion.div
                        key={`skeleton-${index}`}
                        className="bg-white/5 animate-pulse h-14 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      />
                    ))
                  ) : (
                    suggestions.map((name) => (
                      <motion.button
                        key={name}
                        onClick={() => {
                          setSelectedUsername(name);
                          setCustomUsername('');
                        }}
                        className={`relative group/item overflow-hidden ${
                          selectedUsername === name
                            ? 'bg-gradient-to-r from-[#fa7517]/20 to-[#ff8c3a]/20 border-[#fa7517]'
                            : 'bg-black/30 border-white/10 hover:border-[#fa7517]/50'
                        } p-4 rounded-lg border transition-all duration-300`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className={`absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 ${
                          selectedUsername === name
                            ? 'bg-gradient-to-r from-[#fa7517]/10 to-[#ff8c3a]/10'
                            : 'bg-gradient-to-r from-[#fa7517]/5 to-transparent'
                        }`} />
                        <div className={`absolute inset-0 rounded-lg transition-all duration-500 ${
                          selectedUsername === name
                            ? 'border-2 border-[#fa7517] shadow-[inset_0_0_15px_rgba(250,117,23,0.15)]'
                            : 'border border-transparent group-hover/item:border-[#fa7517]/30'
                        }`} />
                        <div className={`relative z-10 flex items-center justify-between ${
                          selectedUsername === name ? 'text-[#fa7517]' : 'text-white'
                        }`}>
                          <span className="text-base font-medium">{name}</span>
                          
                          {selectedUsername === name && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-[#fa7517]"
                            />
                          )}
                        </div>
                        <div className="absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500
                          bg-gradient-to-r from-transparent via-white/5 to-transparent
                          -translate-x-full group-hover/item:translate-x-full transform
                          duration-1000 ease-in-out" />
                      </motion.button>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={handleComplete}
                disabled={(!customUsername && !selectedUsername) || !isValid || isUpdating}
                className={`relative group w-full overflow-hidden ${
                  (!customUsername && !selectedUsername) || !isValid || isUpdating
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] rounded-lg opacity-75 group-hover:opacity-100 blur transition-all duration-500" />
                <div className={`relative p-4 rounded-lg ${
                  (!customUsername && !selectedUsername) || !isValid || isUpdating
                    ? 'bg-gray-500'
                    : 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a]'
                } text-black font-medium text-lg transition-all duration-300`}>
                  {isUpdating ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Setting up your profile...</span>
                    </div>
                  ) : (
                    'Continue to Base.Tube'
                  )}
                </div>
              </motion.button>
            </div>
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
  delay?: number;
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