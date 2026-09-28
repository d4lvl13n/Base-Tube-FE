import React from "react";

/**
 * Private Studio pages: wait for the account (Clerk or wallet) to load before
 * deciding, so signed-in creators never see a sign-in prompt flash.
 */
export function StudioAuthGate({
  access,
  signedOut,
  children,
}: {
  access: { isAuthenticated: boolean; isAnonymous: boolean };
  signedOut: React.ReactNode;
  children: React.ReactNode;
}) {
  if (access.isAuthenticated) return <>{children}</>;
  if (!access.isAnonymous)
    return (
      <p role="status" className="text-zinc-300">
        Loading your account…
      </p>
    );
  return <>{signedOut}</>;
}
