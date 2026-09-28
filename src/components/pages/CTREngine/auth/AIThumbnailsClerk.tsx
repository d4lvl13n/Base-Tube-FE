import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { STUDIO_AUTH_CONTINUE_PATH, STUDIO_SIGN_IN_PATH, STUDIO_SIGN_UP_PATH } from '../../../../utils/studioAuth';

type ClerkAppearance = React.ComponentProps<typeof SignUp>['appearance'];

/**
 * AI Thumbnails' look for Clerk's sign-in and sign-up (adapted from base.tube's
 * sign-up look): dark panel, #fa7517 accent, compact. `withSocialButtons:
 * false` hides Clerk's Google and Discord buttons (the gate hands them off to
 * the full page, see EmailGateModal).
 */
export function aiThumbnailsClerkAppearance({ withSocialButtons = true }: { withSocialButtons?: boolean } = {}): ClerkAppearance {
  return {
    baseTheme: dark,
    variables: {
      colorPrimary: '#fa7517',
      colorBackground: '#111113',
      colorText: '#f4f4f5',
      colorTextSecondary: '#a1a1aa',
      colorInputBackground: '#18181b',
      colorInputText: '#ffffff',
      borderRadius: '0.75rem',
    },
    elements: {
      rootBox: 'w-full',
      cardBox: 'w-full max-w-none shadow-none',
      card: 'w-full max-w-none bg-[#111113] border border-white/10 shadow-none rounded-2xl',
      headerTitle: 'text-lg font-semibold',
      headerSubtitle: 'text-zinc-400',
      socialButtonsBlockButton: 'border-white/10 bg-[#18181b] hover:bg-[#1f1f23] transition-colors',
      formButtonPrimary: 'bg-[#fa7517] hover:bg-[#fa7517]/90 shadow-none transition-colors',
      formFieldInput: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        '&:focus': { borderColor: '#fa7517', boxShadow: '0 0 0 2px rgba(250, 117, 23, 0.2)' },
      },
      footerActionLink: 'text-[#fa7517] hover:text-orange-400',
      ...(withSocialButtons ? {} : { socialButtons: { display: 'none' }, dividerRow: { display: 'none' } }),
    },
  };
}

interface AIThumbnailsClerkProps {
  /** `path`: the full page (Clerk's steps are sub-paths of it); `virtual`: in place, in the gate. */
  routing: 'path' | 'virtual';
  withSocialButtons?: boolean;
}

/**
 * Clerk's sign-in for AI Thumbnails. Every way out of it (an existing account,
 * a new Google or Discord account, its "Sign up" link) stays in AI Thumbnails
 * and ends on the one constant continue address; nothing here depends on the
 * page URL.
 */
export function AIThumbnailsSignIn({ routing, withSocialButtons = true }: AIThumbnailsClerkProps) {
  const common = {
    signUpUrl: STUDIO_SIGN_UP_PATH,
    forceRedirectUrl: STUDIO_AUTH_CONTINUE_PATH,
    signUpForceRedirectUrl: STUDIO_AUTH_CONTINUE_PATH,
    appearance: aiThumbnailsClerkAppearance({ withSocialButtons }),
  };
  return routing === 'path'
    ? <SignIn routing="path" path={STUDIO_SIGN_IN_PATH} {...common} />
    : <SignIn routing="virtual" {...common} />;
}

/** Clerk's sign-up for AI Thumbnails: same rules as `AIThumbnailsSignIn`. */
export function AIThumbnailsSignUp({ routing, withSocialButtons = true }: AIThumbnailsClerkProps) {
  const common = {
    signInUrl: STUDIO_SIGN_IN_PATH,
    forceRedirectUrl: STUDIO_AUTH_CONTINUE_PATH,
    signInForceRedirectUrl: STUDIO_AUTH_CONTINUE_PATH,
    appearance: aiThumbnailsClerkAppearance({ withSocialButtons }),
  };
  return routing === 'path'
    ? <SignUp routing="path" path={STUDIO_SIGN_UP_PATH} {...common} />
    : <SignUp routing="virtual" {...common} />;
}
