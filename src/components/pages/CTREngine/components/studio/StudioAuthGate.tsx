import React from "react";
import { StudioSpinner } from "./StudioControls";

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
      <p role="status" className="flex items-center gap-2 text-zinc-300">
        <StudioSpinner />
        Loading your account…
      </p>
    );
  return <>{signedOut}</>;
}
