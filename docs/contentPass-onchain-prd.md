### Product-Requirements Document (PRD)

**Project:** Base.Tube — NFT Content Pass MVP
**Version:** v0.9 ( 2025-06-24 )
**Status:** Draft – *Point-9 items marked **TBD***

---

## 0 · Executive summary

Base.Tube will let any YouTube creator gate an **unlisted video** behind a purchasable “Content Pass”.
*Web-2 buyers* pay with Stripe and get instant access; the NFT is minted into a **CustodyVault** and can be claimed later.
*Web-3 buyers* use an ETH wallet and receive the NFT directly.
Creators choose **Fixed price (USD or ETH)** or **Linear bonding curve** at channel setup.
All passes are ERC-721s on Base L2, pay royalties through ERC-2981, and respect a 90 / 10 revenue split.

---

## 1 · Objectives & success metrics

| #  | Objective                                 | KPI / target                                                      |
| -- | ----------------------------------------- | ----------------------------------------------------------------- |
| O1 | Creator onboarding < 5 min, no re-uploads | ⭑ 80 % creators create first pass in < 5 min                      |
| O2 | Viewer friction ≈ Web2                    | ⭑ 90 % Stripe checkouts complete; median time to playback < 30 s  |
| O3 | Secure, transparent on-chain accounting   | ⭑ 0 pricing desync bugs between Stripe & on-chain; ⭑ audit passes |
| O4 | Royalty & secondary-market ready          | ⭑ ERC-2981 compliance, subgraph indexes royalties                 |
| O5 | Refund-loss capped                        | ⭑ < 0.5 % GMV lost to chargebacks (tracked monthly)               |

---

## 2 · Personas & user stories

### 2.1 Creator

*“I want to sell exclusive video in one click and keep most earnings.”*

| Story                                       | Acceptance criteria                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| C1 Register channel & choose price          | – OAuth verifies channel<br>– Select *Fixed* (USD/ETH) or *Bonding curve*<br>– UI prevents missing fields |
| C2 Publish pass from YT URL                 | – Paste unlisted URL → preview loads<br>– Pass minted or reserved in ≤5 s                                 |
| C3 View earnings dashboard                  | – Payouts pending/available split<br>– Claim ETH to wallet when ≥ 0.01 ETH                                |
| C4 Adjust fixed-price **before** first sale | – “Update price” button present until first mint; hidden after                                            |

### 2.2 Viewer (Web 2)

*“I just pay, watch, and forget about crypto.”*

| Story                      | Acceptance criteria                                                             |
| -------------------------- | ------------------------------------------------------------------------------- |
| V1 Buy pass with Stripe    | – Checkout, success page, autoplay video<br>– Account auto-created (magic link) |
| V2 Watch again later       | – Gating allows playback via vault mapping                                      |
| V3 Learn about NFT & claim | – Dashboard shows “Claim NFT” CTA<br>– Claim completes gas-less in ≤30 s        |

### 2.3 Viewer (Web 3)

*“I prefer crypto and want the NFT immediately.”*

| Story                            | Acceptance criteria                             |
| -------------------------------- | ----------------------------------------------- |
| W1 Connect wallet & buy with ETH | – Price shown, Tx signs, video plays            |
| W2 Transfer or sell later        | – NFT visible in wallet; ERC-721 transfer works |

---

## 3 · Functional specification

### 3.1 Contract suite (Base chain)

| Contract                                | Responsibility                           | Key functions                                                                     |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| **ContentPassImplementation v1** (UUPS) | Minting, pricing, royalty calc           | `mintPass`, `mintPassBatch`, `registerCreator`, `getCurrentPrice`, `hasValidPass` |
| **CustodyVault**                        | Holds NFTs for Stripe buyers until claim | `onERC721Received`, `claim`, `revokeAndBurn`                                      |
| **ContentPassFactory**                  | Deploys minimal proxies per creator      | `createProxy`                                                                     |
| **EarlyAdopterPass**                    | Genesis unlock token (first 500)         | `mintEarlyAdopter`, `hasValidAccess`                                              |
| **TreasuryPullPayment** (library)       | Withdraw pattern for protocol & creators | `claimProtocol()`, `claimCreator()`                                               |

*Storage upgrade-safety:* new fields appended behind `__gap[45]`.

*Pricing enum & structs*

```solidity
enum PricingMode { Fixed, LinearCurve }
enum Currency    { ETH, USD }

struct CreatorConfig {
    bool          isActive;
    PricingMode   pricingMode;
    Currency      currency;        // if Fixed
    uint256       fixedPrice;      // cents or wei
    uint256       basePrice;       // wei
    uint256       priceIncrement;  // wei
    uint256       maxSupply;
    uint256       mintedSupply;
    ...
}
```

### 3.2 Backend services

| Service            | Endpoints                                                          | Notes                                                           |
| ------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| **Mint-Relay**     | `POST /stripe/webhook` → vault-mint<br>`POST /claim` → vault.claim | Idempotent on `payment_intent`; uses Biconomy Paymaster for gas |
| **Gating API**     | `GET /hasAccess?user&creator`                                      | Combines on-chain check + vault mapping + EarlyAdopter          |
| **Cron jobs**      | `sync-youtube` nightly                                             | Verify videos still Unlisted; alert creator if not              |
| **Escrow manager** | TBD – hold Stripe funds 7 days before release                      | Prevent chargeback loss                                         |

### 3.3 Front-end

* Stack: Next.js + wagmi + Coinbase Wallet SDK
* Components:

  * Creator onboarding wizard (price mode toggle, YT URL paste, confirm)
  * Pass detail page with Stripe button **or** “Buy with Crypto”
  * Viewer dashboard card with status badges (Active / Claimable / Claimed)
  * Claim modal → embedded smart-wallet, progress bar
  * Error states: price drift, max supply sold-out, paused mint

---

## 4 · Flows & sequence diagrams

### 4.1 Stripe purchase (vault-mint)

```
Viewer ─› Stripe Checkout ─› (success) ─› MintRelay
MintRelay ─› ContentPass.mintPass(to=CustodyVault)
               └ data = abi.encode(payment_intent)
ContentPass ─► event PassMinted
CustodyVault.onERC721Received → intentToToken[intent] = id
CustodyVault ─► event Claimable
MintRelay DB: order • userId • tokenId • claimed=false
```

### 4.2 Claim NFT

```
Viewer (dashboard) ─› POST /claim(payment_intent, wallet)
MintRelay.verifySession
MintRelay ─› CustodyVault.claim(intent, wallet)  (gas via Paymaster)
CustodyVault → safeTransferFrom(vault, wallet, tokenId)
CustodyVault ─► event Claimed
MintRelay DB claimed=true
```

### 4.3 Crypto purchase

```
Viewer (wallet) ─› ContentPass.mintPass{value}(creator)
ContentPass.mints to viewerWallet
Viewer → playback
```

---

## 5 · Edge-case handling

| Case                                      | Behaviour                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Stripe webhook replay                     | DB UNIQUE constraint → second request 200/OK no-op                                        |
| Vault claim replay                        | `claimed[id]` guard reverts                                                               |
| ETH price vol spike during Stripe session | Price frozen per checkout session; gain/loss < ±3 % absorbed by platform (configurable)   |
| Refund before release (≤ 7 days)          | `revokeAndBurn` token in vault; supply decremented                                        |
| Refund after payout                       | Platform deducts from future creator balance; token remains in circulation                |
| Oracle stale / offline                    | USD-fixed mint reverts (`updatedAt` > 1 h)                                                |
| Creator paused                            | Both rails revert with “Creator not active”                                               |
| Max supply sold out mid-checkout          | Stripe flow polls `remainingSupply()` before charge; if 0, shows “Sold out” page          |
| YouTube link made Public                  | Nightly job flags; creator panel shows warning & must fix within 24 h or pass auto-paused |

---

## 6 · Non-functional requirements

| Category          | Requirement                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Scalability**   | 1 k concurrent checkouts, < 250 ms P95 Gating API                                  |
| **Reliability**   | 99.5 % pass playback success; Stripe webhook retries idempotent                    |
| **Security**      | External audit passed; re-entrancy & upgrade auth tested                           |
| **Cost**          | Platform gas budget ≤ \$300 / 100 k Stripe mints; Paymaster alerts at 20 % balance |
| **Compliance**    | Stripe handles VAT; on-chain path ToS marks crypto sales final *(TBD local rules)* |
| **Observability** | Grafana dashboards: mint count, vault backlog, Paymaster balance, failed claims    |
| **Localization**  | UI copy EN for MVP; price displayed in local currency for Stripe sessions          |

---

## 7 · Open (TBD) items referenced from § 9

1. **Refund window length** – *default assume 7 days unless legal says otherwise.*
2. **Escrow design** – Stripe delayed transfer vs. on-chain escrow.
3. **Creator KYC threshold** – amount triggering Stripe Connect onboarding.
4. **Royalty Bps configurability** – DAO-governed variable or fixed 10 %.
5. **Metadata hosting** – IPFS via NFT.Storage vs. centralized S3 bucket for MVP.

These will be resolved before engineering freeze.

---

## 8 · Milestones & timeline (tentative)

| Sprint       | Deliverable                                                                |
| ------------ | -------------------------------------------------------------------------- |
| **S1** (2 w) | Contract coding & unit tests – ContentPassImpl v1, CustodyVault, Factory   |
| **S2**       | Backend Mint-Relay, Stripe webhook, vault mint integration on Base Sepolia |
| **S3**       | Front-end creator wizard + Stripe checkout; Viewer gating API              |
| **S4**       | Claim flow with Paymaster; subgraph indexing; load tests                   |
| **S5**       | Security audit & fixes; creator beta cohort (20 channels)                  |
| **S6**       | Main-net deployment, monitoring dashboards, marketing launch               |

---

## 9 · Acceptance criteria for “prod-ready MVP”

* All KPIs in § 1 reached on staging dataset.
* End-to-end flow demo: creator → publish → viewer buys (Stripe) → playback → claim NFT → view in wallet.
* Audit issues of severity *high* or *critical* fixed.
* Runbook for hot-fix upgrade (UUPS) validated on testnet.
* Post-purchase refund scenario exercised and reconciliation script passes.

---

### Appendix A – API contract samples

*(omitted here for brevity; to be detailed in engineering tickets)*

### Appendix B – Glossary

* **Vault-mint** – immediate mint to CustodyVault when buyer lacks wallet.
* **Claim** – transfer from CustodyVault to buyer’s wallet.
* **EarlyAdopterPass** – genesis NFT unlocking all future gated videos.

---

**END OF PRD v0.9** – please review outstanding TBDs; once confirmed, we’ll open engineering epics and split into tickets.
