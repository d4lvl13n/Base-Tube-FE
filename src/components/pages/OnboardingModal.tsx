import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Wallet, 
  ArrowRight,
  ArrowLeft,
  Rocket
} from 'lucide-react';

interface OnboardingSlide {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const OnboardingModal: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleComplete = () => {
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/creator-hub');
  };

  const slides: OnboardingSlide[] = [
    {
      title: "Welcome to Base.Tube Beta!",
      description: "You're now part of an exclusive community helping shape the future of decentralized content. Thank you for joining us in this journey!",
      icon: <Rocket className="w-12 h-12" />,
      color: "from-[#fa7517] to-orange-400"
    },
    {
      title: "Own Your Content",
      description: "Create, upload, and truly own your content with NFT Content Pass. Your creativity, your rules.",
      icon: <Video className="w-12 h-12" />,
      color: "from-blue-500 to-purple-500"
    },
    {
      title: "Earn While Creating",
      description: "Get rewarded in $TUBE tokens for your contributions and engagement within the platform.",
      icon: <Wallet className="w-12 h-12" />,
      color: "from-green-500 to-emerald-400"
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-900 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-800/30"
        >
          {/* Slides */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="text-center space-y-6">
                  {/* Icon */}
                  <div className={`
                    inline-flex p-4 rounded-2xl bg-gradient-to-r ${slides[currentSlide].color}
                    shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-300
                  `}>
                    {slides[currentSlide].icon}
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-white">
                      {slides[currentSlide].title}
                    </h2>
                    <p className="text-gray-400 text-lg max-w-md mx-auto">
                      {slides[currentSlide].description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="p-6 bg-black/30 border-t border-gray-800/30 flex items-center justify-between">
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index 
                      ? 'bg-[#fa7517] w-8' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-4">
              {currentSlide > 0 && (
                <button
                  onClick={() => setCurrentSlide(prev => prev - 1)}
                  className="px-4 py-2 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              {currentSlide < slides.length - 1 ? (
                <button
                  onClick={() => setCurrentSlide(prev => prev + 1)}
                  className="px-6 py-2 flex items-center gap-2 bg-[#fa7517] text-black rounded-xl hover:bg-[#fa7517]/90 transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 flex items-center gap-2 bg-gradient-to-r from-[#fa7517] to-orange-400 text-black rounded-xl hover:from-orange-400 hover:to-[#fa7517] transition-all duration-300 font-medium"
                >
                  Get Started
                  <Rocket className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal; 