// src/context/ChannelContext.tsx
import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { getMyChannels } from '../api/channel';
import { Channel } from '../types/channel';

interface ChannelContextProps {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  refreshChannels: () => void;
}

const ChannelContext = createContext<ChannelContextProps | undefined>(undefined);

const shouldFetchChannels = (pathname: string, isSignedIn: boolean | undefined): boolean => {
  const protectedPaths = [
    '/creator-hub',
    '/channel',
    '/profile',
    '/subscribed'
  ];
  
  return Boolean(isSignedIn && protectedPaths.some(path => pathname.startsWith(path)));
};

export const ChannelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn } = useUser();
  const { pathname } = useLocation();
  
  const { 
    data: channels = [], 
    isLoading: loading,
    error: queryError,
    refetch: refreshChannels
  } = useQuery({
    queryKey: ['myChannels'],
    queryFn: () => getMyChannels(),
    enabled: shouldFetchChannels(pathname, isSignedIn),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: 2
  });

  const error = queryError instanceof Error ? queryError.message : 
                typeof queryError === 'string' ? queryError : 
                'Failed to load your channels.';

  return (
    <ChannelContext.Provider value={{ 
      channels, 
      loading, 
      error, 
      refreshChannels 
    }}>
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannels = (): ChannelContextProps => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannels must be used within a ChannelProvider');
  }
  return context;
};