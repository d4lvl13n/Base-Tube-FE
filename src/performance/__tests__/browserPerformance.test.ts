import { browserMetricFields, createReadinessTracker, performanceRouteGroup, reportBrowserMetric, startBrowserPerformance } from '../browserPerformance';
import reportWebVitals from '../../reportWebVitals';
import { trackEvent } from '../../utils/analytics';

jest.mock('../../reportWebVitals', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../utils/analytics', () => ({ trackEvent: jest.fn() }));

test('cold readiness includes startup; later visits start at navigation and ignore stale completions', () => {
  let now = 1200;
  const send = jest.fn();
  const tracker = createReadinessTracker(() => now, send);
  tracker.enter('initial', '/channel/private-handle?token=secret');
  tracker.ready('initial', 'channel_content_ready');
  tracker.ready('initial', 'channel_content_ready');
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenLastCalledWith('channel_content_ready', 1200, 'channel');
  now = 3000;
  tracker.enter('next', '/video/123');
  now = 3200;
  tracker.ready('initial', 'channel_content_ready');
  tracker.ready('next', 'video_content_ready');
  expect(send).toHaveBeenCalledTimes(2);
  expect(send).toHaveBeenLastCalledWith('video_content_ready', 200, 'video');
  // Going back is a fresh visit even when React Router reuses its history key.
  tracker.enter('initial', '/channel/private-handle');
  now = 3300;
  tracker.ready('initial', 'channel_content_ready');
  expect(send).toHaveBeenLastCalledWith('channel_content_ready', 100, 'channel');
});

test('unknown routes and private identifiers never appear in route labels', () => {
  expect(performanceRouteGroup('/ai-thumbnails/projects/secret-id?email=a@b.com')).toBe('studio_project');
  expect(performanceRouteGroup('/ai-thumbnails/projects')).toBe('studio_projects');
  expect(performanceRouteGroup('/something/private')).toBe('other');
  expect(performanceRouteGroup('/video/1')).toBe('video');
});

test('unbounded or broken clocks and telemetry errors cannot break rendering', () => {
  let now = Infinity;
  const send = jest.fn(() => { throw new Error('blocked analytics'); });
  const tracker = createReadinessTracker(() => now, send);
  tracker.enter('a', '/');
  tracker.ready('a', 'home_content_ready');
  expect(send).not.toHaveBeenCalled();
  now = 200;
  expect(() => tracker.ready('a', 'home_content_ready')).not.toThrow();
  expect(send).toHaveBeenCalledTimes(1);
});

test('collection is installed once and local visits do not send production analytics', () => {
  startBrowserPerformance();
  startBrowserPerformance();
  expect(reportWebVitals).toHaveBeenCalledTimes(1);
  reportBrowserMetric({ name: 'LCP', value: 1234, rating: 'good' } as Parameters<typeof reportBrowserMetric>[0]);
  expect(trackEvent).not.toHaveBeenCalled();
});


test('web vital payload contains only bounded metric fields, never DOM attribution or IDs', () => {
  const metric = { name: 'CLS', value: 0.012345, rating: 'good', id: 'secret-user-id', entries: [{ name: 'https://private.example/project?id=secret' }], attribution: { target: 'private@example.com' } };
  expect(browserMetricFields(metric as unknown as Parameters<typeof browserMetricFields>[0], 'studio_project')).toEqual({ metric_name: 'CLS', value: 0.0123, rating: 'good', route_group: 'studio_project' });
  expect(browserMetricFields({ ...metric, value: Infinity } as unknown as Parameters<typeof browserMetricFields>[0], 'other')).toBeUndefined();
});
