# Content Pass - Frontend Integration Guide

This document provides everything needed to integrate the Content Pass system in the frontend application. Use this as a reference when working on pass-related features.

---

## Overview

Content Pass is a tradeable membership system that grants access to creator's exclusive content. Users can purchase passes via:
1. **Stripe (Fiat)** - Credit card payment, wallet optional at purchase
2. **Crypto** - Direct on-chain purchase with connected wallet

---

## Key Concepts

### Purchase States

```
┌─────────────────────────────────────────────────────────────────┐
│  STRIPE PURCHASE FLOW                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User buys with card                                            │
│       ↓                                                         │
│  Purchase created (status: 'pending')                           │
│       ↓                                                         │
│  User has IMMEDIATE content access (via DB)                     │
│       ↓                                                         │
│  [Later] User connects wallet                                   │
│       ↓                                                         │
│  Frontend calls POST /purchases/mint-pending                    │
│       ↓                                                         │
│  Pass minted to wallet (status: 'claimed')                      │
│       ↓                                                         │
│  User owns NFT, can trade on marketplace                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CRYPTO PURCHASE FLOW                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User connects wallet                                           │
│       ↓                                                         │
│  User calls buyPassWithQuote() on-chain                         │
│       ↓                                                         │
│  Pass minted directly to wallet                                 │
│       ↓                                                         │
│  User owns NFT immediately                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Purchase Status Values

| Status | Meaning | User Has Access? |
|--------|---------|------------------|
| `pending` | Paid via Stripe, awaiting wallet connection | ✅ Yes |
| `minting` | Mint transaction in progress | ✅ Yes |
| `minted` | Minted to vault, awaiting claim | ✅ Yes |
| `claiming` | Claim transaction in progress | ✅ Yes |
| `claimed` | Minted/claimed to user's wallet | ✅ Yes |
| `failed` | Transaction failed | ❌ No |

---

## API Endpoints

### Base URL
```
Production: https://api.base.tube
Staging: https://api-staging.base.tube
Local: http://localhost:3000
```

### Authentication
All authenticated endpoints require:
```
Authorization: Bearer <clerk_jwt_token>
```

---

### Pass Endpoints

#### Get Pass Details
```http
GET /api/v1/passes/:passId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Creator's Gold Pass",
    "description": "Access to all exclusive content",
    "price_cents": 1000,
    "currency": "USD",
    "tier": "gold",
    "supply_cap": 100,
    "minted_count": 45,
    "sale_active": true,
    "channel": {
      "id": 123,
      "name": "Creator Name",
      "avatar_url": "https://..."
    }
  }
}
```

#### Get Passes by Channel
```http
GET /api/v1/channels/:channelId/passes
```

#### Create Stripe Checkout Session
```http
POST /api/v1/passes/:passId/checkout
```

**Response:**
```json
{
  "success": true,
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Frontend Flow:**
```typescript
// 1. Create checkout session
const response = await fetch(`/api/v1/passes/${passId}/checkout`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
const { url } = await response.json();

// 2. Redirect to Stripe
window.location.href = url;

// 3. Handle return (success_url includes ?session_id=...)
// User lands on /pay/success?session_id=cs_test_...
```

---

### Purchase Endpoints

#### Get User's Purchases
```http
GET /api/v1/purchases
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "purchase-uuid",
      "pass_id": "pass-uuid",
      "status": "pending",
      "price_cents": 1000,
      "currency": "USD",
      "created_at": "2025-01-09T...",
      "pass": {
        "id": "pass-uuid",
        "title": "Gold Pass",
        "tier": "gold"
      }
    }
  ]
}
```

#### Get Pending Purchases (Awaiting Wallet)
```http
GET /api/v1/purchases/pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchases": [
      {
        "id": "purchase-uuid",
        "passId": "pass-uuid",
        "status": "pending",
        "priceCents": 1000,
        "currency": "USD",
        "createdAt": "2025-01-09T...",
        "pass": {
          "id": "pass-uuid",
          "title": "Gold Pass",
          "description": "...",
          "tier": "gold"
        }
      }
    ]
  }
}
```

**Use Case:** Show users what passes they've bought but haven't minted yet.

#### Mint Pending Purchases to Wallet
```http
POST /api/v1/purchases/mint-pending
Content-Type: application/json

{
  "walletAddress": "0x1234..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "minted": [
      {
        "purchaseId": "uuid",
        "passId": "uuid",
        "status": "success",
        "txHash": "0xabc..."
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "alreadyMinted": 0
    }
  }
}
```

**Error Responses:**
```json
// Missing wallet
{ "success": false, "error": "walletAddress is required" }

// Invalid wallet
{ "success": false, "error": "Invalid wallet address format" }
```

#### Get Purchase Status
```http
GET /api/v1/purchases/:purchaseId/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "claimed",
    "mint_tx_hash": "0x...",
    "claim_tx_hash": "0x...",
    "onchain_owner": "0x..."
  }
}
```

---

### Access Endpoints

#### Check Content Access
```http
GET /api/v1/access?passId=<pass-uuid>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "ledgerBalance": "1",
    "vaultBalance": "0",
    "source": "db",
    "timestamp": 1704800000000
  }
}
```

**Source Values:**
- `db` - Access granted via database (pending/paid purchase)
- `chain` - Access granted via on-chain balance
- `cache` - Cached access result

#### Check Multiple Passes Access
```http
POST /api/v1/access/batch
Content-Type: application/json

{
  "passIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

---

### Claim Endpoints (Vault → Wallet Transfer)

#### Initiate Claim
```http
POST /api/v1/claim
Content-Type: application/json

{
  "purchaseId": "uuid"
}
```

**Note:** User must have a connected wallet. Returns 400 if no wallet.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Claim initiated",
    "purchaseId": "uuid"
  }
}
```

---

### Health Check Endpoint

#### Blockchain Health
```http
GET /api/v1/monitoring/health/blockchain
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T...",
  "service": "blockchain",
  "metrics": {
    "config": {
      "rpcUrl": "configured",
      "ledgerAddress": "configured",
      "vaultAddress": "configured"
    },
    "rpc": {
      "status": "connected",
      "blockNumber": 12345678,
      "chainId": 8453
    },
    "relayer": {
      "address": "0x...",
      "balance": "0.5 ETH",
      "hasGas": true
    },
    "queues": {
      "mint": { "waiting": 0, "active": 0, "failed": 0 },
      "claim": { "waiting": 0, "active": 0, "failed": 0 }
    }
  }
}
```

---

## Frontend Implementation Patterns

### 1. Wallet Connection + Mint Flow

```typescript
// When user connects wallet, check for pending purchases and mint them
async function onWalletConnected(walletAddress: string) {
  try {
    // 1. Check for pending purchases
    const pendingRes = await fetch('/api/v1/purchases/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { data } = await pendingRes.json();

    if (data.purchases.length === 0) {
      return; // Nothing to mint
    }

    // 2. Show user what will be minted
    const confirmed = await showMintConfirmationModal(data.purchases);
    if (!confirmed) return;

    // 3. Mint to wallet
    const mintRes = await fetch('/api/v1/purchases/mint-pending', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ walletAddress })
    });

    const result = await mintRes.json();

    // 4. Show results
    if (result.data.summary.successful > 0) {
      showSuccessToast(`${result.data.summary.successful} pass(es) minted to your wallet!`);
    }
    if (result.data.summary.failed > 0) {
      showErrorToast(`${result.data.summary.failed} mint(s) failed. Please try again.`);
    }

  } catch (error) {
    console.error('Mint failed:', error);
    showErrorToast('Failed to mint passes. Please try again.');
  }
}
```

### 2. Content Access Gate

```typescript
// Check if user can view gated content
async function checkContentAccess(passId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/access?passId=${passId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { data } = await res.json();
    return data.hasAccess;
  } catch {
    return false;
  }
}

// Usage in component
function GatedContent({ passId, children }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkContentAccess(passId)
      .then(setHasAccess)
      .finally(() => setLoading(false));
  }, [passId]);

  if (loading) return <Skeleton />;
  if (!hasAccess) return <PurchasePrompt passId={passId} />;
  return children;
}
```

### 3. Purchase Status Polling

```typescript
// Poll for purchase status after Stripe redirect
async function pollPurchaseStatus(purchaseId: string): Promise<string> {
  const maxAttempts = 20;
  const interval = 3000; // 3 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/v1/purchases/${purchaseId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { data } = await res.json();

    if (['claimed', 'minted', 'pending'].includes(data.status)) {
      return data.status;
    }

    if (data.status === 'failed') {
      throw new Error('Purchase failed');
    }

    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error('Timeout waiting for purchase');
}
```

### 4. Stripe Checkout Flow

```typescript
async function handleBuyPass(passId: string) {
  try {
    // 1. Create checkout session
    const res = await fetch(`/api/v1/passes/${passId}/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Checkout failed');
    }

    const { url } = await res.json();

    // 2. Redirect to Stripe
    window.location.href = url;

  } catch (error) {
    showErrorToast(error.message);
  }
}

// Success page handler
function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Purchase is being processed
      // User already has access via DB
      showSuccessMessage('Payment successful! You now have access.');

      // Optionally prompt to connect wallet
      if (!walletConnected) {
        showWalletPrompt('Connect your wallet to claim your pass as an NFT');
      }
    }
  }, [sessionId]);
}
```

### 5. Display Pending Passes Banner

```typescript
function PendingPassesBanner() {
  const [pending, setPending] = useState([]);
  const { address, isConnected } = useWallet();

  useEffect(() => {
    fetch('/api/v1/purchases/pending', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(({ data }) => setPending(data.purchases));
  }, []);

  if (pending.length === 0) return null;

  return (
    <Banner variant="info">
      <p>You have {pending.length} pass(es) waiting to be claimed!</p>
      {isConnected ? (
        <Button onClick={() => mintPending(address)}>
          Claim to Wallet
        </Button>
      ) : (
        <ConnectWalletButton />
      )}
    </Banner>
  );
}
```

---

## TypeScript Types

```typescript
// Pass
interface Pass {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  tier: 'bronze' | 'silver' | 'gold';
  supply_cap: number | null;
  minted_count: number;
  sale_active: boolean;
  channel_id: number;
  onchain_pass_id: number | null;
  slug: string;
}

// Purchase
interface Purchase {
  id: string;
  pass_id: string;
  buyer_id: string;
  status: PurchaseStatus;
  price_cents: number;
  currency: string;
  payment_type: 'stripe' | 'crypto';
  tx_hash: string | null;
  mint_tx_hash: string | null;
  claim_tx_hash: string | null;
  onchain_owner: string | null;
  created_at: string;
  pass?: Pass;
}

type PurchaseStatus =
  | 'pending'
  | 'minting'
  | 'minted'
  | 'claiming'
  | 'claimed'
  | 'failed';

// Access Check Result
interface AccessResult {
  hasAccess: boolean;
  ledgerBalance: string;
  vaultBalance: string;
  source: 'db' | 'chain' | 'cache';
  timestamp: number;
}

// Mint Result
interface MintResult {
  purchaseId: string;
  passId: string;
  status: 'success' | 'failed' | 'already_minted';
  txHash?: string;
  error?: string;
}

interface MintPendingResponse {
  minted: MintResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    alreadyMinted: number;
  };
}
```

---

## Smart Contract Addresses

### Base Mainnet (Chain ID: 8453)
```
ContentLedger1155: <TBD>
CustodyVault: <TBD>
```

### Base Sepolia Testnet (Chain ID: 84532)
```
ContentLedger1155: <check .env>
CustodyVault: <check .env>
```

---

## On-Chain Integration (Crypto Purchases)

For direct crypto purchases, interact with the ContentLedger contract:

```typescript
import { ethers } from 'ethers';

const LEDGER_ABI = [
  'function buyPassWithQuote(uint256 passId, uint256 quantity) payable',
  'function getQuote(uint256 passId, uint256 quantity) view returns (uint256)',
  'function balanceOf(address account, uint256 id) view returns (uint256)'
];

async function buyPassWithCrypto(passId: number, quantity: number = 1) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const ledger = new ethers.Contract(
    CONTENT_LEDGER_ADDRESS,
    LEDGER_ABI,
    signer
  );

  // Get price quote
  const price = await ledger.getQuote(passId, quantity);

  // Execute purchase
  const tx = await ledger.buyPassWithQuote(passId, quantity, {
    value: price
  });

  // Wait for confirmation
  const receipt = await tx.wait();

  return receipt.hash;
}
```

---

## Error Handling

### Common Error Codes

| Error | Meaning | User Action |
|-------|---------|-------------|
| `UNAUTHORIZED` | Missing/invalid auth token | Re-authenticate |
| `PASS_NOT_FOUND` | Pass doesn't exist | Check pass ID |
| `PASS_SOLD_OUT` | Supply cap reached | Show sold out state |
| `NO_WALLET` | Wallet required but not connected | Prompt wallet connection |
| `INVALID_WALLET` | Invalid wallet address format | Validate input |
| `ALREADY_PURCHASED` | User already owns this pass | Show owned state |
| `MINT_FAILED` | On-chain mint failed | Retry or contact support |

### Error Response Format
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Testing

### Test Credentials (Staging)
```
Stripe Test Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

### E2E Test Flow
1. Create user account
2. Buy pass via Stripe (test card)
3. Verify access granted immediately
4. Connect wallet
5. Call mint-pending
6. Verify on-chain ownership

---

## Checklist for Frontend Implementation

```
Pass Display
────────────
[ ] Show pass details (title, price, supply)
[ ] Show availability (minted_count / supply_cap)
[ ] Show sold out state when supply exhausted
[ ] Show "owned" state if user has access

Purchase Flow
─────────────
[ ] Stripe checkout redirect
[ ] Handle success redirect (?session_id=...)
[ ] Show purchase confirmation
[ ] Prompt wallet connection for NFT claim

Wallet Integration
──────────────────
[ ] Detect wallet connection
[ ] On connect: check for pending purchases
[ ] Show pending passes banner/modal
[ ] Mint pending to wallet
[ ] Show mint progress/results

Access Control
──────────────
[ ] Gate content based on access check
[ ] Show appropriate CTA (buy/connect wallet/access)
[ ] Handle access check errors gracefully

Error States
────────────
[ ] Handle sold out
[ ] Handle payment failures
[ ] Handle mint failures
[ ] Show retry options
```

---

*Document Version: 1.0*
*Last Updated: January 2025*
*For Frontend Development Reference*
