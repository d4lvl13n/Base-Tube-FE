import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import web3AuthApi from '../api/web3authapi';

export const MAX_SUGGESTIONS = 6; // or 8 for a 2x4 grid
export const MAX_REFRESHES = 5;
export const REFRESH_DELAY = 1000; // 1 second delay

export const useGeneratedName = (options: { enabled?: boolean } = {}) => {
  const { enabled = false } = options;
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [customUsername, setCustomUsername] = useState<string>('');
  const lastRefreshTime = useRef<number>(0);

  // Fetch username suggestions
  const {
    data: suggestions,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
    refetch: refetchSuggestions
  } = useQuery({
    queryKey: ['usernameSuggestions'],
    queryFn: () => web3AuthApi.getUsernameSuggestions(),
    staleTime: 0, // Don't cache suggestions
    retry: 2,
    enabled,
    select: (data) => ({
      ...data,
      suggestions: data.suggestions.slice(0, MAX_SUGGESTIONS)
    })
  });

  const refreshSuggestions = async () => {
    const now = Date.now();
    if (
      refreshCount >= MAX_REFRESHES || 
      now - lastRefreshTime.current < REFRESH_DELAY
    ) {
      return;
    }

    lastRefreshTime.current = now;
    setRefreshCount(prev => prev + 1);
    await refetchSuggestions();
  };

  // Update username mutation
  const {
    mutate: updateUsername,
    isPending: isUpdating,
    error: updateError
  } = useMutation({
    mutationFn: (username: string) => {
      console.log('Updating username via API:', username);
      return web3AuthApi.updateUsername(username);
    },
    onSuccess: (data) => {
      console.log('Username update API response:', data);
      
      // Update both localStorage values to keep them in sync
      localStorage.setItem('wallet_username', data.username);
      
      // Update the auth_user object with the new username
      const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      authUser.username = data.username;
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      
      // Trigger UI updates
      window.dispatchEvent(new Event('wallet:update'));
    }
  });

  const validateUsername = (username: string): boolean => {
    if (!username) return false;
    const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_]{3,19}$/;
    return usernameRegex.test(username);
  };

  const isValid = Boolean(
    (customUsername && validateUsername(customUsername)) ||
    (selectedUsername && validateUsername(selectedUsername))
  );

  return {
    refreshCount,
    maxRefreshes: MAX_REFRESHES,
    suggestions: suggestions?.suggestions.slice(0, MAX_SUGGESTIONS) || [],
    selectedUsername,
    customUsername,
    isValid,
    isLoadingSuggestions,
    isUpdating,
    suggestionsError,
    updateError,
    setSelectedUsername,
    setCustomUsername,
    updateUsername,
    refreshSuggestions,
    validateUsername
  };
}; 