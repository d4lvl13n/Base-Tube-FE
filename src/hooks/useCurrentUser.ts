import { useUser, useSession } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../api/profile';
import { UserProfile } from '../types/user';
import { queryKeys } from '../utils/queryKeys';

export const useCurrentUser = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { session } = useSession();

  // Only fetch profile when user is signed in and Clerk is loaded
  const profileQuery = useQuery({
    queryKey: queryKeys.user.profile(user?.id),
    queryFn: async () => {
      const profileData = await getMyProfile();
      return profileData;
    },
    enabled: isSignedIn && isLoaded && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - profile data changes occasionally  
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 (auth issues)
      if (error?.status === 401 || error?.status === 403 || 
          error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return { 
    user, 
    isSignedIn, 
    isLoaded, 
    profile: profileQuery.data,
    profileLoading: profileQuery.isLoading,
    profileError: profileQuery.error,
    session 
  };
};
