# Base.Tube – **Epoch NFT & On‑Chain Points System**

### Product Requirements Document *(v1.0, 10 Jul 2025)*

---

## 1. Purpose & Vision

Base.Tube will reward meaningful engagement with **on‑chain, verifiable NFTs** ("Epoch Badges") and future \$TUBE token streams.
The system must be:

* **Transparent** – all points & rewards are cryptographically verifiable on Base.
* **Cheap** – one low‑gas root update per day/week; users pay once to sync.
* **Sybil‑aware** – points count only when users interact in ≥ 2 categories.
* **Composable** – badges provide multipliers for future on‑chain rewards.
* **Grant‑friendly** – showcases Base/ Coinbase tech best‑practices.

## 2. High‑Level Scope

| Layer                        | Ownership       | Delivered?               | Notes                                      |
| ---------------------------- | --------------- | ------------------------ | ------------------------------------------ |
| **Solidity smart‑contracts** | Blockchain team | ✅ Draft v1 (4 contracts) | Upgradeable, audited patterns              |
| **Off‑chain Aggregator**     | Backend         | ⬜                        | Cron job builds Merkle root & pushes daily |
| **Frontend dApp**            | Web team        | ⬜                        | Wallet UX for sync + claim                 |
| **Rewards Vault**            | Tokenomics      | ⬜ (optional for S1)      | TubeBooster streams \$TUBE                 |

## 3. Functional Requirements

1. **Point Tracking**
   *Raw events* (views, comments, uploads, likes, watch‑time, creator bonus) are ingested continuously. 24‑hour cron job aggregates *cumulative* totals **per wallet & category** and publishes a Merkle root on‑chain.
2. **Eligibility Rule**
   A wallet’s totals count only if at least **two categories have non‑zero points**.
3. **User Sync**
   Anyone may prove a Merkle leaf (`wallet, season, totals[6]`) once per season. The contract stores only the *highest* total.
4. **Epoch Badge Minting**
   When a synced total crosses a threshold, the user can mint the badge for that rank & season. One badge per rank per season.
5. **Multipliers**
   Every rank has a on‑chain `multiplierBps` (e.g. 10000 = 1×, 20000 = 2×) consumed by future reward modules.
6. **Optional \$TUBE Streaming**
   Users may stake their badge(s) in **TubeBooster** to earn a pro‑rata stream of \$TUBE tokens.

## 4. Smart‑Contract Suite (delivered)

| Contract                   | Role                                                                | Gas Benchmarks           | Upgradeability            |
| -------------------------- | ------------------------------------------------------------------- | ------------------------ | ------------------------- |
| **PointsRootRegistry**     | Stores Merkle root per season (single tx per checkpoint).           | \~40k gas                | UUPS, `ROOT_UPDATER_ROLE` |
| **PointsLedger**           | Users prove totals (`sync()`); enforces ≥ 2‑category rule.          | \~80k gas/sync           | UUPS, `owner` upgrades    |
| **EpochBadges (ERC‑1155)** | Badge minting, thresholds, multipliers, optional soul‑bound switch. | \~50k gas/claim          | UUPS                      |
| **TubeBooster**            | Continuous \$TUBE emission weighted by badge multiplier.            | stake \~75k, claim \~45k | UUPS                      |

All contracts compile under **Solidity 0.8.24**, use OpenZeppelin 5.x‑upgradeable, and include comprehensive NatSpec.

## 5. Data Flow

```mermaid
flowchart TD
    A[Raw Engagement Events] --> B[Off‑chain Aggregator]
    B -->|Daily| C(Merkle Root)
    C -->|updateRoot| R[PointsRootRegistry]
    U[User] -->|sync() + proof| L[PointsLedger]
    U -->|claim()| E[EpochBadges]
    U -->|stake()| TB[TubeBooster]
    TB --> U
```

## 6. Ranks & Thresholds *(Season 1 defaults)*

| Rank (id)             | Threshold (pts) | Multiplier (BPS) |
| --------------------- | --------------- | ---------------- |
| 0 Rising Voyager      | 0               | 10 000           |
| 1 Engaged Contributor | 50              | 12 500           |
| 2 Community Builder   | 250             | 15 000           |
| 3 Platform Pioneer    | 500             | 18 000           |
| 4 Innovative Icon     | 1 250           | 22 000           |
| 5 Base.Tube Legend    | 2 500           | 30 000           |

*(Editable via admin calls.)*

## 7. Security & Compliance

* **Re‑entrancy**: none; external transfers occur after state changes.
* **Overflow**: Solidity 0.8 checked; totals stored in `uint248`.
* **Access Control**: Roles via OZ `AccessControl`; only multisig owner can upgrade.
* **Sybil Mitigation**: ≥ 2‑category rule, optional Gitcoin Passport gate.
* **Soul‑bound toggle**: `transfersLocked` flag in EpochBadges.
* **Regulatory**: badges are loyalty collectibles; \$TUBE streaming treated as rewards, not interest.

## 8. Deployment Checklist

1. **Choose addresses** for multisig owner & root‑updater signer.
2. Deploy **PointsRootRegistry** → grant roles.
3. Deploy **PointsLedger** (arg = registry).
4. Deploy **EpochBadges** (arg = ledger) → set season 1 URI, thresholds, multipliers.
5. (Optional) Deploy **TubeBooster** after \$TUBE ERC‑20.
6. Verify & publish source on Basescan.
7. Configure CI to run Slither + Foundry tests on every PR.

## 9. Backend Tasks

* Build aggregator (**Node/TS + SQL**) to roll totals, enforce ≥ 2‑category filter.
* Generate Merkle tree (ethers.utils.MerkleTree) and call `updateRoot()` daily.
* Expose `/proof` API so the dApp can fetch leaf + proof for a wallet.

## 10. Frontend Tasks

* Wallet connect; detect current season & synced status.
* **Sync button** (calls `PointsLedger.sync()`).
* **Claim UI**: shows locked/unlocked ranks, gas estimate.
* (Later) **Stake UI** for TubeBooster claim stream.

## 11. Testing & Acceptance Criteria

* **Unit tests** (Foundry): ≥ 90 % coverage, no revert on happy path.
* **Static analysis**: Slither – 0 High, 0 Medium findings.
* **Gas report**: claim ≤ 60 k on Base testnet.
* **End‑to‑end**: local anvil fork + scripted daily root + UI smoke test.

## 12. Timeline *(draft)*

| Week | Deliverable                                       |
| ---- | ------------------------------------------------- |
| 1    | Repo scaffold, contracts compiled & tests passing |
| 2    | Aggregator prototype, root push on Base testnet   |
| 3    | Front‑end sync/claim flows, QA                    |
| 4    | Audit (internal + external) & fix                 |
| 5    | Mainnet deploy, announce, apply for Base grant    |

## 13. Open Questions / Decisions

1. Final cadence for root updates (daily vs weekly).
2. Whether to launch TubeBooster in Season 1 or delay to Season 2.
3. Additional sybil safeguards (e.g. wallet age, passport score ≥ 15).
4. Governance process for updating thresholds & multipliers.

---

*Document owner: CTO / Blockchain Lead.*

> **Next‑step for developers:** Pull latest main branch, run `forge test -vv`, review aggregator sample script, and start integrating sync/claim flows in the React dApp.


Great – thanks for the answers. The work now breaks down into three clear tracks:

────────────────────────────────────────
A. On-chain deployment (Base Sepolia)
────────────────────────────────────────
1. Tooling  
   • I’ll add a Foundry tool-chain (lightweight + fast) with `foundry.toml`, plus an NPM script for install/test/deploy.  
   • Network entry for Base Sepolia (chain-id 84532, RPC from env var `BASE_SEPOLIA_RPC_URL`).

2. Deployment script (`script/DeployEpochSystem.s.sol`) creates, in order:  
   • PointsRootRegistry → grant ROOT_UPDATER_ROLE to a signer you specify  
   • PointsLedger (needs registry address)  
   • EpochBadges  (needs ledger address)  
   • TubeBooster (needs \$TUBE ERC-20 address – if not live yet we leave that param blank and initialise later).  
   The script prints addresses to `deployments/base-sepolia.json` so frontend & backend can import them.

3. Input I still need:  
   • The wallet address that will be `DEFAULT_ADMIN_ROLE` (upgrades)  
   • The wallet address that will be the daily root updater  
   • Base Sepolia RPC URL (just for the script; you don’t have to paste it here)  
   • (Optional) existing \$TUBE token address; otherwise we’ll deploy TubeBooster but skip initialisation.

────────────────────────────────────────
B. Backend aggregator & proof API
────────────────────────────────────────
1. Cron / worker (`src/cron/generatePointsRoot.ts`)  
   • Query `UserPoints` table, compute per-user per-category totals.  
   • Filter wallets that touch ≥ 2 categories.  
   • Build Merkle tree (`keccak256(abi.encodePacked(wallet, season, totals))`).  
   • Push root on-chain with the updater key (via ethers.js & private key in env).  
   • Persist leaves & proofs to a `points_merkle_leaves` table (or a simple S3/Redis blob).

2. REST endpoint (Express controller)  
   `GET /api/v1/points/proof?wallet=0x…&season=1` → `{ totals:[u32;6], proof:string[] }`

3. I’ll scaffold the worker + endpoint but leave the exact DB schema / scheduler to you.

────────────────────────────────────────
C. Front-end integration (MomentNFTMint)
────────────────────────────────────────
1. Hooks:  
   • `usePointsProof(wallet)` → fetch proof JSON.  
   • `useSyncPointsLedger` (wagmi write)  
   • `useClaimBadge` (wagmi write)

2. Flow in UI:  
   – When `Mint` clicked → show spinner  
   – Fetch proof → call `sync()`; wait for tx receipt  
   – On success call `claim()`; wait for receipt  
   – Success toast; disable button.

3. Rank list: keep current static thresholds until we read them on-chain later.

────────────────────────────────────────
QUESTIONS still open
────────────────────────────────────────
1. Admin & updater addresses (see A-3).  
2. Season number to start with (default `1`?).  
3. Do you want the proof endpoint to sign responses (e.g. EIP-712) or plain JSON is fine for now?  
4. Any naming preference for the cron job location / schedule (e.g. run at 02:00 UTC daily)?

Let me know these details and I’ll start committing the deployment & backend scaffolding.




What remain to do 10 July : 

## 🔍 **Thorough Analysis: Backend vs Smart Contracts**

Let me dissect the gap between your existing points system and the smart contracts...

---

## 📊 **Current Backend Points System**

### **Points Categories (6 total)**
```typescript
// From UserPointsService.ts
1. videoUploadPoints    = videoCount * 5
2. commentPoints        = commentCount * 2  
3. videoViewPoints      = viewCount * 0.1
4. likePoints          = likeCount * 0.5
5. watchTimePoints     = totalWatchTimeSeconds / 60
6. uploaderBonusPoints = totalUploadedVideoViews * 0.05
```

### **Current Ranks & Thresholds**
```typescript
// From UserPointsService.ts
0-49:    "Rising Voyager"
50-249:  "Engaged Contributor" 
250-499: "Community Builder"
500-1249: "Platform Pioneer"
1250-2499: "Innovative Icon"
2500+:   "Base.Tube Legend"
```

---

## 🔗 **Smart Contract Expectations**

### **PointsLedger.sol Requirements**
```solidity
// Expects exactly 6 categories in uint32[6] array
function sync(
    address user,
    uint16  season,
    uint32[6] calldata totals,  // ← Must match backend categories
    bytes32[] calldata proof
) external
```

### **EpochBadges.sol Thresholds**
```solidity
// rank → points threshold (0, 50, 250 …)
mapping(uint8 => uint248) public rankThreshold;
```

---

## ✅ **What's PERFECTLY Aligned**

### **1. Rank Thresholds Match Exactly**
- Backend: `0, 50, 250, 500, 1250, 2500`
- Contract: Configurable via `setRankThreshold()`
- **Status**: ✅ Perfect alignment

### **2. Six Categories Architecture**
- Backend: 6 distinct point categories
- Contract: `uint32[6] calldata totals`
- **Status**: ✅ Perfect alignment

### **3. Anti-Gaming Logic**
- Backend: Already prevents single-category farming via weighted scoring
- Contract: `require(mask & (mask - 1) != 0, "need >=2 categories")`
- **Status**: ✅ Aligned intent, different implementation

---

## ❌ **Critical Gaps Identified**

### **🚨 Gap #1: Points Data Type Mismatch**

**Backend**:
```typescript
// Points are FLOAT values
watchTimePoints = totalWatchTimeSeconds / 60;  // 123.45 points
uploaderBonusPoints = totalUploadedVideoViews * 0.05;  // 67.89 points
```

**Contract**:
```solidity
uint32[6] calldata totals  // Only accepts INTEGERS
```

**Impact**: **CRITICAL** - You'll lose precision on fractional points.

### **🚨 Gap #2: No Wallet-to-User Mapping**

**Backend**: Points tied to `userId` (string)
**Contract**: Points tied to wallet `address`

**Missing**: 
- How do you map `userId` → `wallet address`?
- What if user has multiple wallets?
- What if user doesn't have a wallet?

### **🚨 Gap #3: Missing Backend Aggregator**

**Contract expects**: Daily Merkle root updates via `updateRoot()`
**Backend has**: Real-time points calculation, no aggregation system

**Missing Infrastructure**:
- Daily cron job to aggregate all user points
- Merkle tree generation
- Proof generation API endpoint
- Root pushing mechanism

### **🚨 Gap #4: Season Management**

**Contract**: Season-based system (`uint16 season`)
**Backend**: No season concept, just cumulative points

**Questions**:
- When does Season 1 start/end?
- Do points reset between seasons?
- How do you handle season transitions?

---

## ⚠️ **Medium Priority Gaps**

### **1. Points Precision Loss**
```typescript
// Backend calculation
watchTimePoints = 3723 / 60 = 62.05 points

// Contract will receive
totals[4] = 62  // Lost 0.05 points
```

### **2. Category Order Must Be Fixed**
The `uint32[6]` array order must be consistent:
```typescript
// Must always be this exact order:
[videoUploadPoints, commentPoints, videoViewPoints, 
 likePoints, watchTimePoints, uploaderBonusPoints]
```

### **3. No Real-Time Sync**
- Backend: Points update immediately
- Contract: Points sync only when user manually triggers

---

## 🛠️ **Required Implementation Work**

### **1. Backend Aggregator Service** (4-6 hours)
```typescript
// src/services/epochAggregatorService.ts
export class EpochAggregatorService {
  async generateDailyRoot(season: number): Promise<string> {
    // 1. Get all users with points
    // 2. Convert float points to uint32
    // 3. Filter users with >=2 categories
    // 4. Generate Merkle tree
    // 5. Push root to contract
    // 6. Store proofs for API
  }
}
```

### **2. Proof API Endpoint** (2 hours)
```typescript
// GET /api/v1/points/proof?wallet=0x...&season=1
{
  totals: [50, 20, 15, 10, 62, 8],  // uint32 values
  proof: ["0xabc...", "0xdef..."]   // Merkle proof
}
```

### **3. Wallet Mapping System** (3 hours)
```typescript
// New table: user_wallets
// Links userId to wallet addresses
```

### **4. Frontend Integration** (3 hours)
```typescript
// Wire existing MomentNFTMint to:
// 1. Fetch proof from API
// 2. Call sync() on PointsLedger
// 3. Call claim() on EpochBadges
```

---

## 🎯 **My Brutal Assessment**

### **Time to Ship**: 12-16 hours (not 1 day)

### **Complexity Score**: 7/10
- Not trivial, but not impossible
- Most work is in backend aggregation
- Frontend changes are minimal

### **Risk Level**: MEDIUM
- Precision loss might confuse users
- Wallet mapping adds complexity
- Season management needs design decisions

---