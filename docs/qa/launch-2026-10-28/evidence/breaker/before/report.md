# Breaker baseline — 28 October 2026

Real isolated Chrome, normal network, anonymous production visitor. No mocks, account creation, terms acceptance, payment, generation or real audit.

## Finding: repeated account CTA clicks appear to do nothing (P2)

At `/ai-thumbnails/generate`, a double-click on **Create a free account to generate** left the same brief visible without an account dialog or useful feedback. This happened with both an empty title and `<script>alert(1)</script> Floor is lava`. As a control, a normal title and **one click** opened **Generating needs a free account**, with **Create my free account** and **I already have an account**.

The exact cause is for root to confirm. The observation supports repeated-click accidental dismissal; it does **not** establish that the single-click signup bridge is broken. The initial broader hypothesis was withdrawn.

Evidence: [double-click result](04-html-text-cta.png), [single-click control](05-single-click-opens-account-gate.png), snapshots copied alongside the report.

## Checks that passed

- HTML-looking text appeared literally; no script alert executed.
- Browser Back from Create went to Projects; Forward returned to Create with the draft intact.
- Double-clicking the marketing footer Studio link reached one projects screen; no duplicate work or charge occurred.

## Route and limit

`beta /ai-thumbnails` → marketing landing → visible footer **Studio** → anonymous Projects → sidebar **Create** → idea input → account gate. First generated thumbnail and channel audit remain unverified in this public baseline. Root will coordinate the authenticated continuation with the existing authorized account.

No claim is made about overlong-input or invalid-URL validation; these were not exercised in this bounded baseline. Browser session `launch-breaker` was closed to reduce resource use; artifacts are retained.
