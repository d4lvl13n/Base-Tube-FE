# Skeptic — final live verification

**PASS for the remaining refund-copy and image-recovery fixes. No additional generation or credits consumed.** Real Chromium session `final-skeptic`, 28 October 2026. Loaded bundle verified from actual page: `/static/js/main.f31b2fb4.js` (parent reports frontend `8c74fc0`, marketing `a3823f9`).

## Refund and legal navigation

The actual live Refund Policy now says: “Credits can be included in a recurring monthly or yearly subscription, or purchased as a one-time pack.” It explicitly links to “Credits & payments section of our Terms” for free-trial charges, renewal and cancellation, and explains cancellation via the billing portal. Clicked the visible Terms link; it navigates correctly to `/terms`. Footer Privacy, Terms and Refunds links remain plain and accessible. This resolves the previous pack-only coverage mismatch. [Screenshot](13-final-refund.png), [snapshot](final-refund.snapshot.yml).

Exact operating legal identity remains **unknown pending owner confirmation**. Navigation and offer coverage are verified; no operator identity, jurisdiction or legal entitlement was invented.

## Existing real project — unmocked check

Opened only the existing project `f036a4c9-d968-4a09-b558-325a8225e2a0`. No generation initiated. The readable label is now “Original thumbnail · 07:34:31”, replacing the internal version identifier. The actual visible image loads at **1536×864**, `complete=true`, and visually shows the cardboard moon-base thumbnail from the previous real generation. Balance **836**. [Unmocked screenshot](14-final-real-image-human-label.png).

## Controlled network failure probe — distinct from real generation proof

This was an explicitly controlled QA failure of **only this saved thumbnail object's image requests** at `gateway.storjshare.io`. The exact object pathname was matched; no account/server settings or other network traffic were modified. No new generation.

1. Temporarily aborted requests for that image with `connectionreset`, then reloaded the existing project.
2. Observed exactly **3 aborted image requests: initial attempt + 2 automatic retries**. Count remained stable for another 4 seconds, verifying bounded retries.
3. The UI showed: “Your image is saved, but the preview could not load.” Button: **“Reload preview · Free”**. Additional copy: “You can also download the saved image below.” [Controlled failure](15-controlled-image-failure.png).
4. Removed interception, restored unmocked network, clicked the visible free reload button. It showed “Loading your saved image…” while loading. [Loading state](16-controlled-free-reload-recovered.png).
5. The original actual image completed at **1536×864**, `complete=true`; visually inspected the recovered thumbnail. Balance remained **836 → 836**. [Completed recovery](17-controlled-recovery-image-complete.png).

There were **0 generation POST requests** and no `/api/` POST requests in the session request list. Non-generation POSTs were analytics, WalletConnect telemetry and Clerk token refresh only. No storage/cookie contents or signed query strings are included in the artifacts. [Request counts](final-request-counts.json), [probe evidence](final-probe.json).

The earlier unmocked generation remains the proof that actual image generation succeeds. This final controlled test proves error recovery on an existing saved image; it is not represented as another real generation.

No signup, payment, cancellation execution, account settings, new audit or new generation performed. Own Chromium session closed after evidence capture.
