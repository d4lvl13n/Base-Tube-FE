# Handoff — FE↔BE Contract Fixes (Web)

**Date:** 2026-06-10
**Source:** full FE↔BE contract audit (5 parallel reviews) of this repo against the backend at `base-be` (`main`, commit `a2c5022`).
**Goal:** close every frontend/backend contract mismatch before onboarding real users.

A matching backend handoff lives at `base-be/docs/HANDOFF_POST_AUDIT_FIXES.md`. Items marked **[BE-paired]** depend on (or are alternatives to) a backend fix listed there — coordinate before starting them.

> **STATUS (updated 2026-06-10): Sprints 1, 2 and 3.1 are DONE** (Sprint 1: `a04602f`; Sprint 2: `e6ebe36`; toolchain revival incl. 6 runtime bug fixes: `ad41c36` — `npm run typecheck` now works and must stay green). Remaining: **3.2 (env hygiene/MSW mocks) and 3.3 (stale branch cleanup)**, plus the CI tripwire + nightly canary from `base-be/docs/MOBILE_CONTRACT_SURFACE.md`. Original banner kept below for history.
>
> ~~**STATUS (2026-06-10): Sprint 1 is DONE**~~ (commit `a04602f`; BE counterparts in base-be `8f936f0`/`a2fe8a7`), and the mobile monorepo work (`feat/mobile-auth-screens`) has been **merged into `main` and the branch deleted** — `main` is now the single branch carrying both the web app (`src/`) and the Expo mobile app (`apps/mobile` + `packages/api-sdk`). **Start with Sprint 2**, ideally pulling 3.1 (TS toolchain) forward — it's what let the Sprint 1 bugs ship undetected. The Sprint 1 sections below are kept for context/verification.

## Read this first

- **Everything lives on `main`** (web + mobile monorepo). Web deploys build the CRA app from `src/`; the mobile app and SDK live in `apps/mobile` / `packages/api-sdk` and don't affect the web bundle. Note for CI: root `package.json` now declares npm workspaces, so `npm ci` also installs mobile deps.
- Line numbers below are accurate as of `main@1dd9e97`; treat them as anchors, not gospel.
- Everything here was verified by reading both codebases — each item says exactly what the backend sends.

---

## Sprint 1 — Broken user-facing flows (fix first, ~2–3 days)

### 1.1 Web3 onboarding throws `ReferenceError` (CRITICAL)
- **Where:** `src/api/web3authapi.ts` — calls `retryWithBackoff(...)` at 3 call sites but never imports it. The function exists at `src/utils/errorHandler.ts:365`.
- **Impact:** username suggestions (`useGeneratedName.ts:24`), username update (`:56`), and web3 logout all crash. Web3 onboarding cannot complete.
- **Fix:** add `retryWithBackoff` to the import from `../utils/errorHandler`.
- **Why it shipped:** the toolchain can't type-check (see 3.1) — do 3.1 in the same sprint if possible.
- **Accept:** new web3 wallet can complete onboarding end-to-end; `tsc --noEmit` (after 3.1) passes.

### 1.2 Trending infinite scroll never loads page 2
- **Where:** `src/hooks/useTrendingVideos.ts:157` reads `response.data.hasMore` / `response.data.total` — but `response.data` is the videos **array**; the backend returns `hasMore` and `total` at the **top level**: `{ success, data: Video[], total, hasMore }` (`base-be/src/controllers/VideoController.ts:479-484`).
- **Fix:** read `response.hasMore` / `response.total` (the api layer already returns the envelope). Also fix the `TrendingVideoResponse` type in `src/types/video.ts` to match.
- **Accept:** trending feed paginates past 20 items.

### 1.3 Like counter renders 0 on video load
- **Where:** `src/components/pages/SingleVideo.tsx:104-107` reads `video.like_count`.
- **Backend sends:** `likes_count` (DB column, `GET /api/v1/videos/:id`). The toggle response `{ isLiked, likesCount }` is correct and already matches.
- **Fix:** read `video.likes_count`.
- **Accept:** like count is correct on first paint, before any toggle.

### 1.4 Credits balance silently empty after refresh
- **Where:** `src/api/credits.ts:19` reads `response.data.data.creditInfo`.
- **Backend sends:** `{ data: { balance: {...}, pricing } }` (`base-be/src/controllers/CreditController.ts:23-29`). There is no `creditInfo` key.
- **Fix:** map `data.balance` (+ `pricing`) into the shape `usePublicThumbnailGenerator.ts:326-330` expects. Same fix for `getCreditLedger` (`credits.ts:24-27` reads `data.ledger`; backend sends `data.entries`).
- **Accept:** credit balance shows after `refreshCreditBalance()`.

### 1.5 Signed-URL playback unwrap (latent, will break first S3/CDN-tier video)
- **Where:** `src/api/pass.ts:69-74` reads `response.data.signed_url`.
- **Backend sends:** `{ success: true, data: { signed_url } }` (`base-be/src/controllers/PassController.ts:264-267`).
- **Why it hasn't blown up:** every pass video today is `storage_tier: 'external'` and routes through play-token. The first standard/premium/cdn video hits this.
- **Fix:** read `response.data.data.signed_url`. Keep the `USE_PLAY_TOKEN` 400 fallback (that part is correct).
- **Accept:** unit test covering both envelope shapes.

### 1.6 Thumbnail gallery: wrong field casing, phantom fields
- **Where:** `ThumbnailCard.tsx:114` (`is_used`), `ThumbnailDetailDrawer.tsx:110-111, 252, 327, 371, 394` (`prompt`, `created_at`, `is_used`, `download_count`), type `ThumbnailItem` (`src/types/thumbnail.ts:142-160`).
- **Backend sends:** camelCase — `isUsed`, `downloadCount`, `createdAt`, `channelHandle`, `id` = the **short_id string** — and **never sends `prompt`/`storj_key`/`video_id`/`config`** (`base-be/src/controllers/ThumbnailController.ts:1048-1059, 1131-1144`).
- **Fix:** align reads + type to camelCase; remove or feature-flag the prompt panel (or ask BE to add `prompt` to the gallery serializer).
- **Note [BE-paired]:** gallery `?search=` currently 500s on the backend (MySQL has no `ILIKE`) — BE item 1.3 fixes that; don't debug it from the FE side.
- **Accept:** "used" badge, date, download count render correctly.

### 1.7 Comment pin/unpin **[BE-paired]**
- **Where:** `src/api/comment.ts:74-99`. Pin calls `POST /api/v1/comments/:id/pin` (route doesn't exist on BE yet — BE item 1.1 adds it). Unpin is triple-broken: raw `fetch()` against the FE origin (ignores `REACT_APP_API_URL`), missing `/v1`, no auth header.
- **Fix:** rewrite `unpinComment` to use the shared axios client at `/api/v1/comments/:id/unpin`. Coordinate with BE item 1.1 (routes are being added; controllers already exist).
- **Accept:** pin + unpin work from `CommentPanel`.

### 1.8 Subscribe button state never updates **[BE-paired]**
- **Where:** `src/hooks/useChannelSubscription.ts:27,37` reads `data.channel.id` / `data.channel.handle`.
- **Today's backend bug:** subscribe/unsubscribe responses are double-nested `{ success, channel: { success, channel: {...} } }`, so those reads are `undefined` and the React Query cache key `['channel', undefined]` gets written instead of the real one.
- **Plan:** BE item 1.2 flattens (and sanitizes) the response to `{ success, channel: {...} }`. After that lands, the existing FE code works as-is — **verify, don't change FE first**. If you must ship FE-only ahead of BE, read `data.channel.channel` defensively.
- **Accept:** clicking Subscribe flips the button and count without a page refresh.

---

## Sprint 2 — Error handling, types, dead code (~2–3 days)

### 2.1 Error-code classification clobber
- **Where:** `src/utils/errorHandler.ts:105` — `errorCode = this.mapStringToErrorCode(responseData.error.code) || errorCode`. `mapStringToErrorCode` never returns falsy (falls back to `UNKNOWN_ERROR`), so any backend code missing from the FE enum **overwrites** the status-derived classification. A 401 with code `AUTHENTICATION_ERROR` becomes `UNKNOWN_ERROR` and loses the "Sign In" recovery action.
- **Fix:** make `mapStringToErrorCode` return `null` for unknown codes (keep the status-derived value), and add the backend's vocabulary to `src/types/error.ts`: `INTERNAL_ERROR`, `AUTHENTICATION_ERROR`, `BAD_REQUEST`, `TOO_MANY_REQUESTS`, `DUPLICATE_ENTRY`, `FILE_UPLOAD_ERROR`.

### 2.2 CTR engine classifies errors by message text
- **Where:** `src/hooks/useCTREngine.ts:177-188` does `message.includes('QUOTA_EXCEEDED')` etc. The backend sends those tokens in `error.code`, with human-readable messages ("Daily audit limit of N reached.").
- **Fix:** classify on the already-parsed `error.code` (`:167`) for `QUOTA_EXCEEDED`, `RATE_LIMIT`, `AUTHENTICATION_REQUIRED` — same as the existing `INSUFFICIENT_CREDITS` handling.

### 2.3 Purchase error map gaps
- **Where:** `src/utils/passErrorMessages.ts` PASS_ERROR_MAP.
- **Fix:** add curated copy for `BLACKLISTED`, `PASS_SOLD_OUT`, `PASS_NOT_ONCHAIN`, `PASS_SALE_INACTIVE`, `CRYPTO_QUOTE_FAILED`, `CHECKOUT_CREATE_FAILED`, and the new `WALLET_NOT_LINKED` (BE item 1.6 introduces it for "publish paid pass without a linked wallet"). Add a pre-submit wallet check in `CreateContentPass` using `getMyWallet` so creators see "link your wallet" *before* publishing fails.

### 2.4 Settings avatar upload fails silently
- **Where:** `SettingsTab.tsx:94-109` — `updateProfileMutation` has no `onError`.
- **Fix:** add `onError` with a toast (BE item 1.4 makes the invalid-image case a proper 400 with a message).

### 2.5 Delete the dead API surface (each is a future 404)
Verified unused by any component, all pointing at routes that don't exist on the backend:
- `src/api/auth.ts` — entire file (`/api/auth/*`, unversioned, no importers)
- `src/api/pass.ts`: `purchaseContentPass` (`/passes/:id/purchase`), `getUserPasses` (`/passes/my` — real route is `/passes/me`), `checkPassAccess` (`/passes/:id/access` — real pattern is `GET /api/v1/access?passId=`)
- `src/api/onchainPass.ts`: `buyWithCrypto` + `useCryptoCheckout` (`/passes/:id/crypto`) — and the `REACT_APP_CRYPTO_USE_RELAYER` env flag that only they read
- `src/api/video.ts`: `getNFTVideos` (`/videos/nft`)
- `src/api/profile.ts`: `getProfileNFTs` (`/profile/nfts`)
- `src/api/analytics.ts`: `getCreatorWatchHours` deprecated path (`/analytics/watch-hours`), `getLikeViewRatio` (missing `/channels` segment)
- `src/api/onboarding.ts`: `getOnboardingStatus` (`GET /web3auth/onboarding/status` — BE only has `POST /onboarding/complete`)
- `src/api/channel.ts`: `getChannelAnalytics` (`/channels/:id/analytics` — no such route)
- `src/api/batchupload.ts:64-67`: `getVideoStatus` (`/videos/:id/status` — real routes are `/videos/progress/:videoId` and `/videos/batch/status/:batchId`)

### 2.6 Type drift — make the types tell the truth
- `src/types/video.ts`: `video_path`, `thumbnail_path`, `processed_video_paths`, `user_id` are **stripped by the backend everywhere** — remove them (or mark optional+deprecated). `VideoStatus` union is missing `'processed'` (backend passes the raw DB value through the progress endpoint).
- `src/types/pass.ts`: remove `reserved_count` (stripped by BE); **add `lock_address` and `payment_token`** (the Unlock fields BE now sends and `useOnchainPass` consumes untyped).
- `src/types/onchainPass.ts:139-151`: `CryptoQuote` — confirm it matches the Unlock shape `{ purchase_id, reservation_id, expires_at, buyer, lock_address, payment_token, key_price, chain_id }`.
- FE `PurchaseStatus` union: add `refunded | disputed | not_found` (display copy already handles them).
- `UpdateUsernameResponse`: backend returns `{ message }` only — drop `username`.
- `WatchTimeData`: consumers read `totalWatchHours` (correct); fix the type that says `totalWatchTime`.

### 2.7 Sold-count display **[BE-paired — decision needed]**
- FE computes `totalSold = minted_count + reserved_count` in 5 places (`CreatorPassCard.tsx:19`, `PassDetailView.tsx:87`, `PassesOverview.tsx:22`, `PassDetailsPage.tsx:186,494`, `V2HomePage.tsx:323`) but BE strips `reserved_count` → dashboards under-report pending Stripe sales.
- **Decide with BE:** either BE exposes an aggregate `sold_count` (recommended; keeps `reserved_count` internal) or creator-only endpoints return `reserved_count`. Then update the 5 call sites.

### 2.8 Misc small ones
- `useOnchainPass.ts:462` — `getExplorerTxUrl(chainId, hash)` args are swapped (signature is `(hash, chainId)`, `src/utils/purchaseStatus.ts:175`).
- Watch-hours "all-time" tab actually requests `period=30d` (`src/api/analytics.ts:334` defaults it); FE also reads a `trend` field BE never sends. Either request `period=all`… (BE supports omitting period = all) or label the tab 30d. Drop the fabricated trend or ask BE for it.
- Channel-image client validation allows 5MB + GIF; backend rejects >3MB and GIF with 400 (`base-be/src/routes/channelRoutes.ts:36-58`) — align client validation to 3MB/no-GIF.
- `usePublicThumbnailGenerator.ts:133` falls back to `http://localhost:3001` — use the shared api client convention.
- View-tracking: backend can 409 (`View count update conflict`); `useViewTracking.ts:98-100` only logs. Add one retry. (BE is also moving to atomic increments, after which 409s disappear.)

---

## Sprint 3 — Toolchain & repo hygiene (~1–2 days)

### 3.1 Type-checking is dead — this is how 1.1 shipped
- Installed TypeScript is 4.9.5 while `tsconfig.json` uses TS5-only options (`moduleResolution: "bundler"`, `allowImportingTsExtensions`) → `tsc --noEmit` errors on the config itself and never checks a single source file. CRA/Babel transpiles without checking.
- **Fix:** upgrade `typescript` to ^5.x (CRA 5 tolerates it with `--legacy-peer-deps`, already required by this repo), make `npx tsc --noEmit` pass, then add it as a CI step / pre-push hook so contract drift like 1.1–1.6 can't ship silently again.

### 3.2 Env hygiene
- Add `.env.example` documenting: `REACT_APP_API_URL`, `REACT_APP_CLERK_PUBLISHABLE_KEY` / `REACT_APP_CLERK_FRONTEND_API`, `REACT_APP_WALLETCONNECT_PROJECT_ID`, `REACT_APP_ONCHAINKIT_API_KEY`, `REACT_APP_SHOW_PASSES`. Remove `REACT_APP_CRYPTO_USE_RELAYER` and `REACT_APP_CONTENT_LEDGER_ABI_URL` (legacy pre-Unlock).
- MSW mock handlers define endpoints that don't exist on the backend (`/api/v1/auth/refresh`, `/api/v1/users/me`, `/v1/images/quota/increment`, `/api/v1/premium-content`) — tests pass against fiction; align or delete.

### 3.3 Branch consolidation (mirror of the backend cleanup)
- ~~Rebase `feat/mobile-auth-screens` onto `main`~~ **DONE** — merged into `main` and deleted (2026-06-10).
- Audit + delete remaining merged/stale branches: `feature/phase-1-*`, `feature/pass-as-link`, `feature/analytics-tab-restructure`, `feature/task-1.2/1.3-*`, `feature/technical-excellence`, `cursor/mobile-monorepo-phase1-cdb4`, `cursor/dev-env-setup-a0ce` (already cherry-picked to base-be), and prune the 4 orphaned `~/.codex/worktrees/*` + the `claude/friendly-bohr-d36868` worktree.

---

## Verification checklist (run after each sprint)

1. `npx tsc --noEmit` (after 3.1) and `npm test`.
2. Manual smoke against local BE (`base-be` on :3000): web3 wallet onboarding end-to-end; trending scroll past page 1; like a video (count correct pre/post toggle); buy a pass with Stripe test card; crypto buy on Base Sepolia (USDC approve + Lock.purchase); play an external pass video (play-token); pin/unpin a comment; subscribe/unsubscribe; upload avatar (valid + invalid file); generate a thumbnail and check the credits counter.
3. Confirm prod deploy uses `main` and `REACT_APP_API_URL=https://beta.base.tube`.
