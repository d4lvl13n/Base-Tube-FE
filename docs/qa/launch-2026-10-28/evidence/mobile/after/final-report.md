# Final mobile verification — frontend8c74fc0

Verified production asset **main.f31b2fb4.js** in a fresh real Chrome session with iPhone13mini emulation, explicit375×812 viewport, actual CDP500kbps download/upload,2,000ms latency, cache disabled; no network mocks. Loaded approved private account state without inspecting/copying its contents. Opened existing saved project592cd6f5-b6a2-4181-a9b7-35ff6ff47b5d. **No generation, no additional credit spend.**

## Verified fixes
- Startup feedback visible by7.16s; Choose UI visible by42.43s on a cold navigation.
- **All three wasteful profile images are absent from DOM and resource timing.** No dbec5be5/9480ccaa/8ca0747f requests. This removes the previously measured3.81MB of hidden profile images.
- While PNG downloads, visible feedback reads **“Loading your saved image…”**. Screenshot `final-02-image-loading.png` visually inspected.
- Human label **“Original thumbnail ·07:36:35”** replaces Versiona92c8ab0.
- Full1536×864 thumbnail confirmed complete=true and visually inspected in `final-03-image-complete.png`. No horizontal overflow (viewport375, document scrollWidth375).
- Visible result PNG download **29.91s**, compared with91.26s in the prior recovery pass. Full image observed77.47s after cold navigation (includes app/bootstrap/auth/data time). PNG byte size unavailable due to cross-origin Resource Timing restrictions: returned0 does not mean zero-byte transfer.
- Main script transferred750,402bytes (encoded750,102; decoded2,617,424), download19.55s. Gzip remains effective.

## Comparison image nuance
The closed comparison still contains one hidden current-result img with `loading="auto"`, the same PNG path as the visible image. Its resource timing contains **one** PNG entry; no separate download observed. Therefore the measured bandwidth problem is fixed, but an explicit claim that the comparison img uses native lazy loading would be inaccurate. This is a minor implementation observation, not an observed new blocker.

## Public landing check
Separate fresh anonymous375px/slow3G/cache-disabled browser. Landing beta→base.tube renders, no horizontal overflow, **zero console errors**, no optional poster requests or video posters. Footer links verified and captured in `final-04-landing-policies.png`:
- Privacy Policy→https://beta.base.tube/privacy
- Terms of Service→https://beta.base.tube/terms
- Refund Policy→https://beta.base.tube/refund
No repeated signup timing run; prior measured43.48s remains the signup evidence. Policy page bodies were not re-read by this persona.

## Remaining limit
Cold navigation remains slow on this explicit500kbps/2s network, but it now provides feedback and avoids hidden3.81MB downloads. This is Chrome device emulation, not physical-phone testing. Prior generation remains the only generated concept; this pass only reopens it. Both final browser sessions closed after collection.
