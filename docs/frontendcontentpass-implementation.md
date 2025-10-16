# Frontend Onchain Integration Plan

## Overview
This guide explains how the web client should integrate with the new onchain pass backend. It covers the user flows, required API calls, payload shapes, and dependency considerations. React/Next components are intentionally omitted—focus on wiring the API client and state management.

## Prerequisites
- Auth token (Clerk/Web3) present on every authenticated request.
- Environment variables for API base URL (staging vs production).
- Ability to surface async status and error states to the user (queue-driven flows may take seconds).

## Endpoint Reference
All responses are JSON unless noted. `success: false` responses include `error` with `code` (if available) and `message`.

### 1. Purchase Status
`GET /api/v1/purchases/:purchaseId/status`
```json
// 200 OK
{
  "success": true,
  "data": {
    "status": "minted",
    "purchaseId": "uuid",
    "passId": "uuid",
    "priceCents": 500,
    "currency": "EUR",
    "paymentType": "stripe",
    "stripePaymentId": "pi_...",
    "paymentHash": "0x...",
    "txHash": "0x...",       // mint transaction
    "mintTxHash": "0x...",
    "claimTxHash": "0x...",
    "lastStatusReason": null,
    "lastCheckedAt": "2025-10-12T12:00:00.000Z",
    "pass": {
      "id": "uuid",
      "title": "Example Pass",
      "description": "...",
      "supplyCap": 5000,
      "mintedCount": 123
    }
  }
}
```
- Status values: `pending`, `minting`, `minted`, `claiming`, `claimed`, `completed`, `failed`, `refunded`, `disputed`.
- Poll until `minted` (ready for access) or `claimed` (already withdrawn).

### 2. Access Check
`GET /api/v1/access?passId=<uuid>`
```json
{
  "success": true,
  "data": {
    "passId": "uuid",
    "hasAccess": true,
    "ledgerBalance": "1",     // stringified uint256
    "vaultBalance": "0",
    "source": "cache",        // cache | chain
    "timestamp": 1733920800000 // ms since epoch
  }
}
```
`GET /api/v1/access/list`
```json
{
  "success": true,
  "data": [
    {
      "passId": "uuid",
      "hasAccess": true,
      "source": "cache",
      "timestamp": 1733920800000,
      "ledgerBalance": "1",
      "vaultBalance": "0"
    }
  ]
}
```

### 3. Claim
`POST /api/v1/claim`
```json
{
  "purchaseId": "uuid"
}
```
Responses:
- `200 OK` → `{ "success": true }` (job accepted)
- `400` examples: `{ "success": false, "error": "Purchase already in claim flow" }`, `{ "success": false, "error": "No balance available in vault" }`
- `404` if purchase missing.
After submission, poll purchase status until it becomes `claimed`.

### 4. Stripe Checkout
`POST /api/v1/passes/:passId/checkout`
```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```
- Redirect user to `url`. After returning, associate the Stripe session with a purchase (via backend metadata or follow-up API call).

### 5. Crypto Quote (optional)
If the frontend requests signed quotes:
- `POST /api/v1/passes/:passId/quote` (if exposed) → expect payload with `digest`, `signature`, `minPrice`, etc. Confirm with backend before implementation; current backend uses relayer to submit `buyPassWithQuote`.

### 6. Metrics (internal tooling)
`GET /internal/metrics`
- Plain text Prometheus format. Lock behind VPN/service account; not for general FE use.

## Recommended Frontend Architecture
1. **API Client Layer**
   - Extend existing API SDK. Example TypeScript interface:
     ```ts
     type PurchaseStatus = 'pending' | 'minting' | 'minted' | 'claiming' | 'claimed' | 'completed' | 'failed' | 'refunded' | 'disputed';

     interface PurchaseStatusResponse {
       success: boolean;
       data: {
         status: PurchaseStatus;
         purchaseId: string;
         passId: string;
         priceCents: number;
         currency: string;
         paymentType: 'stripe' | 'crypto';
         stripePaymentId?: string | null;
         paymentHash?: string | null;
         txHash?: string | null;
         mintTxHash?: string | null;
         claimTxHash?: string | null;
         lastStatusReason?: string | null;
         lastCheckedAt?: string | null;
         pass?: {
           id: string;
           title: string;
           description?: string | null;
           supplyCap?: number | null;
           mintedCount: number;
         } | null;
       };
     }
     ```
   - Mirror similar interfaces for Access and Claim endpoints.
2. **State Management & Polling**
   - Use React query/SWR or custom polling hooks for status transitions (5–10s interval).
   - Store latest access response to avoid redundant requests during session.
3. **Error Handling**
   - Display `error` message directly for most 4xx responses.
   - Retry/backoff for 5xx; escalate to support if persistent.

## User Flow Wiring
1. **Stripe Purchase**
   - Initiate checkout → redirect → on return, fetch purchase status and start polling.
   - When `minted`, fetch `/access?passId` and enable content/claim button.
2. **Crypto Purchase**
   - If FE initiates, gather quote parameters, call backend helper (if provided). After transaction, treat like Stripe flow.
3. **Claim**
   - Show CTA when `status === minted` AND `vaultBalance > 0`.
   - On click, POST `/claim`, show spinner, poll status until `claimed`.
4. **Content Gate**
   - Before serving protected asset, call `/access` to assert `hasAccess`.
5. **Pause/Freeze**
   - Backend errors (`sale inactive`, `frozen`) should be surfaced; disable purchase UI accordingly.

## Testing Checklist
- Stripe happy path (mint + access) on staging with test cards.
- Claim flow on staging (ensure queue job completes, status updates, access still true).
- Pause scenario: run while admin has pass paused; UI should show pass unavailable.
- Access caching: confirm `source` flips from `chain` to `cache` on subsequent calls.

## Coordination & Deployment Notes
- Verify API base URL/env per environment.
- Coordinate with backend for mapping Stripe session → purchaseId if needed.
- Ensure monitoring/alert channels are connected before enabling in production.
- Feature-flag new UI until staging burn-in succeeds.
