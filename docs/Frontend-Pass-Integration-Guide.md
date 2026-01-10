# Frontend Pass Integration Guide

This document explains how the frontend should handle the Content Pass purchase and access flow.

## Purchase Status Flow

There are two purchase flows with different status progressions:

### Stripe (Fiat) Purchase Flow
```
pending → [user connects wallet] → minting → claimed
```

### Crypto (Direct Wallet) Purchase Flow
```
[on-chain purchase] → claimed (immediate)
```

### Status Meanings

| Status | Meaning | User Has Access? | NFT Status |
|--------|---------|------------------|------------|
| `pending` | Payment confirmed, awaiting wallet connection | **YES** | Not minted yet |
| `minting` | User triggered mint, tx in progress | **YES** | Minting on-chain |
| `minted` | NFT minted to vault, ready to claim | **YES** | In vault |
| `claiming` | User claiming NFT from vault | **YES** | Transferring |
| `claimed` | NFT in user's wallet | **YES** | Owned |
| `completed` | Legacy/final state | **YES** | Owned |

### Key Insight: DB-First Access + Deferred Minting

**Access is granted immediately upon purchase confirmation (`pending` status).**

**NFT minting does NOT happen automatically.** It only occurs when:
1. User connects a wallet, OR
2. User purchases directly with crypto (wallet already known)

This means:
- Users can watch gated content as soon as Stripe confirms payment
- NFT is optional - users without wallets still have full access
- Minting only happens when user explicitly connects wallet and triggers it
- Frontend should NOT show "minting in progress" for `pending` status

## API Endpoints

### 1. Check Access Status
```
GET /api/v1/access?passId={passId}
Authorization: Bearer {clerkToken}
```

Response:
```json
{
  "hasAccess": true,
  "purchaseStatus": "pending",
  "passId": "uuid",
  "purchasedAt": "2024-01-09T..."
}
```

### 2. Get Signed Video URL
```
GET /api/v1/passes/videos/{videoId}/signed-url
Authorization: Bearer {clerkToken}
```

Response (success):
```json
{
  "signedUrl": "https://...",
  "expiresAt": "2024-01-09T..."
}
```

Response (no access):
```json
{
  "error": "Access denied",
  "code": 403
}
```

### 3. Get Pass Details (Public)
```
GET /api/v1/passes/{slug}
```

### 4. Get User's Purchases
```
GET /api/v1/purchases
Authorization: Bearer {clerkToken}
```

## Frontend Flow Implementation

### After Stripe Checkout Success

1. **Stripe redirects to your success URL** with `session_id` query param
2. **Poll the access endpoint** to confirm purchase was recorded:
   ```javascript
   const checkAccess = async (passId) => {
     const res = await fetch(`/api/v1/access?passId=${passId}`, {
       headers: { Authorization: `Bearer ${clerkToken}` }
     });
     return res.json();
   };
   ```
3. **Stop polling when `hasAccess: true`** - typically within 1-2 seconds
4. **Redirect to content** - user can now watch videos

### Handling Purchase States in UI

```javascript
const PurchaseStatus = ({ purchase, walletConnected }) => {
  const { status, hasAccess } = purchase;

  // User always has access if any of these statuses
  const accessGranted = ['pending', 'minting', 'minted', 'claiming', 'claimed', 'completed'].includes(status);

  if (accessGranted) {
    return (
      <div>
        <ContentPlayer /> {/* Show the content */}

        {/* NFT status - only relevant if user wants on-chain ownership */}
        {status === 'pending' && !walletConnected && <ConnectWalletPrompt />}
        {status === 'pending' && walletConnected && <MintNFTButton />}
        {status === 'minting' && <Badge>Minting NFT...</Badge>}
        {status === 'minted' && <ClaimNFTButton />}
        {status === 'claiming' && <Badge>Claiming to wallet...</Badge>}
        {['claimed', 'completed'].includes(status) && <Badge>NFT Owned</Badge>}
      </div>
    );
  }

  return <PurchaseButton />;
};
```

### NFT Minting Flow (User-Initiated)

NFT minting only happens when user connects wallet and triggers it:

1. **User connects wallet** (wagmi/viem or similar)
2. **Call mint-pending endpoint** to mint all pending purchases:
   ```
   POST /api/v1/purchases/mint-pending
   Authorization: Bearer {clerkToken}
   ```
   This mints directly to the user's connected wallet.
3. **Status updates**: `pending` → `minting` → `claimed`

**Note:** For Stripe purchases, the flow skips `minted`/`claiming` because we mint directly to the user's wallet (not to a vault first).

### Alternative: Vault + Claim Flow

If minting to vault (for gasless claiming later):

1. **Mint to vault** (backend operation)
2. **Status**: `minting` → `minted`
3. **User claims from vault**:
   ```
   POST /api/v1/purchases/{purchaseId}/claim
   Authorization: Bearer {clerkToken}
   Body: { walletAddress: "0x..." }
   ```
4. **Status**: `claiming` → `claimed`

## Common Issues & Solutions

### Issue: User sees 403 after successful payment
**Cause**: Frontend checking access before webhook processed
**Solution**: Add retry logic with exponential backoff:
```javascript
const waitForAccess = async (passId, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { hasAccess } = await checkAccess(passId);
    if (hasAccess) return true;
    await sleep(1000 * Math.pow(1.5, i)); // Exponential backoff
  }
  return false;
};
```

### Issue: UI stuck on "Processing" forever
**Cause**: Not detecting when access is granted
**Solution**: Check `hasAccess` field, not just status:
```javascript
// Wrong - waits for specific status
if (purchase.status === 'completed') showContent();

// Correct - checks access flag
if (purchase.hasAccess) showContent();
```

### Issue: Content player shows loading but never plays
**Cause**: Signed URL expired or not fetched
**Solution**:
- Fetch signed URL fresh when mounting player
- Handle 403 by re-checking access and re-fetching URL
- Signed URLs expire after 1 hour, refresh before expiry

## Testing the Flow

1. Use Stripe test cards: `4242 4242 4242 4242`
2. After checkout, verify:
   - `/api/v1/access?passId=X` returns `hasAccess: true`
   - `/api/v1/passes/videos/{id}/signed-url` returns valid URL
3. Check browser console for any 403 errors
4. Verify video plays without interruption

## Backend Status (as of Jan 2026)

- TokenGateService updated to grant access for `pending` status
- Stripe webhooks configured and working
- DB-first access pattern implemented
- All access-granting statuses: `pending`, `minting`, `minted`, `claiming`, `claimed`, `completed`
