# Wallet Linking Flow Issue: Web2 Users Creating Duplicate Accounts

## Problem Statement

When a Clerk-authenticated (Web2) user attempts to claim an NFT by connecting a wallet, the system incorrectly triggers a **Web3 sign-in flow** instead of **linking the wallet** to their existing account. This results in:

1. A new, separate Web3 user account being created
2. The original Clerk account becoming orphaned
3. Purchases made under Clerk auth not being accessible from the new Web3 account
4. User confusion and data fragmentation

---

## Current Flow (Broken)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT BROKEN FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

User (Clerk-authenticated) clicks "Connect Wallet to Claim"
                              │
                              ▼
              ┌───────────────────────────────┐
              │   openConnectModal()          │
              │   (RainbowKit wallet modal)   │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   User selects & connects     │
              │   wallet (e.g. MetaMask)      │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   useAccount() detects        │
              │   isConnected = true          │
              └───────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │   useWeb3Auth auto-connect effect fires                 │
    │   ─────────────────────────────────────                 │
    │   NO CHECK for existing Clerk session!                  │
    │   Blindly attempts web3AuthApi.login(address)           │
    └─────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Backend returns 404         │
              │   (wallet not registered)     │
              └───────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │   useWeb3Auth catches 404 and:                          │
    │   1. Calls web3AuthApi.signup(address)  ← NEW USER!     │
    │   2. Calls web3AuthApi.login(address)                   │
    │   3. Redirects to /onboarding/web3                      │
    └─────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   User now logged in as       │
              │   NEW Web3 account            │
              │   ───────────────────         │
              │   Original Clerk account      │
              │   is orphaned!                │
              └───────────────────────────────┘
```

---

## Expected Flow (Correct)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXPECTED CORRECT FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "Connect Wallet to Claim"
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │   CHECK: Is user already authenticated?                 │
    │   ─────────────────────────────────────                 │
    │   • Check Clerk: useUser().isSignedIn                   │
    │   • Check Web3: useAuth().isAuthenticated               │
    │   • Check localStorage: auth_method                     │
    └─────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ Clerk User    │ │ Web3 User     │ │ Not Signed In │
    │ (no wallet)   │ │ (has wallet)  │ │               │
    └───────────────┘ └───────────────┘ └───────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ Open wallet   │ │ Use existing  │ │ Open wallet   │
    │ modal, then   │ │ wallet        │ │ modal for     │
    │ LINK wallet   │ │ connection    │ │ SIGN IN       │
    │ to account    │ │               │ │               │
    └───────────────┘ └───────────────┘ └───────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ Call API:     │ │ Proceed to    │ │ Create new    │
    │ /web3auth/    │ │ mint          │ │ Web3 account  │
    │ link          │ │               │ │ (correct)     │
    └───────────────┘ └───────────────┘ └───────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
              ┌───────────────────────────────┐
              │   User can now claim NFT      │
              │   to their linked wallet      │
              └───────────────────────────────┘
```

---

## Affected Components

### 1. PendingPassesClaim.tsx
**Location:** `src/components/common/Profile/PendingPassesClaim.tsx`

**Current behavior:**
```tsx
// Line ~95: Direct call without auth check
<button onClick={openConnectModal}>
  Connect Wallet to Claim
</button>
```

**Issue:** Calls `openConnectModal()` without checking if user is Clerk-authenticated.

---

### 2. useWeb3Auth.ts
**Location:** `src/hooks/useWeb3Auth.ts`

**Current behavior (lines 180-189):**
```typescript
useEffect(() => {
  if (isConnected && address && !state.isAuthenticated && !attemptedOnceRef.current) {
    attemptedOnceRef.current = true;
    void connect().catch(() => {
      attemptedOnceRef.current = false;
    });
  }
}, [isConnected, address, state.isAuthenticated, connect]);
```

**Issue:** This effect fires unconditionally when a wallet connects. It doesn't check:
- If user is already Clerk-authenticated
- If the intent is to link (not sign in)
- The value of `localStorage.getItem('auth_method')`

---

### 3. CheckoutSuccessPage.tsx
**Location:** `src/pages/CheckoutSuccessPage.tsx`

**Current behavior (lines ~507-529):**
```tsx
{!isConnected && (
  <button onClick={openConnectModal}>
    Connect Wallet to Claim Your NFT
  </button>
)}
```

**Issue:** Same pattern - direct `openConnectModal()` without auth awareness.

---

### 4. useLinkWallet.ts (Exists but Unused)
**Location:** `src/hooks/useLinkWallet.ts`

This hook provides the **correct** wallet linking functionality:
```typescript
async linkWallet(address: string): Promise<LinkWalletResponse> {
  const response = await api.post('/api/v1/web3auth/link', {
    walletAddress: address.toLowerCase()
  });
  return response.data;
}
```

**Issue:** This is only used in `ProfileInfoCard` for display purposes, not in the claiming flow.

---

## Root Cause Analysis

### The Core Problem
The Web3 auth system operates independently from Clerk auth, with no coordination between them during wallet connection events.

### Contributing Factors

1. **No auth-aware wrapper for wallet connection**
   - `openConnectModal()` is called directly without context
   - No middleware to intercept and route based on auth state

2. **Auto-connect effect is too aggressive**
   - `useWeb3Auth` automatically attempts login when any wallet connects
   - No differentiation between "user wants to sign in" vs "user wants to link"

3. **Missing intent parameter**
   - The wallet connection modal doesn't know WHY it was opened
   - Can't distinguish between sign-in, linking, or transaction signing

4. **Dual auth systems not integrated**
   - Clerk and Web3 auth are separate React contexts
   - No unified auth state management

---

## Proposed Solutions

### Solution 1: Auth-Aware Connect Function (Recommended)

Create a wrapper function that checks auth state before opening the wallet modal.

**New file:** `src/hooks/useAuthAwareWallet.ts`

```typescript
import { useUser } from '@clerk/clerk-react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAuth } from '../contexts/AuthContext';
import { useLinkWallet } from './useLinkWallet';

type WalletIntent = 'sign_in' | 'link' | 'transaction';

export const useAuthAwareWallet = () => {
  const { isSignedIn } = useUser();
  const { isAuthenticated: isWeb3Auth } = useAuth();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { linkWallet } = useLinkWallet();

  const connectWalletWithIntent = async (intent: WalletIntent) => {
    // Already connected
    if (isConnected && address) {
      if (intent === 'link' && isSignedIn && !isWeb3Auth) {
        // Clerk user wants to link - call link API
        return await linkWallet(address);
      }
      // Already have what we need
      return { address, alreadyConnected: true };
    }

    // Store intent for post-connection handling
    sessionStorage.setItem('wallet_connect_intent', intent);

    // Open modal
    openConnectModal?.();
  };

  return {
    connectWalletWithIntent,
    isClerkUserWithoutWallet: isSignedIn && !isWeb3Auth && !isConnected,
  };
};
```

---

### Solution 2: Guard the Auto-Connect Effect

Modify `useWeb3Auth.ts` to respect existing Clerk sessions.

**Modified effect:**
```typescript
useEffect(() => {
  // Get stored intent
  const intent = sessionStorage.getItem('wallet_connect_intent');
  const authMethod = localStorage.getItem('auth_method');

  // Skip auto-connect if:
  // 1. User is Clerk-authenticated (auth_method === 'clerk')
  // 2. Intent is 'link' (not sign_in)
  const shouldSkipAutoConnect =
    authMethod === 'clerk' ||
    intent === 'link' ||
    intent === 'transaction';

  if (isConnected && address && !state.isAuthenticated && !attemptedOnceRef.current) {
    if (shouldSkipAutoConnect) {
      // Clear intent and skip - let calling code handle linking
      sessionStorage.removeItem('wallet_connect_intent');
      return;
    }

    attemptedOnceRef.current = true;
    void connect().catch(() => {
      attemptedOnceRef.current = false;
    });
  }
}, [isConnected, address, state.isAuthenticated, connect]);
```

---

### Solution 3: Post-Connection Handler

Add an effect to handle wallet connection based on stored intent.

**In PendingPassesClaim.tsx:**
```typescript
const { linkWallet, isLinking } = useLinkWallet();
const { isSignedIn } = useUser();

// Handle post-connection linking for Clerk users
useEffect(() => {
  const intent = sessionStorage.getItem('wallet_connect_intent');

  if (isConnected && address && intent === 'link' && isSignedIn) {
    sessionStorage.removeItem('wallet_connect_intent');

    // Link wallet to existing Clerk account
    linkWallet(address).then(() => {
      // Wallet now linked, can proceed with mint
    }).catch((err) => {
      console.error('Failed to link wallet:', err);
    });
  }
}, [isConnected, address, isSignedIn, linkWallet]);

// Updated button
const handleConnectForClaim = () => {
  if (isSignedIn) {
    // Clerk user - set intent to link
    sessionStorage.setItem('wallet_connect_intent', 'link');
  }
  openConnectModal?.();
};
```

---

### Solution 4: Unified Auth Context (Long-term)

Create a unified auth context that manages both Clerk and Web3 auth states.

**New file:** `src/contexts/UnifiedAuthContext.tsx`

```typescript
interface UnifiedAuthState {
  // Current auth method
  authMethod: 'clerk' | 'web3' | 'none';

  // User info (unified)
  user: {
    id: string;
    email?: string;
    walletAddress?: string;
    username?: string;
  } | null;

  // Wallet state
  wallet: {
    isConnected: boolean;
    address?: string;
    isLinked: boolean;  // true if wallet is linked to current auth
  };

  // Actions
  connectWallet: (intent: 'sign_in' | 'link') => Promise<void>;
  linkWallet: () => Promise<void>;
  disconnectWallet: () => void;
}
```

---

## Implementation Priority

| Priority | Solution | Effort | Impact |
|----------|----------|--------|--------|
| 1 | Solution 2: Guard auto-connect effect | Low | High |
| 2 | Solution 3: Post-connection handler | Medium | High |
| 3 | Solution 1: Auth-aware wrapper | Medium | Medium |
| 4 | Solution 4: Unified auth context | High | High |

---

## Quick Fix (Minimal Changes)

For an immediate fix with minimal code changes:

### Step 1: Modify useWeb3Auth.ts

Add a check for existing Clerk auth before auto-connecting:

```typescript
// At the top of the effect
const clerkToken = localStorage.getItem('__clerk_db_jwt');
const authMethod = localStorage.getItem('auth_method');
const isClerkUser = authMethod === 'clerk' || !!clerkToken;

if (isConnected && address && !state.isAuthenticated && !attemptedOnceRef.current) {
  // Don't auto-login if user is already authenticated via Clerk
  if (isClerkUser) {
    console.log('[useWeb3Auth] Skipping auto-connect: Clerk user detected');
    return;
  }

  attemptedOnceRef.current = true;
  void connect().catch(() => {
    attemptedOnceRef.current = false;
  });
}
```

### Step 2: Update PendingPassesClaim.tsx

After wallet connects, check if we need to link:

```typescript
// Add effect to handle linking for Clerk users
useEffect(() => {
  const authMethod = localStorage.getItem('auth_method');

  if (isConnected && address && authMethod === 'clerk') {
    // Clerk user connected wallet - trigger link flow
    linkWalletMutation.mutate(address);
  }
}, [isConnected, address]);
```

---

## Testing Scenarios

After implementing fixes, test these scenarios:

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Clerk user with no wallet clicks "Connect Wallet to Claim" | Wallet connects, then links to existing Clerk account |
| 2 | Clerk user with linked wallet clicks claim | Uses existing wallet, proceeds to mint |
| 3 | Web3 user clicks claim | Uses existing Web3 auth, proceeds to mint |
| 4 | Anonymous user clicks connect | Opens wallet modal, creates new Web3 account |
| 5 | Clerk user connects wallet then refreshes | Wallet remains linked, no new account |

---

## Related Files

- `src/hooks/useWeb3Auth.ts` - Web3 authentication hook
- `src/hooks/useLinkWallet.ts` - Wallet linking hook (underutilized)
- `src/contexts/AuthContext.tsx` - Web3 auth context
- `src/components/common/Profile/PendingPassesClaim.tsx` - NFT claiming UI
- `src/components/common/Profile/ProfileInfoCard.tsx` - Shows correct link logic
- `src/pages/CheckoutSuccessPage.tsx` - Post-purchase wallet connection
- `src/api/web3authapi.ts` - Web3 auth API calls

---

## Conclusion

The core issue is that wallet connection events trigger Web3 authentication unconditionally, without respecting existing Clerk sessions. The fix requires adding auth-awareness to the wallet connection flow, either through:

1. Guarding the auto-connect effect in `useWeb3Auth`
2. Using the existing `useLinkWallet` hook for Clerk users
3. Adding intent-based routing for wallet connections

The recommended approach is to implement Solutions 2 and 3 together for immediate relief, with Solution 4 as a longer-term architectural improvement.
