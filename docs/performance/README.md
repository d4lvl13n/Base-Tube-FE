# Web performance checks

Implementation contract: `base-be/docs/specs/2026-11-06-web-performance.md`.

## Commands

```sh
npm run build
npm run perf:test
npm run perf:budget
npx playwright install chromium
npm run perf:smoke
```

`perf:budget` reads the production asset manifest and sums gzip level 9 initial
JavaScript/CSS bytes. It exits nonzero when a limit is exceeded. The baseline
was compiled with `npm run build` from frontend commit `8e8c97e`, on 2026-11-06:
749,073 initial JavaScript bytes and 36,665 CSS bytes compressed.

`perf:smoke` starts a temporary loopback static server on an available port and
opens fresh Chromium contexts against the production build. API reads use
fixtures; all third-party traffic is blocked. Clerk is deliberately left pending
and secondary home reads are held until primary content is visible. The channel
scenario requires one overview read and no channel-then-videos waterfall. The
probe rejects mutations, unexpected API reads and uncaught browser errors. It also
checks the channel video, requires one readiness mark per route, and waits for
opacity animations to finish before counting the primary title as readable.

Each scenario uses an empty cache, no service workers, 150 ms latency, 1.6 Mbps
download and 4x CPU slowdown. The output includes screenshots, readiness marks,
actual completed script body bytes (including lazy-loaded startup code), request
paths and browser version. These are deterministic acceptance checks, not a claim
about production latency. Failing probes write diagnostics before closing the
browser/server. See `output/performance/`, which is ignored by git and uploaded by CI.

CI uses fixture-only public configuration in its build. Local builds may use the
existing public configuration; the probe still intercepts every external request.
The tests do not need backend services, production access, real users or AI calls.

## Browser measurements

The root route observer starts readiness clocks at document navigation start on
cold load and at committed client navigation on later visits. Readiness is emitted
once per visit when useful page data exists, including an empty loaded Studio list.
Editor readiness additionally waits for its editable draft. It is separate from AI
job duration. React StrictMode remounts do not count twice.

`web-vitals` reports LCP, INP, CLS, FCP and TTFB. The document's initial route category
is retained for document-wide vitals; readiness uses the current route category.
Only fixed route/metric names, values and ratings are sent through the existing GA4
helper on the production application host. Full URLs, IDs, query strings, DOM
attribution and content are never included. Analytics failure cannot block rendering.

Change budgets only with an explanation and before/after evidence. A smaller entry
file alone is insufficient: the browser gate also limits all completed script bytes
before public content. Server rendering of additional public routes remains a
separate architecture/product decision; this work changes neither URLs nor hosting.

## Validated delivery — 2026-11-06

Initial JavaScript decreased from 749,073 to **264,579 gzip bytes (-64.7%)**;
CSS decreased from 36,665 to **28,232 bytes (-23.0%)**. The initial manifest still
contains one JavaScript file. Final entry: `static/js/main.a92fabaa.js`.

The final fixture run in Chromium 158.0.8127.18 showed readable Home content in
3,303 ms and channel content in 3,093 ms while authentication stayed pending.
Completed script bodies before content were 285,674 and 291,132 bytes respectively.
These are illustrative local results, not production latency measurements. The
original build failed the deliberately pending-authentication probe after 30 s.

CI limits are 350,000 initial JS gzip bytes, 35,000 CSS gzip bytes, three initial
JS files, and 400,000 completed script-body bytes before content. Changing these
limits requires measured justification; merely moving code into an eagerly loaded
lazy chunk does not evade the browser budget.

Validation passed: frontend TypeScript/build and **1,281 tests in 130 suites**,
shared SDK **206 tests** and CJS/ESM build, backend build and **95 relevant tests**,
asset-budget test, and both production-browser scenarios. Existing CI exclusions
remain unchanged. Four pre-existing stale test fixtures were repaired; the CI
suite exits after its results with `--forceExit` because existing asynchronous
handles otherwise keep Jest alive. Build warnings remain nonfatal.

Release was authorized on 2026-11-06; live checks are recorded separately. Deploy
the additive backend overview endpoint **before** this frontend. No database migration
is required; rollback can restore the previous frontend independently. Real
wallet signatures, purchases, AI calls and production field measurements are
outside this local verification. Public SSR is documented as a separate follow-up
in the implementation contract.
