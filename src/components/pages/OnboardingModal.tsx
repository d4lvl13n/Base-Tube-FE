import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingModalUI } from './OnboardingModal/OnboardingModalUI';

const OnboardingModal: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [userPath, setUserPath] = useState<'creator' | 'collector' | null>(null);
  const navigate = useNavigate();

  const handleSelectPath = (path: 'creator' | 'collector') => {
    setUserPath(path);
    // Store user preference
    localStorage.setItem('userPath', path);
  };

  const handleNext = () => {
    if (currentScreen === 1 && !userPath) return;
    
    if (currentScreen < 4) {
      setCurrentScreen(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem('onboardingComplete', 'true');
    
    // Navigate based on user path
    if (userPath === 'creator') {
      navigate('/creator-hub');
    } else {
      navigate('/');
    }
  };

  return (
    <OnboardingModalUI
      currentScreen={currentScreen}
      userPath={userPath}
      onSelectPath={handleSelectPath}
      onNext={handleNext}
      onBack={handleBack}
      onComplete={handleComplete}
    />
  );
};

export default OnboardingModal; 