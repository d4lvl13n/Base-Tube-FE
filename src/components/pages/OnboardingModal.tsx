import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { OnboardingModalUI } from './OnboardingModal/OnboardingModalUI';
import { useApplyReferralCode } from '../../hooks/useProfileData';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from '../../utils/referralAttribution';

const OnboardingModal: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [userPath, setUserPath] = useState<'creator' | 'collector' | null>(null);
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const applyReferral = useApplyReferralCode();
  const attemptedCodeRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const pendingCode = getPendingReferralCode();
    if (!pendingCode || attemptedCodeRef.current === pendingCode || applyReferral.isPending) {
      return;
    }

    attemptedCodeRef.current = pendingCode;

    applyReferral.mutate(pendingCode, {
      onSuccess: () => {
        clearPendingReferralCode();
        attemptedCodeRef.current = null;
      },
      onError: (error) => {
        const message = error.message.toLowerCase();
        if (
          message.includes('already applied') ||
          message.includes('not found') ||
          message.includes('self-referral') ||
          message.includes('self referral')
        ) {
          clearPendingReferralCode();
        }
      },
    });
  }, [applyReferral, isLoaded, isSignedIn]);

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
