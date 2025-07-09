📑 PRD — Front-End / UX Layer (v0.9)
0 · Purpose
Ship a React-based web app that lets:

Creators — connect YouTube, mint passes, see earnings.

Viewers — buy with Stripe or crypto, watch gated content, claim NFT.

1 · In Scope
Area	Included
Pages / Routes	/creator/onboard, /creator/passes, /viewer/:passId, /dashboard, /claim
Components	Price-mode wizard, Stripe checkout, Coinbase Wallet connect, Claim modal, Play page with gating overlay
State	React Query + Zustand for auth / pass status
Wallet	wagmi v2 + Coinbase Smart Wallet SDK (embedded)
Styling	Tailwind, shadcn/ui cards, motion animations
i18n	English strings via i18next; currency locale formatting
Analytics	Amplitude events: “pass_created”, “stripe_checkout_succeeded”, “claim_nft”

2 · Out of Scope
Mobile native app (Web PWA only).

Creator livestream gating.

3 · Functional Requirements
3.1 Creator Workflows
#	Requirement	Acceptance
F-C1	OAuth connect YouTube and list unlisted videos	List populates, thumbnail preview loads
F-C2	Choose pricing model & configure	Form validation, defaults shown
F-C3	Publish pass (calls /createPass)	Success toast + shareable link
F-C4	Earnings dashboard	Table: pending, available, withdraw button
F-C5	Edit fixed price before first sale	Input enabled until mintedSupply>0

3.2 Viewer Workflows
#	Requirement	Acceptance
F-V1	Stripe checkout completes → playback auto-starts	Playback within 3 s of redirect
F-V2	Crypto checkout (ETH)	Wallet modal, network switch prompt
F-V3	Dashboard shows pass status (Active / Claimable / Claimed)	Correct badge, claim CTA visible when claimable=true
F-V4	Claim NFT gas-lessly	Progress bar, success dialog with tx link
F-V5	Revisit watch page later	No login friction—JWT cookie resumes session

4 · UI Components (shadcn/ui + Tailwind)
Component	Description
PricingToggle	Radio: Fixed USD, Fixed ETH, Dynamic (curve). Shows relevant fields.
StripePayButton	Uses Stripe Elements; disabled if sold out.
CryptoPayButton	Wraps wagmi write call; displays gas estimate.
ClaimBanner	Card with animation shown in dashboard when claimable.
GatedPlayer	YouTube iframe overlay that polls Gating API; blur + paywall overlay.

5 · State & Data Flow
React Query hooks for:

usePass(id) → /api/pass/{id} (price, availability)

useAccess(creator) → Gating API

useOrders() (viewer dashboard)

WebSocket (or SSE) channel for claim progress updates.

6 · Non-Functional Requirements
Category	Target
Performance	Core Web Vitals LCP < 2.5 s; JS bundle ≤250 KB gz
Accessibility	WCAG AA; keyboard nav, aria labels
Reliability	99 % successful Stripe redirect recovery
i18n	Currency formatted to user locale; USD fallback
SEO	Pass preview OG tags; crawler-safe
Error handling	Global snackbars, retry buttons; Sentry logging

7 · Edge-Case UX
Scenario	UX Behaviour
Price changed while Stripe checkout open	On return, API verifies price; if mismatch, show “Price updated, please retry” page.
Creator paused pass mid-checkout	Stripe button disabled with tooltip “Creator paused sales”.
Claim fails (Paymaster empty)	Banner “Gas sponsor temporarily unavailable – try again later”.
Supply sold out	View page shows “Sold out” pill, disables buy buttons.
Video set Public	Warning banner on video page “Creator must relock video within 24 h”.

8 · Analytics & Events
Event	Properties
pass_created	creator_id, pricing_mode, fixed_price
stripe_checkout_succeeded	user_id, pass_id, price_usd
crypto_mint_succeeded	user_id, pass_id, price_eth
claim_nft	user_id, token_id, time_to_claim
playback_start	user_id, pass_id

9 · Milestones
Sprint	Deliverables
S1	Creator onboarding wizard + YouTube connect
S2	Pass buy page with Stripe button; GatedPlayer overlay
S3	Crypto checkout flow + wallet connect
S4	Viewer dashboard & ClaimBanner
S5	Polish, responsiveness, a11y; metrics instrumentation

10 · Acceptance Criteria
All functional cases in § 3 satisfied on staging.

Lighthouse perf score ≥ 90.

Sentry error rate < 0.5 % sessions.

UX review passes accessibility checklist.

