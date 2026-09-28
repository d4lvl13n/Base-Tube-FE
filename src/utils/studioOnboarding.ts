import { onboardingApi } from '../api/onboarding';
import type { User } from '../types/auth';
import { noteStudioWelcome } from './studioWelcome';

/**
 * Sign-ups from AI Thumbnails skip base.tube's general onboarding (owner
 * decision, 28 September 2026): the AI Thumbnails sign-in and sign-up pages
 * and the gate end on `/ai-thumbnails/auth/continue` (utils/studioAuth), which
 * goes straight back to the AI Thumbnails page they started from, where a
 * small welcome card replaces the onboarding screens (utils/studioWelcome).
 * base.tube's own `/sign-up`, `/sign-in-web3`, `/onboarding` and
 * `/onboarding/web3` are unchanged.
 */

const completing = new Map<string, Promise<void>>();
/**
 * A wallet account still PENDING that signs in from AI Thumbnails: its
 * onboarding is completed without the screens (POST
 * /web3auth/onboarding/complete), once per account at a time. Never throws: on
 * failure the account stays PENDING (it can complete later on /onboarding/web3)
 * and the error is logged.
 */
export function completeWalletOnboardingQuietly(user: User, setUser: (user: User) => void): Promise<void> {
  const key = String(user.id);
  const running = completing.get(key);
  if (running) return running;
  noteStudioWelcome(`web3:${user.id}`);
  const request = onboardingApi.completeOnboarding()
    .then(({ user: updated }) => {
      setUser({ ...user, ...updated, onboarding_status: 'COMPLETED' });
    })
    .catch(error => {
      console.error('[AI Thumbnails] The wallet account onboarding could not be completed; the account can complete it later.', error);
    })
    .finally(() => {
      completing.delete(key);
    });
  completing.set(key, request);
  return request;
}

/**
 * A wallet sign-in from AI Thumbnails reached the continue screen: `go` to its
 * destination, after completing a PENDING account's onboarding quietly (and
 * even when that fails). Returns the effect cleanup.
 */
export function finishStudioWalletSignIn(user: User, setUser: (user: User) => void, go: () => void): () => void {
  if (user.onboarding_status !== 'PENDING') {
    go();
    return () => undefined;
  }
  let cancelled = false;
  void completeWalletOnboardingQuietly(user, setUser).then(() => {
    if (!cancelled) go();
  });
  return () => {
    cancelled = true;
  };
}

/** Tests only. */
export function resetStudioOnboardingForTests() {
  completing.clear();
}
