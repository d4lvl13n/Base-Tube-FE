# Skeptic — baseline browser QA

Real Chromium session: `launch-skeptic`, anonymous, desktop. Entry at `https://beta.base.tube/ai-thumbnails` redirected to `https://base.tube/ai-thumbnails`. No source code was inspected to form baseline findings.

## Outcome

**First success not reached.** The persona refuses signup after the product-policy mismatch. No account was created, no legal terms accepted, no card entered, and no generation request submitted. This is a genuine failed acquisition journey, not an end-to-end success.

## What worked

Marketing and app pricing agree (US$24/49/99 per month). Marketing FAQ explains the seven-day/two-video trial and day-eight charge unless cancelled.

## Findings

### P1 — The thumbnail landing page links to Content Pass terms and a policy that omits AI processing

URL: https://base.tube/ai-thumbnails

A skeptical thumbnail customer cannot verify the product-specific billing, generated-image rights, or handling of submitted reference images from the documents linked before signup. This is the point at which this persona declines to continue.

1. Open beta.base.tube/ai-thumbnails (redirects to base.tube/ai-thumbnails)
2. Read pricing, then follow footer Terms of Service
3. Read footer Privacy Policy

Evidence: 03-terms.png, 04-privacy.png

### P1 — Browser Back restores the pricing URL but keeps Terms content on screen

URL: https://base.tube/ai-thumbnails#pricing

Returning from legal review does not return to the offer; users are stranded on the wrong content under a misleading URL.

1. Landing -> footer Terms of Service
2. On Terms follow footer Privacy
3. Browser Back returns to Terms
4. Browser Back again changes URL to /ai-thumbnails#pricing but leaves Terms title and body
5. Reload restores the correct thumbnail landing page

Evidence: 05-back-shows-terms-at-pricing-url.png

### P2 — Full app pricing has no visible Terms or Privacy navigation

URL: https://beta.base.tube/ai-thumbnails/pricing

The price page displays payment CTAs but offers no visible product-policy links for a cautious new user.

1. Follow full Pricing link from the marketing footer
2. Inspect the entire app pricing page before choosing a paid trial or credit pack

Evidence: 06-app-pricing.png

### P2 — The AI-specific Terms still describe credit packs, not the subscription trial offer

URL: https://beta.base.tube/terms

The correct AI terms explain generated content but do not explain the monthly recurring trial, day-8 charge, or cancellation that the pricing UI advertises.

1. Inspect the app-specific Terms as a follow-up destination
2. Compare section 4 Credits & payments with the monthly Creator/Pro/Agency and 7-day-trial offer

Evidence: 08-correct-app-terms.png

## Follow-up destinations verified in the real browser

`https://beta.base.tube/privacy` is the AI-specific policy and explicitly names prompts/thumbnails, Clerk, OpenAI/xAI/Google, data retention and deletion. `https://beta.base.tube/terms` explains AI tools and generated-image rights, but its credit/payment section still describes packs rather than the subscription trial. These documents were reached using URLs supplied by the QA lead after the baseline legal-link finding, not by pretending the marketing footer points there. Screenshots 07 and 08.

## Owner fact needed

The marketing policies identify “Base Labs (incorporation in progress, United States)”. This report does not assert that identity is false; the owner must confirm the entity before legal identity text is changed.

## Notes

The screenshot directory contains every identified user-facing friction point. Anonymous app pricing and legal pages also emitted repeated 401 channel/capability requests in the browser console; no visible toast appeared in these captures, so that is recorded as diagnostic evidence, not counted as a separate visible-user finding.
