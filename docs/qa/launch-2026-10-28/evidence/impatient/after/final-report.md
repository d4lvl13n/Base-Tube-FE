# Impatient persona — final released smoke check

2026-10-28, 07:03–07:06 UTC. Fresh real headed Chromium session `final-impatient`. No mocked requests. No new generation, audit or paid action.

**PASS.** The previous findings are resolved in this final smoke check.

## Release evidence

The signup page actually loaded `https://beta.base.tube/static/js/main.f31b2fb4.js`, matching the frontend release designated by the parent (`8c74fc0`). The landing tested was the live `https://base.tube/ai-thumbnails`; parent identified marketing release `a3823f9`. Marketing Git SHA was not independently extracted from browser HTML.

## Public journey

Opened `https://beta.base.tube/ai-thumbnails`, redirected to `https://base.tube/ai-thumbnails`, then clicked the first header CTA **Start free trial**. The signup form loaded completely and displayed:

> Next: secure checkout for your 7-day free trial of Creator. Thumbnails for 2 videos included (3 thumbnail options per video). A card is required. Then US$24/month, starting on day 8, unless you cancel.

All four account-information links remain visible: Pricing, Terms of Service, Privacy Policy, Refund Policy. No signup error overlay or stalled loading state was observed. No account was created or checkout entered.

Landing console: **0 errors**, 2 nonblocking preload warnings. The old `hero-poster.jpg` and `product-video-poster.jpg` requests no longer appeared; zero poster 404s were observed. The hero visibly rendered. Anonymous signup had zero errors; browser request list contained no `/channels/my` request or 401 loop.

Evidence: `08-final-landing.png`, `09-final-signup-ready.png`, `console-final-public.log`.

## Saved result and download

Loaded the already approved private auth state through CLI state-load without reading/printing/copying contents. Opened only the existing project:

`https://beta.base.tube/ai-thumbnails/projects/3abced7d-7cc6-4ff1-b389-41178cf67bdf`

- The actual generated Minecraft wooden-tool thumbnail displayed correctly after page load. Browser DOM confirmed complete=true, naturalWidth=1536, naturalHeight=864.
- The prior opaque label **Version a2c00cb7** is replaced with **Original thumbnail · 07:33:34** in both visible heading and image alt text.
- **Download** successfully downloaded `thumbnail-a2c00cb7.png` again. No generation or audit was started.
- Credits were **836 before download and 836 after download**. Cost of this final smoke check: **0 credits**.
- Evidence screenshot: `10-final-saved-project.png`.

One known console-only `GET /api/v1/ctr/face-reference` 404 remains for this account without a face reference. It did not show a user-facing error or prevent loading/downloading the saved thumbnail. Two React Router warnings remain. These are not counted as a failed result.

## Limits and cleanup

This final pass verifies the ready public signup UI and reopening/downloading a previously generated image on the final release. The earlier completed generation is documented in `report.md`; no fresh generation was necessary or authorized for this pass. Fresh-account signup and Stripe checkout remain unexecuted. Preview retry under failure, hidden styles and audit resume were outside this persona's final smoke scope and are not claimed as verified here.

Only `final-impatient` is closed at the end; other agents' sessions are untouched. Earlier reports and screenshots were preserved.

