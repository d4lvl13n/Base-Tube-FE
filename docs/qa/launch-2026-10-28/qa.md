# Base.Tube launch QA — 28 October 2026

Five real thumbnail generations and two complete Garter channel audits succeeded. The five personas repeated the corrected journeys; final targeted checks cover recovery, pricing/legal copy, image loading, downloads and Studio handoff. Fixes are committed, pushed and live. New-account signup/checkout remains unverified under the owner-approved existing-account scope. Cold sign-up still takes43.48 seconds on the severe slow-3G profile; operator identity remains an owner fact to confirm.

## Scope and evidence standard

Five agent personas used actual, isolated Chromium sessions against the live landing page and app: impatient, skeptic, mobile, literal English reader, and breaker. These are five simulated journeys, not a study of five human customers. Baseline evidence was captured before code changes. No requests or generated results were mocked.

The owner approved deploying the fixes and using the existing signed-in account. Public acquisition is tested anonymously; feature completion uses that existing account. New-account creation, accepting terms, and a new card-backed checkout are outside the completed evidence unless explicitly recorded below. The literal and breaker personas must each complete a real thumbnail generation and channel audit before the feature rerun is considered complete.

Mobile conditions: 375 × 812 viewport, iPhone 13 mini emulation, 500 kbit/s download and upload, 2,000 ms latency, cache disabled. Browser-command overhead is not counted as application load time.

## Findings ranked by number of affected personas

Counts reflect independently observed baseline friction, not an assumption that every user would encounter it. Severity breaks ties. Raw reports and screenshots are in [evidence/](evidence/).

| Rank | Observed issue | Personas | Count | Fix |
|---|---|---|---|---|
| 1 | Signup announces day-8 billing without amount or period | Impatient, literal | 2/5 | Exact selected renewal price/cadence and card requirement before signup. |
| 2 | Missing pricing/policy navigation at signup or app pricing | Literal, skeptic | 2/5 | Direct Pricing, Terms, Privacy and Refund links. These observations concern different screens in the same discovery problem. |
| 3 | Black signup screen for at least 87 seconds on slow 3G | Mobile | 1/5, P0 under tested conditions | HTML/Clerk loading feedback, deferred route bundles, static gzip. Cold signup still takes 43.48 seconds in the harsh network profile; see measurement below. |
| 4 | Leaving audit loses its progress; return shows blank form | Literal | 1/5, P1 | Account-scoped request owner survives navigation; exact-key read-only recovery after refresh, no automatic POST. |
| 5 | Hidden styles download 3.81 MB and compete with the visible result | Mobile | 1/5, P1 | Brief is not mounted on Choose/Refine; lazy style/comparison images. |
| 6 | AI marketing footer opens Content Pass policies | Skeptic | 1/5, P1 | Both AI tool footers link to existing AI service policies. |
| 7 | Back shows pricing URL with Terms content | Skeptic | 1/5, P1 | Correct policy destinations avoid the old navigation sequence; browser rerun returned correct pricing DOM/title. No claim of fixing every unrelated legacy page. |
| 8 | AI Terms omit subscription trial, renewal and cancellation | Skeptic | 1/5, P2 | Subscription and trial scope, automatic renewal and billing cancellation described. |
| 9 | Refund page describes packs only | Skeptic | 1/5, P2 | Subscription/pack scope and direct trial/renewal/cancellation terms. |
| 10 | Test A image contradicts its written brief | Literal | 1/5, P2 | Removed the arbitrary first-family image chosen by UI; A/B are labelled as briefs to create. Evidence comparison retains real source thumbnails. |
| 11 | Audit jargon and unclear audit price | Literal | 1/5, P2 | Plain headings; explicit free-beta notice and no YouTube connection needed for public channels. |
| 12 | “2 videos included” is ambiguous on a thumbnail tool | Literal | 1/5, P2 | Thumbnails for 2 videos, 3 thumbnail options per video. |
| 13 | Double-click opens then dismisses visitor signup gate | Breaker | 1/5, P2 | Newly opened modal ignores trailing opener click; deliberate close/Escape preserved. |
| 14 | Ready result stays broken after a transient image network reset | Skeptic | 1/5, P2 | Bounded image retries, loading feedback and a free preview reload, without generation. |
| 15 | Opaque hexadecimal result title | Impatient | 1/5, P3 | Human labels by version type/time; stable selection IDs retained. |
| 16 | Optional missing video posters return 404 | Impatient | 1/5, P3 diagnostic only | Optional video probes disabled until assets exist; actual collage/demo preserved. No visible breakage had been observed. |
| 17 | Audit says Studio will produce three thumbnails although the default is two selectable concepts | Breaker | 1/5, P3 | Count-neutral Studio handoff copy, rebuilt and verified live. |

Technical diagnostic, not visible friction: anonymous private-channel 401 requests were noted by impatient, literal and skeptic (3/5 technical observations, 0/5 visible error toasts). The query now waits for resolved authenticated identity, separates account caches and does not retry 401/403. Signed-out browser rerun showed no `channels/my` request or 401 loop.

HTML-looking titles rendered literally before the fixes; Back/Forward retained the visitor draft. These were baseline passes, not newly fixed vulnerabilities. Empty/whitespace title guidance was strengthened alongside the account gate.

## Release and automated checks

- Frontend source: `1411d2e`, pushed to `origin/main` in `Base-Tube-FE`.
- Marketing source: `973e7bf3c90e3cad4b588b8a7262212c2b92fa35`, pushed to `origin/main` in `Base.Tube` from an isolated checkout. Unrelated dirty marketing work was preserved.
- Frontend: 5 focused Jest suites, 98 passing tests; production build successful. Existing Jest open handles required `--forceExit`; assertions completed successfully.
- Main bundle: 748.19 kB gzip, previously 1,549.57 kB (about 52% smaller). This is a transfer-size improvement, not proof of a particular device's load time.
- Marketing TypeScript check passed; Vercel production deployment `dpl_6kEk3yucytPNpPtQdpqNc9ffUAbZ` reached `READY` for commit `973e7bf`.
- Nginx configuration validated; staged frontend activated with previous version retained. Live `/ai-thumbnails/sign-up` HTML SHA-256 matches the built file: `07cc5c63f022487bf0f1de4d9e069bc62739ee0475e0797c87898911fbaf34c2`.
- The initial batch changed frontend/marketing only. The final follow-up adds the backend recovery endpoint and removes documentation generation from production dependencies; no schema migration.

## Rerun results

All five personas completed one real generation using the approved existing account. No generation was retried. The breaker deliberately double-clicked once and observed exactly one generation POST, one project, one operation and one reservation.

| Persona | Saved project | Observed credits | Result |
|---|---|---|---|
| Impatient | `3abced7d-7cc6-4ff1-b389-41178cf67bdf` | 911 → 896 | Actual 1536 × 864 image displayed and downloaded. Server result timestamp about 29 seconds after submit; first observation was later. |
| Skeptic | `f036a4c9-d968-4a09-b558-325a8225e2a0` | 896 → 881 | Saved 1536 × 864 image; initial network reset left a broken preview, one existing-project reload recovered it. No second generation. |
| Mobile | `592cd6f5-b6a2-4181-a9b7-35ff6ff47b5d` | 881 → 866 | Actual full image eventually displayed under slow 3G; hidden style downloads caused additional delay, addressed in final follow-up. |
| Literal | `ed572485-9fda-4e32-b96b-e048aa7ab0d6` | 866 → 851 | Actual image displayed; audit #20 also completed and was opened from History. |
| Breaker | `3937a3a8-36f6-4a91-b625-646d505fe479` | 851 → 836 | Actual image displayed; deliberate double click created one concept. Audit #21 completed and auto-recovered after navigation and hard reload; one deliberate double-click submission. |

Shared account total: 75 credits for five images (911 → 836). Audits #20 and #21 each charged 0 credits during beta. Final verification and fault probes spent 0 additional credits. This verifies account usage, not five independent new customer accounts or cross-account concurrency.

Audit #20: [saved report](https://beta.base.tube/ai-thumbnails/channel-audit?audit=20), [full UI text](evidence/literal/after/audit20-full-ui.txt), [full screenshot](evidence/literal/after/15-audit20-full-evidence.png). It rendered the diagnosis, comparison, three ideas, test, three families with two examples each, and six external examples. Two of the three ideas covered the series. Backend logs recorded completion at 06:45:17 UTC, after a roughly 06:40 submit; the agent first found the saved report at 06:46:33.

### Follow-up discoveries

Rows 4, 5, 9, 10, 11, 14, 15, 16 and 17 above were discovered during the real post-deploy journeys and fixed in the final follow-up. They are not presented as baseline passes. The final browser checks for image recovery, hidden downloads and the second audit passed and are recorded below.

### Slow-network measurement

The first follow-up exposed an infrastructure issue: JS was delivered uncompressed, despite a smaller build. Main transfer: 2,616,973 bytes, with signup fields first observed between 64.56 and 82.68 seconds. Compression was then enabled only for static frontend assets. Gzip and identity responses were compared byte-for-byte after decompression.

After gzip: main transfer 750,335 bytes (decoded 2,617,112), DOMContentLoaded 21.96 seconds, load 30.17 seconds, actual email/password readiness 43.48 seconds. No horizontal overflow at 375 px. The blank screen is resolved; a cold sign-up still feels slow on this severe network profile. The later hidden-style fix concerns result delivery, not this sign-up measurement. Do not describe 43 seconds as fast or claim an unmeasured additional improvement.

### Final code validation and deployment

Frontend functional validation at `8c74fc0` (followed by the browser-verified copy-only `8d21aee`): 16 focused suites / 180 tests pass, production build succeeds. Main asset: `main.f31b2fb4.js`. Includes audit recovery, preview retries, hidden-image loading and report-reference correction.

Backend source `18dd6915`: 44 controller tests pass and TypeScript build succeeds. New authenticated `GET /api/v1/ctr/channel-audit/requests/:key` looks up only the caller's settled idempotency key and returns completed/unknown. It never acquires a work lease, reserves spend, starts a provider call, exposes another user's ID, or guesses that an absent row is running. No schema migration.

Frontend `8c74fc0` is live. `/ai-thumbnails/channel-audit` HTML SHA-256 exactly matches build: `47911540e745e26e186a0bb1b809c4aed645312c99d4d20b2aeda35caf85f494`. Main `main.f31b2fb4.js` returns `Content-Encoding: gzip` and `Vary: Accept-Encoding`. Backend `18dd6915` API and both workers activated without migrations; runtime smoke passed with Node 24.22.1 and API health confirmed database/Redis connected and search healthy.

The build's two low-severity notices traced to documentation generator `swagger-autogen` → `deepmerge`. Generator moved to devDependencies, production start no longer generates documentation, and lockfile-only classification changed without upgrading dependency versions. Local `npm audit --omit=dev` now reports 0. Final backend source `e8f8c574` is pushed and its image is live on API and both workers. API implementation is unchanged from `18dd6915`; activation waited until the second audit completed.

### Final mobile verification on the released frontend

Fresh 375 × 812 / 500 kbit/s / 2,000 ms / cache-disabled browser opened the same saved project, without another generation. Main asset confirmed `main.f31b2fb4.js`, 750,402 bytes transferred, 2,617,424 decoded. Choose appeared at 42.43 seconds after cold navigation. The three hidden profile image paths are absent from DOM and resource requests (0). Loading feedback says “Loading your saved image…”, and the card has a human type/time label.

Full image visibly completed by 77.47 seconds from cold navigation; the actual PNG transfer took 29.91 seconds, previously 91.26. One current PNG resource entry. The closed project comparison still has a hidden `loading=auto` image sharing the exact same resource; no independent download was observed. Do not claim that every comparison image has a lazy attribute or that hidden-image traffic is universally impossible.

Fresh public marketing landing produced 0 console errors and no poster element/resource requests; correct AI policy links present. No extra credits spent.

### Second audit recovery verification

Breaker deliberately double-clicked Garter audit at 07:00:39 UTC on final frontend: one POST. Projects → Channel Audit restored the same URL/progress. Browser reload showed checking-for-saved-report, then authenticated exact-key GET polling with status 200, and no POST replay. Credits remain 836. The saved report #21 then appeared automatically after hard reload, with no new POST. It displays three families with two examples each, three ideas (two across the series), text-only A/B briefs and the two-image diagnostic comparison. Roughly six minutes from one 07:00:39 UTC submit to visible report. One idea opened Studio with the correct title and full visual direction; returning reopened saved report 21. Final count-neutral handoff copy verified after reload on `main.494b1625.js`, with no new POST and credits 836 unchanged.



### Final desktop and literal-language verification

- Impatient: final bundle confirmed, trial price/cadence/day8/card/allowance and legal links present; no poster404 or anonymous private-channel loop. Existing image loaded, human label and download worked; 836 → 836 credits. An absent optional face reference still yields a console404 without a visible failure; it was not counted as broken generation.
- Skeptic: final Refund Policy scope/linkage correct. Existing image loaded without interference. A separate controlled fault probe aborted only this image's requests: initial request + exactly 2 automatic retries, then stable failure UI. Restoring the real network and clicking “Reload preview · Free” loaded the real 1536×864 image. No API generation POST; 836 → 836. This specific resilience probe uses controlled failure injection; the actual five generations and completed reports are unmocked.
- Literal: final audit 20 retains the evidence images, families and three ideas. Proposed A/B variants contain two labelled briefs and no arbitrary reference images. One idea opened Studio with its exact title/visual direction, both persisted after reload, and returning reopened audit 20. No Generate/Audit POST; 836 → 836.

Each persona's final-report.md and screenshots are alongside its original before/after evidence. Baseline and first-rerun reports are preserved, including the failures that prompted the final changes.


Exact final backend image built: `sha256:d019c8556fde6c23588c9bd477cb6f72199bd870ad851de6644e1fc5d677cda4`, source label `e8f8c574`, Node 24.22.1. Required native/runtime dependency smoke passed and `swagger-autogen` is absent. `npm audit --omit=dev --json` inside this exact image reports 0 vulnerabilities of every severity. Final API and both workers run this exact image/revision with restart count 0; API health is healthy with database/Redis connected and search healthy. Executing API Node reports v24.22.1. No migration or production database maintenance was performed.


## Final release manifest

| Surface | Live source / evidence |
|---|---|
| Studio frontend | `8d21aee` (final change after `8c74fc0` is count-neutral handoff copy only); main asset `main.494b1625.js`; HTML SHA-256 `78ffc32718b77c71352605c0de9bde51022273db5d018ac031079838209306ff` exactly matches local build; static JS gzip verified. |
| API + general worker + thumbnail worker | `e8f8c574`, exact image `sha256:d019c8556fde6c23588c9bd477cb6f72199bd870ad851de6644e1fc5d677cda4`, all running/restart0; API healthy. |
| AI marketing | `a3823f9895152c2e9501ecce10a95fab9383a1b8`, Vercel production deployment `dpl_CwGz2s1gXevWLSy9igDLwwCNqte7` READY; live browser footer/media checks pass. |
| Recovery authorization | Unauthenticated GET to new requests route returns 401; controller tests enforce caller-only lookup and privacy deletion gate. |

[Audit20](https://beta.base.tube/ai-thumbnails/channel-audit?audit=20) · [Audit21](https://beta.base.tube/ai-thumbnails/channel-audit?audit=21) · [Audit21 diagnostic screenshot](evidence/breaker/after/12-final-diagnostic-two-images.png) · [Final count-neutral copy](evidence/breaker/after/20-final-count-neutral-copy.png).

The service still executes an audit in an API request; route navigation and browser reload recovery are verified, but this work does not establish a durable job that survives an API process/server restart. No automatic paid/provider rerun is used to hide that uncertainty.

Evidence is curated: persona reports, screenshots and visible audit text. Raw browser network/auth logs and saved authentication state are excluded from this deliverable.


## Broader CI boundary

The complete repository CI is not green; it is not being represented by the focused 190 frontend / 44 backend passing checks.

- Frontend pre-QA baseline `ae64184`: [run 40543633495](https://github.com/d4lvl13n/Base-Tube-FE/actions/runs/40543633495) failed 4 suites / 13 tests: VideosManagement filters, UploadQueueContext (missing REACT_APP_API_URL in runner), ChannelPreviewCard and CreatorHubNav.
- Frontend application release `8d21aee`: [run 40648344987](https://github.com/d4lvl13n/Base-Tube-FE/actions/runs/40648344987) failed the same 4 suites plus 2 GeneratePage assertions that tried the newly forbidden empty-title signup. Those 2 assertions were updated to require a valid idea; their entire 10-test suite passes locally. The test-only follow-up `9532eaa` was then checked in [run 40649534385](https://github.com/d4lvl13n/Base-Tube-FE/actions/runs/40649534385): 112 suites/1,183 tests passed; exactly the same 4 baseline suites / 13 tests remain failed. The GeneratePage suite passes. No additional failures remain relative to baseline; application code and deployed build are unchanged.
- Backend pre-QA baseline `8ab934f3`: [run 40571149199](https://github.com/d4lvl13n/base-be/actions/runs/40571149199) already exhausted Node's approximately 2 GB typecheck heap (exit 134).
- Final backend `e8f8c574`: [backend-ci 40647158332](https://github.com/d4lvl13n/base-be/actions/runs/40647158332) has the same typecheck OOM; [thumbnail-studio-mysql8 40647158319](https://github.com/d4lvl13n/base-be/actions/runs/40647158319) passed. Local TypeScript and exact production Docker build passed (the Docker build allows 4 GB).

These pre-existing Creator Hub/upload test and CI resource failures were verified against earlier run logs, not assumed from their filenames. They remain repository-wide CI debt outside the thumbnail/audit browser fixes. No failures are hidden by expanding ignore patterns or weakening CI gates.


## Remaining owner fact

The old marketing policy names “Base Labs (incorporation in progress, United States)”. Its accuracy has not been established. The owner was asked to confirm the operating legal entity and country. No entity or jurisdiction was invented or substituted.
