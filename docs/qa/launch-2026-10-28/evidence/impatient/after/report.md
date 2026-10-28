# Impatient persona — deployed rerun

Date: 2026-10-28. Real headed Chromium, fresh isolated session `after-impatient`. Public baseline and authenticated completion were both tested. No mocked requests.

## Verdict

**PASS for the previously found public blockers; PASS for one usable generated thumbnail with the authorized existing account.** New signup, email verification and Stripe checkout were not executed. Existing authentication was loaded only from the private temporary state file approved by the user; it was never printed or copied into evidence.

## Public path

1. Opened https://beta.base.tube/ai-thumbnails, redirected to https://base.tube/ai-thumbnails.
2. Skimmed and clicked the first header CTA, **Start free trial**.
3. Signup initially displayed “Loading secure sign-in…” and then the complete form, without an error.
4. The highlighted disclosure before signup now reads exactly:

> Next: secure checkout for your 7-day free trial of Creator. Thumbnails for 2 videos included (3 thumbnail options per video). A card is required. Then US$24/month, starting on day 8, unless you cancel.

The amount, billing cadence, first charge day, card requirement and included allowance are all visible together. **Pricing**, **Terms of Service**, **Privacy Policy** and **Refund Policy** links are present below the form. Screenshot `02-signup-price-legal.png` captures the complete page.

Stayed on signup for more than 45 seconds including inspection. Browser request listing showed **no `/channels/my` request and no 401 loop**. Console had zero signup errors (only React Router warnings and an autocomplete advisory). The previous `NO_AUTH_TOKEN` high-severity error did not recur.

## Authenticated first success

1. Loaded the user-approved existing authentication state without inspecting its contents. Returned to the landing and used its footer **Studio** link.
2. Projects displayed **911 available credits** (`03-before-credits.png`).
3. Clicked **Create a thumbnail**. Entered **QA launch Minecraft wooden tools**. **Start fresh** was already selected. Chose **1** in Number of concepts.
4. Verified the button said **Generate 1 concept · 15 credits**, then clicked it exactly once (`04-one-concept-brief.png`).
5. Landed on project https://beta.base.tube/ai-thumbnails/projects/3abced7d-7cc6-4ff1-b389-41178cf67bdf.
6. Waiting UI first said **Preparing concepts · 0 credits (15 reserved)**, then **Wooden Tool Spotlight — Creating**. Available credits became **896** (`05-generating.png`).
7. The image appeared automatically with **1 concept: Ready.**, Refine, Download and Keep controls. Browser confirmed image.complete=true and natural dimensions **1536 × 864**. Screenshot `06-complete-result.png` shows the actual Minecraft wooden-tool result and 896 credits.
8. Clicked **Download** once. Browser downloaded `thumbnail-a2c00cb7.png`; evidence copy is `generated-thumbnail.png`.

Project ID: `3abced7d-7cc6-4ff1-b389-41178cf67bdf`.
Result label: `Version a2c00cb7`.
Submission navigation: **06:33:05 UTC**. Result timestamp shown in UI: **07:33:34 browser time**, i.e. **06:33:34 UTC**. Approximately **29 seconds** between submission and result timestamp. This is based on UI timestamps, not precise backend latency instrumentation; observation was intermittent.
Credits before: **911**. After: **896**. Delta: **15**. Exactly one generation was submitted; no retry, audit, refinement or additional charge was initiated.

## Remaining minor observations

- Landing console contains 404s for `https://base.tube/images/ai-thumbnails/hero-poster.jpg` and `https://base.tube/images/ai-thumbnails/product-video-poster.jpg`. The hero collage and product demo still render (`01-landing.png`, `07-product-demo.png`). DOM inspection found no video element. No blank hero, broken-image icon, empty video, or blocked CTA was observed; this is console/network noise rather than a demonstrated user blocker.
- The successful concept is labelled **Version a2c00cb7** instead of the earlier understandable concept name **Wooden Tool Spotlight**. This is a minor creator-facing label issue, with no impact on image display or download (`06-complete-result.png`).
- Authenticated console has `/api/v1/ctr/face-reference` 404s when this account has no face reference; no visible error or blocked generation was observed. Do not count this as a failed generation.

## Limits and actions

No account was created, no terms were accepted, no payment/subscription was initiated, no settings changed, no audit run, no source edited. Signup → checkout remains unverified; the authenticated continuation demonstrates generation on the existing credited account rather than claiming that fresh-account onboarding was completed. Only the `after-impatient` browser session is closed at the end. The earlier `launch-impatient` session was left untouched.
