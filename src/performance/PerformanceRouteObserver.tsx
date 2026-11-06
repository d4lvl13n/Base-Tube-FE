import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { enterPerformanceRoute } from './browserPerformance';

/** Mounted above authentication; layout effects precede page readiness effects. */
export function PerformanceRouteObserver() {
  const location = useLocation();
  useLayoutEffect(() => { enterPerformanceRoute(location.key, location.pathname); }, [location.key, location.pathname]);
  return null;
}
