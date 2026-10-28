# Impatient first-time visitor — baseline

Fresh isolated headed Chromium session `launch-impatient`. Opened `https://beta.base.tube/ai-thumbnails`, which redirected to the public marketing page at `https://base.tube/ai-thumbnails`. Clicked the first obvious header CTA, **Start free trial**.

## First abandonment moment

The signup page says: “Next: secure checkout for your 7-day free trial of Creator, 2 videos included. Your card is charged on day 8 unless you cancel.” No renewal amount or billing cadence is shown on this screen. As an impatient visitor, I would stop rather than create an account before finding that out.

- Landing: `01-landing.png`
- Confusion/abandonment: `02-trial-signup-no-price.png`
- Approximate wall time to gate: 45 seconds, including observation/capture overhead; this is not a speed benchmark.

## Completion status

**First success not reached.** Signup and checkout are genuine unverified gates, not defects in themselves. No disposable account credentials were supplied. I did not create credentials, accept terms, initiate payment, or generate an image. Root will coordinate an authorized existing-account phase.

## Secondary technical observation

Anonymous signup repeatedly calls `GET /api/v1/channels/my` and receives 401. Within roughly 20 seconds the console contained 21 error entries, including messages labeled “User-facing error” with “Authentication required. Please sign in.” Screenshot shows no visible toast; I do not claim that the visitor saw a toast. See `console.log`.

Browser session remains open for rerun. No product source files were changed.
