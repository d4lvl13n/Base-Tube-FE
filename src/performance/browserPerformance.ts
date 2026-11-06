import type { Metric } from 'web-vitals';
import reportWebVitals from '../reportWebVitals';
import { trackEvent } from '../utils/analytics';

export type ContentReadyName = 'home_content_ready' | 'channel_content_ready' | 'video_content_ready' | 'studio_projects_ready' | 'studio_editor_ready';
type RouteGroup = 'home' | 'channel' | 'video' | 'studio_projects' | 'studio_project' | 'studio' | 'creator' | 'pass' | 'auth' | 'other';
const MAX_READY_MS = 10 * 60 * 1000;

/** Fixed categories only: never publish paths, handles, account IDs or query strings. */
export function performanceRouteGroup(pathname: string): RouteGroup {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/v2') return 'home';
  if (/^\/channel\/[^/]+$/.test(path)) return 'channel';
  if (/^\/video\/[^/]+$/.test(path)) return 'video';
  if (path === '/ai-thumbnails/projects') return 'studio_projects';
  if (/^\/ai-thumbnails\/projects\/[^/]+$/.test(path)) return 'studio_project';
  if (/^\/(?:ai-thumbnails\/)?(?:sign-in|sign-up)(?:\/|$)/.test(path)) return 'auth';
  if (path.startsWith('/ai-thumbnails')) return 'studio';
  if (path.startsWith('/creator-hub')) return 'creator';
  if (/^\/(?:p|watch)\//.test(path)) return 'pass';
  return 'other';
}

function emit(name: string, values: Record<string, string | number | boolean>) {
  // Same destination as the existing app analytics. No new collector or consent path.
  if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined' || window.location.hostname !== 'beta.base.tube') return;
  try { trackEvent(name, { ...values, non_interaction: true }); } catch { /* Optional analytics. */ }
}

export function createReadinessTracker(now: () => number, send: (name: ContentReadyName, elapsed: number, route: RouteGroup) => void) {
  let navigation: { key: string; start: number; route: RouteGroup; sent: Set<ContentReadyName> } | undefined;
  return {
    enter(key: string, pathname: string) {
      if (navigation?.key === key) return;
      navigation = { key, start: navigation ? now() : 0, route: performanceRouteGroup(pathname), sent: new Set() };
    },
    ready(key: string, name: ContentReadyName) {
      if (!navigation || navigation.key !== key || navigation.sent.has(name)) return;
      const elapsed = now() - navigation.start;
      if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > MAX_READY_MS) return;
      navigation.sent.add(name);
      try { send(name, Math.round(elapsed), navigation.route); } catch { /* Rendering never depends on telemetry. */ }
    },
  };
}

const readiness = createReadinessTracker(
  () => performance.now(),
  (name, elapsed, route) => {
    // Local lab measurements work without GA. Names contain no identifying data.
    try { performance.measure(`basetube:${name}`, { start: Math.max(0, performance.now() - elapsed), duration: elapsed }); } catch { /* Older browser. */ }
    emit('content_ready', { metric_name: name, value: elapsed, route_group: route });
  },
);
export const enterPerformanceRoute = readiness.enter;
export const recordContentReady = readiness.ready;

const vitalNames = new Set(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']);
let documentRoute: RouteGroup = 'other';
export function browserMetricFields(metric: Metric, route: RouteGroup) {
  if (!vitalNames.has(metric.name) || !Number.isFinite(metric.value) || metric.value < 0) return;
  const rating = ['good', 'needs-improvement', 'poor'].includes(metric.rating) ? metric.rating : 'unknown';
  return {
    metric_name: metric.name,
    value: metric.name === 'CLS' ? Math.round(metric.value * 10000) / 10000 : Math.round(metric.value),
    rating,
    route_group: route,
  };
}

export function reportBrowserMetric(metric: Metric) {
  const fields = browserMetricFields(metric, documentRoute);
  if (fields) emit('web_vital', fields);
}

let started = false;
export function startBrowserPerformance() {
  if (started || typeof window === 'undefined') return;
  started = true;
  documentRoute = performanceRouteGroup(window.location.pathname);
  reportWebVitals(reportBrowserMetric);
}
