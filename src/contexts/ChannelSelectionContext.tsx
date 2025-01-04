import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useQuery } from '@tanstack/react-query';
import { getMyChannels } from '../api/channel';
import type { Channel, ChannelQueryOptions } from '../types/channel';

interface ChannelSelectionContextType {
  selectedChannelId: string;
  setSelectedChannelId: (id: string) => void;
  channels: Channel[];
  selectedChannel: Channel | undefined;
  isLoading: boolean;
}

const ChannelSelectionContext = createContext<ChannelSelectionContextType | undefined>(undefined);

export const ChannelSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedChannelId, setSelectedChannelId] = useLocalStorage<string>('selectedChannelId', '');
  
  const queryOptions: ChannelQueryOptions = {
    page: 1,
    limit: 10,
    sort: 'createdAt'
  };

  const {
    data: channels = [],
    isLoading
  } = useQuery({
    queryKey: ['myChannels', queryOptions],
    queryFn: () => getMyChannels(queryOptions),
    staleTime: 5 * 60 * 1000
  });

  // Set initial channel if none selected and validate existing selection
  useEffect(() => {
    if (channels.length > 0) {
      // If no channel is selected or the selected channel is not in the list
      const isValidSelection = channels.some(
        channel => channel.id.toString() === selectedChannelId
      );
      
      if (!selectedChannelId || !isValidSelection) {
        setSelectedChannelId(channels[0].id.toString());
      }
    }
  }, [channels, selectedChannelId, setSelectedChannelId]);

  // Ensure selectedChannel is always valid
  const selectedChannel = React.useMemo(() => 
    channels.find((channel: Channel) => channel.id.toString() === selectedChannelId),
    [channels, selectedChannelId]
  );

  // Validate channel ID before setting
  const setValidatedChannelId = (id: string) => {
    if (channels.some(channel => channel.id.toString() === id)) {
      setSelectedChannelId(id);
    } else {
      console.warn('Attempted to set invalid channel ID');
    }
  };

  return (
    <ChannelSelectionContext.Provider 
      value={{
        selectedChannelId,
        setSelectedChannelId: setValidatedChannelId, // Use validated setter
        channels,
        selectedChannel,
        isLoading
      }}
    >
      {children}
    </ChannelSelectionContext.Provider>
  );
};

export const useChannelSelection = () => {
  const context = useContext(ChannelSelectionContext);
  if (context === undefined) {
    throw new Error('useChannelSelection must be used within a ChannelSelectionProvider');
  }
  return context;
}; 