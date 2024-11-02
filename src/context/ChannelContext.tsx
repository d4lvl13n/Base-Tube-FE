// src/context/ChannelContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyChannels } from '../api/channel';
import { Channel } from '../types/channel';

interface ChannelContextProps {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  refreshChannels: () => void;
}

const ChannelContext = createContext<ChannelContextProps | undefined>(undefined);

export const ChannelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState<boolean>(false);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const fetchedChannels = await getMyChannels();
      setChannels(fetchedChannels);
      setError(null);
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError('Failed to load your channels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [refreshToggle]);

  const refreshChannels = () => {
    setRefreshToggle((prev) => !prev);
  };

  return (
    <ChannelContext.Provider value={{ channels, loading, error, refreshChannels }}>
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