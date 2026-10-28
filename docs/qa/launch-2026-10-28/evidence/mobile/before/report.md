# Mobile first-time user — baseline

**Result: blocked before signup; no first success.**

Chrome with iPhone 13 mini emulation, viewport 375×812. Actual CDP network throttling: 2,000 ms latency, 62,500 bytes/sec download and upload (500 kbps each); browser cache disabled. No mocked responses.

1. Opened `https://beta.base.tube/ai-thumbnails`; redirected to `https://base.tube/ai-thumbnails`. DOMContentLoaded after **11,890 ms**. Landing fits the 375px viewport without horizontal overflow.
2. Tapped **Start 7-day free trial** in the hero. It navigated to the beta signup route (`plan=creator&interval=month&trial=1`).
3. The signup viewport was entirely black, with **no text, spinner, error, back/retry action, or form**. Browser title changed to “Base.Tube - Web3 Video Platform”.
4. At **87,412 ms since signup navigation**, rendered `bodyText` remained empty; `readyState` was `interactive`, `domContentLoadedEventEnd` and `loadEventEnd` were both zero. A subsequent snapshot remained empty. Observation was bounded at roughly 90 seconds.

## Issue

**P0 under tested network conditions — blank app bootstrap on slow network.** A first-time mobile visitor has no evidence that the CTA worked and cannot reach registration/generation. The screen offers no recovery.

Evidence:
- `01-landing.png`: full mobile landing
- `01a-landing-viewport.png`: usable initial mobile viewport
- `02-after-primary-cta.png`: entirely black signup viewport
- `03-signup-still-black.png`: same black viewport after the measured 87.4 seconds

No signup account was created, no binding terms accepted, no checkout/payment completed, and no image generation submitted. The authenticated phase remains untested. This is browser emulation rather than a physical phone.
