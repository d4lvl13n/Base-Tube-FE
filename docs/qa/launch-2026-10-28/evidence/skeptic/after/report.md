# Skeptic — live after-fix rerun

Real Chromium, fresh named context `after-skeptic`, 28 October 2026. Parent reports frontend `1411d2e` and marketing `973e7bf` live. Evidence comes from rendered UI, not source inspection.

**Public flow: all four original issues fixed. Authenticated first success: achieved with the existing authorized account, after one reload recovered a broken image. New-account signup and checkout remain unsubmitted and unproved.**

## Original fixes verified

- Marketing footer Terms/Privacy now open the AI-specific beta policies. Terms cover subscriptions and credit packs, trial requirements, automatic renewal, and cancellation in the billing portal. Privacy covers face/logo/product/reference uploads and AI providers. [Terms](03-terms.png), [Privacy](04-privacy.png).
- Privacy → Back → Terms → Back returns `https://base.tube/ai-thumbnails#pricing` with the correct marketing title and pricing DOM, without reload. [Evidence](05-back-pricing-correct.png), [snapshot](back-correct.snapshot.yml).
- Full app Pricing now has visible Billing policies links for Terms, Privacy, Refunds. [Evidence](06-app-pricing.png).
- Signup now states: “Next: secure checkout for your 7-day free trial of Creator. Thumbnails for 2 videos included (3 thumbnail options per video). A card is required. Then US$24/month, starting on day 8, unless you cancel.” Pricing/legal links are visible and marketing updates are optional/unchecked. [Evidence](07-signup.png). No form submitted.

## Remaining public issue — P2 refund coverage

Signup → Refund Policy still says: “Credits are a prepaid, digital product purchased in packs.” The unused credit refund sentence applies “within 14 days of purchase if the feature failed to deliver due to a fault on our side.” It does not cover trial conversion or recurring subscription refunds/cancellation. This is a remaining mismatch in product coverage, not a claim about required legal rights. [Screenshot](08-refund-pack-only.png), [full snapshot](refund.snapshot.yml).

## Authenticated generation

Loaded only the user-authorized private browser state. No credentials printed/copied; no signup, checkout, account settings, uploaded user files or YouTube connection.

- Start fresh, title “I Built a Tiny Moon Base From Cardboard — Skeptic QA”, 16:9/high quality, exactly 1 concept.
- Before click: 896 available credits, button “Generate 1 concept · 15 credits”. [Evidence](09-before-generation-15-credits.png).
- Submitted once at about 06:34 UTC. Saved project `f036a4c9-d968-4a09-b558-325a8225e2a0`. Balance immediately 881, “Waiting · 0 credits (15 reserved)”, then “Preparing concepts”. All changes saved. [Evidence](10-generation-progress.png).
- Actual version `ec1f0e5f`, created at visible local time 07:34:31. UI changed to “1 concept: Ready.” with Refine/Download/Keep controls.

**P2: the first completed result showed a broken image.** Natural dimensions were 0×0, `complete=true`; browser console recorded `net::ERR_CONNECTION_RESET` on the generated `gateway.storjshare.io` image request (no HTTP response status). The UI still said Ready and offered no error/reload guidance. [Broken result](11-generation-ready.png).

One reload of the existing saved project recovered the actual 1536×864 thumbnail. Visually verified: cardboard moon base on a lunar surface, magnified cardboard detail, text “TINY CARDBOARD MOON BASE”. Credit balance remained 881 and saved project/version remained. **No generation retry.** [Recovered result](12-image-recovered-after-reload.png), [final snapshot](completed-project.snapshot.txt).

Saved result: https://beta.base.tube/ai-thumbnails/projects/f036a4c9-d968-4a09-b558-325a8225e2a0

## Explicit limitation

The exact operating legal entity remains unknown pending the owner’s answer. No operator identity/jurisdiction was invented. Navigation and billing copy are fixed; entity verification is separate and still open. Signup/checkout/cancellation execution and downloading a file were not performed. Existing-account generation is demonstrated; a fresh-account paid conversion is not.
