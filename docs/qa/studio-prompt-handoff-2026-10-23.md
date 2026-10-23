# Studio idea links and auth/checkout handoff — 23 October 2026

## Behavior

- On the signed-in create screen: a valid explicit visitor `draft` takes precedence, then `prompt`, then the saved draft. A prompt starts a fresh brief with a maximum 500-character title.
- The create screens consume `prompt` and `site_ref` with replace navigation. Other URL parameters are preserved. Visitor links become `generate?draft=<id>` before authentication, so edits survive the handoff.
- Auth saves the visitor form before reading its draft identity. The return-path allowlist preserves only a validated draft ID on `/ai-thumbnails/generate`; it does not forward prompt, site_ref, ref, or external redirect URLs.
- A selected trial carries the same draft return path through the plan intent, checkout request and remembered checkout destination. A failed checkout preserves the return path on the pricing page.
- Billing success returns automatically to the create screen only after the plan and credits are ready. It does not start generation. Other checkout destinations retain the existing confirmation page.
- `site_ref` is not a referral code. No new analytics event was added.

The existing "Create a free account to generate" button opens authentication. It does not select a subscription. The creator selects a trial separately; that selection continues to be required.

## Validation

- Six targeted suites: 88 tests passed (prompt precedence, refresh after edits, explicit draft, 500-character bound, script payload as text, auth return, trial checkout handoff, billing readiness).
- Studio regression selection (`CTREngine|studioDraft|studioAuth|studioEntry|studioCreation`): 36 suites / 306 cases initially, with one obsolete expectation for the previously bare sign-in return path. Updated that expectation to the explicit draft URL; all 15 StudioSignIn cases pass.
- Extended the real BuyCreditsModal component test to cover the post-sign-up trial from `generate?draft=visitor-idea`; all 11 modal cases pass. Total verified regression cases: 307 across 36 suites.
- `CI=false npm run build`: passed, with existing warnings outside the changed production files. The first CI-mode attempt rejected the repository's existing warnings.
- `git diff --check`: passed.

Auth and checkout component tests simulate Clerk state, Stripe checkout responses and subscription webhook readiness. They are not evidence of a real provider checkout.

## Remaining real-provider acceptance

Read-only credential probes found Clerk development access working (HTTP 200), but the Stripe test key from backend `.env.development` returned HTTP 401. No Stripe session or subscription was created. The user was asked to update the local test key or provide a functioning test environment; secrets must not be sent in chat.

After a valid test setup is available:
1. Open `/ai-thumbnails/generate?prompt=Floor%20is%20lava&site_ref=homepage-hero` signed out.
2. Edit the idea, click "Create a free account to generate", and complete test sign-up.
3. Select the free trial, complete Stripe test checkout, and wait for webhook credits.
4. Confirm automatic return to the Studio with the edited idea, no generation started, and edits preserved after refresh.
5. Repeat the authentication portion with an existing test account.

## Release

Frontend-only release, authorized on 23 October 2026. No backend change or database migration is needed. The real Stripe acceptance limitation above remains open. Deployment uses a new static directory, checksum verification, and an atomic exchange with the current frontend; the previous directory is retained for rollback.
