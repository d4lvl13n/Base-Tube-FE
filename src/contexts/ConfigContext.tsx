import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';
import { ViewConfig, ConfigResponse } from '../types/config';

interface ConfigContextType {
  viewConfig: ViewConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType>({
  viewConfig: null,
  isLoading: true,
  error: null,
  refreshConfig: async () => {}
});

const CONFIG_CACHE_KEY = 'view_config_cache';
const CONFIG_CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [viewConfig, setViewConfig] = useState<ViewConfig | null>(() => {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CONFIG_CACHE_TTL) {
        return data;
      }
      localStorage.removeItem(CONFIG_CACHE_KEY);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!viewConfig);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<ConfigResponse>('/api/v1/config/view-config');
      setViewConfig(response.data.data);
      
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
        data: response.data.data,
        timestamp: Date.now()
      }));
      setError(null);
    } catch (err) {
      setError('Failed to load configuration');
      console.error('Config loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!viewConfig) {
      void fetchConfig();
    }
  }, [viewConfig]);

  return (
    <ConfigContext.Provider value={{ 
      viewConfig, 
      isLoading, 
      error,
      refreshConfig: fetchConfig 
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};