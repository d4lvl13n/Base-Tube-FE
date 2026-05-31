import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSSO } from '@clerk/clerk-expo';

// Required for the OAuth redirect to dismiss the in-app browser on native.
WebBrowser.maybeCompleteAuthSession();

/** Warms up the native in-app browser so the OAuth sheet opens instantly. */
function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

/**
 * Google OAuth via Clerk. On native, opens the in-app browser and returns to a
 * deep link; on web, Clerk performs a standard redirect. On success the session
 * is activated and the root auth guard routes into the app.
 *
 * Uses `useSSO` (the clerk-expo 2.x API; `useOAuth` is deprecated). The redirect
 * (`basetube://…`, from the app's scheme) must be on the Clerk instance's
 * mobile-SSO allowlist and the iOS app registered under Native Applications.
 */
export function useGoogleOAuth() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const redirectUrl = Linking.createURL('/(app)');
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.message ?? e?.message ?? 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }, [startSSOFlow]);

  return { signInWithGoogle, busy, error };
}
