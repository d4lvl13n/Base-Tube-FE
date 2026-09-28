import {
  cleanStudioAuthUrl,
  readStudioAuthOrigin,
  setStudioAuthConsent,
  startStudioAuth,
  STUDIO_AUTH_ORIGIN_KEY,
  STUDIO_AUTH_ORIGIN_TTL_MS,
  touchStudioAuthOrigin,
} from '../studioAuth';
import { SAVE_STUDIO_DRAFT_EVENT } from '../studioDraft';

beforeEach(() => sessionStorage.clear());

describe('origin marker', () => {
  it('remembers the AI Thumbnails page an entry was used on, saves the brief on screen, and keeps only allowed pages', () => {
    const saved = jest.fn();
    window.addEventListener(SAVE_STUDIO_DRAFT_EVENT, saved);
    startStudioAuth('sign-in', '/ai-thumbnails/projects/project-1?source=image&redirect_url=https://outside.example', undefined, 1000);
    window.removeEventListener(SAVE_STUDIO_DRAFT_EVENT, saved);
    expect(saved).toHaveBeenCalledTimes(1);
    expect(readStudioAuthOrigin(1000)).toEqual({ destination: '/ai-thumbnails/projects/project-1?source=image', intent: 'sign-in', startedAt: 1000 });
    for (const from of ['/creator-hub', 'https://outside.example', '/ai-thumbnails/sign-up']) {
      startStudioAuth('sign-up', from, true, 1000);
      expect(readStudioAuthOrigin(1000)).toEqual({ destination: '/ai-thumbnails/generate', intent: 'sign-up', consent: true, startedAt: 1000 });
    }
  });

  it('stays valid while the auth screens are shown, expires 30 minutes after the last one, and rejects a tampered destination', () => {
    startStudioAuth('sign-in', '/ai-thumbnails/gallery', undefined, 1000);
    // Clerk's steps reload the page: each keeps the destination and becomes the intent.
    touchStudioAuthOrigin('sign-up', 1000 + STUDIO_AUTH_ORIGIN_TTL_MS);
    setStudioAuthConsent(true, 1000 + STUDIO_AUTH_ORIGIN_TTL_MS);
    expect(readStudioAuthOrigin(1000 + 2 * STUDIO_AUTH_ORIGIN_TTL_MS)).toEqual({ destination: '/ai-thumbnails/gallery', intent: 'sign-up', consent: true, startedAt: 1000 + STUDIO_AUTH_ORIGIN_TTL_MS });
    expect(readStudioAuthOrigin(1001 + 2 * STUDIO_AUTH_ORIGIN_TTL_MS)).toBeNull();
    expect(sessionStorage.getItem(STUDIO_AUTH_ORIGIN_KEY)).toBeNull();
    // A page opened without an entry (a bookmark, a new tab) gets the default destination.
    expect(touchStudioAuthOrigin('sign-in', 5000)).toEqual({ destination: '/ai-thumbnails/generate', intent: 'sign-in', startedAt: 5000 });
    sessionStorage.setItem(STUDIO_AUTH_ORIGIN_KEY, JSON.stringify({ destination: '/onboarding', intent: 'sign-up', startedAt: 5000 }));
    expect(readStudioAuthOrigin(5000)).toBeNull();
  });
});

describe('Clerk redirect parameters on the AI Thumbnails pages', () => {
  const continueUrl = `${window.location.origin}/ai-thumbnails/auth/continue`;
  it('drops any that is not the continue address, in the query and in a Clerk hash route, and keeps Clerk\'s own', () => {
    expect(cleanStudioAuthUrl(
      `?__clerk_status=verified&sign_up_force_redirect_url=%2Fonboarding&redirect_url=%2F&sign_in_force_redirect_url=${encodeURIComponent(continueUrl)}`,
      '#/sso-callback?sign_up_force_redirect_url=%2Fonboarding&after_sign_up_url=%2Fcreator-hub',
    )).toEqual({
      search: `?__clerk_status=verified&sign_in_force_redirect_url=${encodeURIComponent(continueUrl)}`,
      hash: '#/sso-callback',
    });
    expect(cleanStudioAuthUrl('?sign_up_force_redirect_url=https%3A%2F%2Foutside.example%2Fai-thumbnails%2Fauth%2Fcontinue', '')).toEqual({ search: '', hash: '' });
  });
  it('leaves a clean URL alone (no navigation)', () => {
    expect(cleanStudioAuthUrl(`?sign_up_force_redirect_url=${encodeURIComponent(continueUrl)}`, '#/continue')).toBeNull();
    expect(cleanStudioAuthUrl('', '')).toBeNull();
  });
});
