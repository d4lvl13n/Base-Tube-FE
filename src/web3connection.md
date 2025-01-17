# Web3 Authentication Issues & Implementation Guide

## Current Implementation Overview

The project uses a combination of:
- Wagmi for wallet connection management
- RainbowKit for wallet selection UI
- OnchainKit for wallet UI components
- Custom backend authentication flow

### Key Files
- Wallet Configuration: `src/config/wagmi.ts`
- Auth Hook: `src/hooks/useWeb3Auth.ts` 
- Wallet UI: `src/components/common/WalletWrapper/WalletWrapper.tsx`
- Auth Context: Referenced in `useWeb3Auth.ts`

## Issues to Resolve

### 1. Modal Positioning
**Problem:** Wallet connection modal is misaligned and partially hidden by header

**Solution Requirements:**
- Center modal in viewport using CSS/styling
- Add proper z-index handling
- Ensure modal appears above all other UI elements
- Consider adding backdrop/overlay

### 2. Web3 Authentication Flow
**Problem:** Backend authentication not properly triggered after wallet connection

**Current Flow (Needs Fix):**


**Required Flow:**
1. User clicks "Connect Wallet"
2. Wallet selection modal appears
3. User connects wallet
4. Backend signup/login endpoint called with wallet address
5. JWT token received and stored
6. User marked as authenticated
7. Protected routes accessible

### 3. Protected Routes Access
**Problem:** Web3 authenticated users cannot access protected routes

**Implementation Needed:**
- Add web3 authentication check to route guards
- Handle both Clerk and Web3 auth methods
- Persist authentication state
- Redirect unauthenticated users

### 4. Persistent Wallet Connection
**Problem:** Wallet connection lost on page refresh

**Implementation Requirements:**
- Store wallet connection state
- Implement auto-reconnect logic
- Handle multiple wallet providers
- Maintain user session across refreshes

## Implementation Steps

1. **Fix Modal Positioning**
   - Review OnchainKit configuration options
   - Add custom CSS if needed
   - Test across different screen sizes

2. **Authentication Flow**
   - Review and fix `useWeb3Auth` hook implementation
   - Ensure proper error handling
   - Add loading states
   - Test all authentication paths

3. **Protected Routes**
   - Implement route guard component
   - Add authentication state checks
   - Handle loading states
   - Add proper redirects

4. **Connection Persistence**
   - Implement local storage for auth state
   - Add reconnection logic
   - Handle wallet change events
   - Test refresh scenarios

## Testing Requirements

1. **Authentication Flows**
   - New user signup
   - Existing user login
   - Error scenarios
   - Network switching

2. **UI/UX**
   - Modal positioning
   - Loading states
   - Error messages
   - Responsive design

3. **Session Management**
   - Page refresh
   - Tab close/reopen
   - Multiple tabs
   - Browser restart

## Resources
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [OnchainKit Documentation](https://docs.onchainkit.xyz/)

## Environment Variables Required
REACT_APP_WALLETCONNECT_PROJECT_ID=
REACT_APP_ONCHAINKIT_API_KEY=
