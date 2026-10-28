# Breaker — live retest after fixes

Public retest passed: empty/whitespace title disables the account CTA with an explanation; harmless HTML-looking text stays literal; double-clicking the nonempty CTA leaves the account dialog open; Back/Forward restores the exact draft.

## Real generation

User-authorized existing account. Start fresh, exactly one concept, title `Launch QA breaker: I grew a tiny balcony garden for 20 dollars`. One deliberate double-click on Generate; no resubmit. Browser request evidence contains exactly one successful POST to `/thumbnail-studio/projects/generate`.

- Project: `3937a3a8-36f6-4a91-b625-646d505fe479`
- Operation: `d2b865fd-bea9-4a8d-94d5-69d5f9cc7378`
- Version: `99a75765`
- Credits: **851 → 836**, expected single charge of15.
- Result: **one usable image visibly rendered**, balcony plants with readable `Tiny Balcony Garden for $20`. Snapshot says `1 concept: Ready.` Approximately22 seconds from submit to recorded ready timestamp.
- Evidence: `05-before-generate-851-credits.png`, `06-single-operation-in-progress.png`, `07-generated-thumbnail-836-credits.png`, `generation-requests.txt`. The in-progress screenshot was captured close to completion and may already show the ready result; the waiting/reservation state is recorded in the immediate post-submit snapshot.

## Channel audit

Waiting for root to release the exclusive account audit slot. No audit submitted.

No signup, payment, account settings change, YouTube connection or network mocking performed.
