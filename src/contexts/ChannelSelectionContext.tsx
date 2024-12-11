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

  // Set initial channel if none selected
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id.toString());
    }
  }, [channels, selectedChannelId, setSelectedChannelId]);

  const selectedChannel = channels.find(
    (channel: Channel) => channel.id.toString() === selectedChannelId
  );

  return (
    <ChannelSelectionContext.Provider 
      value={{
        selectedChannelId,
        setSelectedChannelId,
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