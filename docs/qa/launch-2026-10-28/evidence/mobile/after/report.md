# Mobile persona — production rerun

## Conditions
Real isolated Chrome sessions `after-mobile` (authorized existing account) and `after-mobile-gzip` (fresh anonymous), iPhone13mini emulation, explicit375×812 viewport. Actual CDP throttle:500kbps each direction (62,500bytes/s),2,000ms latency; cache disabled; no network mocks. This is browser emulation, not a physical handset.

## Outcome
The original completely black startup screen is fixed: a visible loading message explains the wait and offers reload. The final gzip build reaches actual signup email/password fields in **43.48s** after navigation on this network; no horizontal overflow. Public signup/payment were not submitted. User-authorized existing session generated exactly **one** usable1536×864 thumbnail, project `592cd6f5-b6a2-4181-a9b7-35ff6ff47b5d`, version `a92c8ab0`. Credits **881→866**, exactly15. Final image is visually verified in `12-full-image-complete.png`.

## Public journey and startup performance
- Landing redirects beta→base.tube, final-pass DOMContentLoaded8.74s, hero CTA accessible at375px.
- The first deployed build `main.34ee9301.js` still transferred2,616,973bytes (encoded=decoded2,616,673), taking50.77s. Signup shell appeared before identity fields; no identity fields at64.56s, present82.68s. `03-signup-usable.png` is a historical filename: it contains only the shell/optional marketing checkbox, so **does not establish signup readiness**.
- Root deployed gzip during this rerun. Fresh anonymous verification used `main.f21a18c7.js`: transfer750,335bytes, encoded750,035, decoded2,617,112; download19.34s. DOMContentLoaded21.96s, load30.17s, targeted email field wait completed43.48s. Loading screenshot10; usable form screenshot11. Public form explicitly discloses card required, day8 billing,US$24/month. No console errors;2warnings.

## Authorized generation journey
Used private approved storage state without printing/copying its contents. Projects→Create a thumbnail→title/hook→select1concept→singleGenerate15credit click around06:35:59UTC. Project created, server version timestamp06:36:35UTC. Route briefly shows Loading; ready image then downloads on slow network. No resubmission.

The UI said Ready well before the image was fully downloaded. After approximately150s of partial/no visible image on the original route, reloaded the existing saved project once (no generation). Image eventually fully loaded; dimensions1536×864, complete=true; final screenshot12. Recovery reload confirms persistence and no additional credit charge. Final image download on this reload took91.26s; cross-origin resource timing hides transfer size(0), so PNG size is unknown from browser timing.

## Remaining issues
1. **P1: hidden channel profile images waste3.81MB on slow connections.** On the saved project's Choose route, DOM has zero-size images for profile buttons “FinalBoss thumbnail”,“The blue angel”,“AA Tv Channel”. Each image is1536×864. Transfers1,228,278+1,222,048+1,364,322=3,814,648bytes, downloads81–86s, competing with the visible result. The comparison UI also has a hidden copy of the current version, but identical-path requests may coalesce; do not count it as an extra download. Screens08a/08 show Ready with image absent/partially painted; screenshot12 shows completion. Recommend mount/lazy-load profile picker images only when opened, and use small preview assets.
2. **P2: cold signup still takes43.5s under this harsh but explicit network.** Gzip halves the old observed time and the blank screen is fixed. Further code splitting/Clerk startup optimization would improve it. This is remaining launch friction, not a failure to eventually register (registration itself untested).

## Artifacts and limits
- `05-before-credits-881.png`,`06-one-concept-brief.png`,`07-project-opening.png`,`08a-ready-image-pending.png`,`08-completed-thumbnail.png`(partial image despite filename),`09-after-credits-866.png`,`12-full-image-complete.png`.
- `public-metrics.json` and `gzip-metrics.json` hold measured startup data.
- No signup, terms acceptance, checkout, payment, settings change, external message, audit, generation retry, or second concept. Optional face-reference404 appears in console with no visible blocker.
- Both sessions closed after evidence collection. No source edits by this persona.
