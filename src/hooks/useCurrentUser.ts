import { useUser, useSession } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { getMyProfile } from '../api/profile';
import { UserProfile } from '../types/user';

export const useCurrentUser = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      getMyProfile()
        .then(profileData => setProfile(profileData))
        .catch(console.error);
    }
  }, [isSignedIn]);

  return { user, isSignedIn, isLoaded, profile, session };
};
