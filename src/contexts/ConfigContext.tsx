import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api';
import { ConfigResponse, DEFAULT_VIEW_CONFIG, ViewConfig } from '../types/config';

interface ConfigContextType {
  viewConfig: ViewConfig;
  isLoading: boolean;
  error: string | null;
  /** True while we are serving DEFAULT_VIEW_CONFIG because the fetch failed. */
  isFallback: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType>({
  viewConfig: DEFAULT_VIEW_CONFIG,
  isLoading: true,
  error: null,
  isFallback: true,
  refreshConfig: async () => {}
});

const CONFIG_CACHE_KEY = 'view_config_cache';
const CONFIG_CACHE_TTL = 1000 * 60 * 60; // 1 hour

/** Exponential backoff, capped. A config outage must not become a retry storm. */
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 60_000];

const isViewConfig = (value: unknown): value is ViewConfig => {
  const candidate = value as ViewConfig | undefined;
  return (
    !!candidate &&
    typeof candidate.updateInterval === 'number' &&
    !!candidate.thresholds &&
    typeof candidate.thresholds.percentage === 'number' &&
    typeof candidate.thresholds.seconds === 'number'
  );
};

const readCache = (): ViewConfig | null => {
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CONFIG_CACHE_TTL && isViewConfig(data)) {
      return data;
    }
    localStorage.removeItem(CONFIG_CACHE_KEY);
  } catch {
    /* corrupt cache is the same as no cache */
  }
  return null;
};

/**
 * View-tracking configuration.
 *
 * `viewConfig` is NEVER null. It used to be, and every consumer treated null as
 * "do not track": a single failed `GET /config/view-config` (a blip, an
 * ad-blocker, a cold start) silently switched view tracking off for the whole
 * session, with nothing in the UI to say so. Now a failure serves the
 * documented defaults and keeps retrying in the background.
 */
export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const cached = useRef<ViewConfig | null>(readCache());
  const [viewConfig, setViewConfig] = useState<ViewConfig>(cached.current ?? DEFAULT_VIEW_CONFIG);
  const [isFallback, setIsFallback] = useState(!cached.current);
  const [isLoading, setIsLoading] = useState(!cached.current);
  const [error, setError] = useState<string | null>(null);

  const attemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const fetchConfig = useCallback(async (): Promise<void> => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    try {
      setIsLoading(true);
      const response = await api.get<ConfigResponse>('/api/v1/config/view-config');
      const data = response.data?.data;

      if (!isViewConfig(data)) {
        throw new Error('Malformed view config payload');
      }

      if (!isMountedRef.current) return;

      attemptRef.current = 0;
      setViewConfig(data);
      setIsFallback(false);
      setError(null);

      try {
        localStorage.setItem(
          CONFIG_CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch {
        /* private mode / quota — the in-memory config is enough */
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('Config loading error, using defaults:', err);
      setError('Failed to load configuration');
      // Keep whatever we already serve (cache or defaults) rather than dropping
      // to null, then schedule another try.
      setViewConfig((current) => current ?? DEFAULT_VIEW_CONFIG);
      setIsFallback(true);

      const delay = RETRY_DELAYS_MS[Math.min(attemptRef.current, RETRY_DELAYS_MS.length - 1)];
      attemptRef.current += 1;
      retryTimerRef.current = setTimeout(() => {
        void fetchConfig();
      }, delay);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchConfig();

    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [fetchConfig]);

  return (
    <ConfigContext.Provider value={{
      viewConfig,
      isLoading,
      error,
      isFallback,
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
