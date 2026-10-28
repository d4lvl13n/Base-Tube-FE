# Literal-English persona — baseline

Real isolated browser session: `launch-literal`. Fresh logged-out visitor. No source code was inspected during this journey, and no network requests were mocked.

## Journey

1. Opened `https://beta.base.tube/ai-thumbnails`; redirected to the marketing landing at `https://base.tube/ai-thumbnails`.
2. Read the thumbnail promise and followed the hero **Start 7-day free trial** link.
3. Reached the Creator trial signup form and stopped before account creation. No credentials, terms acceptance, payment or generation were performed.

## Findings

- **P1 — Missing charge amount/cadence.** The page states: “Next: secure checkout for your 7-day free trial of Creator, 2 videos included. Your card is charged on day 8 unless you cancel.” No price or billing period is visible on this screen.
- **P2 — “2 videos” is an unexplained unit.** This product promises thumbnails, but signup describes the allowance as videos. A literal reader cannot tell from this page how many images/edits/reviews are included.
- **P2 — No direct price/policy links on signup.** There is no Pricing, Terms or Privacy link in the full visible signup page. A question forces the visitor back to marketing rather than a direct explanation.

## Evidence

- [Landing](01-landing.png)
- [Full signup screen](02-signup-videos-charge-wording.png)

## Acceptance boundary

**First success not reached.** New-account signup and card-backed checkout need an authorized test account/user handoff. This gate is not classified as a product error merely because this QA persona cannot accept terms or pay.

Background 401 console activity was observed, but no visible error toast appeared. It is not counted as visible persona friction. Browser CLI overhead is not a product timing measurement.
