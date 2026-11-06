import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ContentReadyName, recordContentReady } from './browserPerformance';

export function useContentReady(name: ContentReadyName, ready: boolean) {
  const { key } = useLocation();
  useEffect(() => { if (ready) recordContentReady(key, name); }, [key, name, ready]);
}
