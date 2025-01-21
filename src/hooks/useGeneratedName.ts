import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { web3AuthApi } from '../api/web3authapi';

const MAX_SUGGESTIONS = 6; // or 8 for a 2x4 grid

export const useGeneratedName = () => {
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [customUsername, setCustomUsername] = useState<string>('');

  // Fetch username suggestions
  const {
    data: suggestions,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
    refetch: refreshSuggestions
  } = useQuery({
    queryKey: ['usernameSuggestions'],
    queryFn: () => web3AuthApi.getUsernameSuggestions(),
    staleTime: 0, // Don't cache suggestions
    retry: 2,
    select: (data) => ({
      ...data,
      suggestions: data.suggestions.slice(0, MAX_SUGGESTIONS)
    })
  });

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

  // Validate custom username
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^0x_[a-zA-Z0-9_]{2,17}$/;
    return usernameRegex.test(username);
  };

  return {
    // Data
    suggestions: suggestions?.suggestions.slice(0, MAX_SUGGESTIONS) || [],
    selectedUsername,
    customUsername,
    isValid: validateUsername(customUsername || selectedUsername),

    // Loading states
    isLoadingSuggestions,
    isUpdating,

    // Errors
    suggestionsError,
    updateError,

    // Actions
    setSelectedUsername,
    setCustomUsername,
    updateUsername,
    refreshSuggestions,

    // Helpers
    validateUsername
  };
}; 