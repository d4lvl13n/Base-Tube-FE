import { useUser } from "@clerk/clerk-react";
import { AuthMethod } from "../types/auth";
import { useAuth } from "../contexts/AuthContext";

export interface StudioAccountState {
  /** `clerk:<id>`, `web3:<id>` or `anonymous`. */
  account: string;
  /** False while the account is still loading (Clerk, or a stored wallet session being restored). */
  resolved: boolean;
  /** The Clerk account's primary email address. Wallet sessions carry no email. */
  email: string | null;
  /** When the Clerk account was created (ms); null for wallet sessions and signed-out visitors. */
  createdAt?: number | null;
}

export function useStudioAccountState(): StudioAccountState {
  const { user, isSignedIn, isLoaded } = useUser();
  const { user: web3User, isAuthenticated, isRestoring } = useAuth();
  const method = localStorage.getItem("auth_method");
  if (method === AuthMethod.WEB3)
    return {
      account: isAuthenticated && web3User ? `web3:${web3User.id}` : "anonymous",
      resolved: !isRestoring && (!isAuthenticated || Boolean(web3User)),
      email: null,
      createdAt: null,
    };
  return {
    account: isSignedIn && user ? `clerk:${user.id}` : "anonymous",
    resolved: isLoaded === true && (!isSignedIn || Boolean(user)),
    email: isSignedIn && user ? user.primaryEmailAddress?.emailAddress ?? null : null,
    createdAt: isSignedIn && user?.createdAt ? new Date(user.createdAt).getTime() : null,
  };
}

/** Private Studio cache and recovery records never cross signed-in accounts. */
export function useStudioAccount(): string {
  return useStudioAccountState().account;
}
