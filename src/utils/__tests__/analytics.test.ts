import { ga4ClientId, trackEvent, trackSignUp } from '../analytics';

const gtag = jest.fn();
beforeEach(() => {
  gtag.mockReset();
  (window as any).gtag = gtag;
  sessionStorage.clear();
  document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

it('reads the GA4 client id from the _ga cookie, or null without a valid one', () => {
  expect(ga4ClientId()).toBeNull();
  document.cookie = '_ga=GA1.1.1234567890.1727712000; path=/';
  expect(ga4ClientId()).toBe('1234567890.1727712000');
  document.cookie = '_ga=garbage; path=/';
  expect(ga4ClientId()).toBeNull();
});

it('sends sign_up once per account, and nothing breaks when gtag is blocked', () => {
  trackSignUp('clerk:user_1', 'clerk');
  trackSignUp('clerk:user_1', 'clerk');
  expect(gtag).toHaveBeenCalledTimes(1);
  expect(gtag).toHaveBeenCalledWith('event', 'sign_up', { method: 'clerk', transport_type: 'beacon' });
  delete (window as any).gtag;
  expect(() => trackEvent('begin_checkout')).not.toThrow();
});
