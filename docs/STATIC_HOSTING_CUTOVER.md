# Static Hosting Cutover — Vercel / Cloudflare Pages

The web app is a static CRA bundle; `npm build` + scp is replaced by
deploy-on-push to a static host. This document is the **complete runbook** —
no DNS or dashboard changes have been made; everything below is to execute
when you decide to cut over.

## Why a custom domain is MANDATORY

Web3 auth uses an httpOnly cookie with `COOKIE_DOMAIN=.base.tube`. On a
`*.vercel.app` / `*.pages.dev` domain the cookie can never be set for
`.base.tube` → **all web3 auth breaks**. The frontend must live on a
`base.tube` subdomain.

## The host split (the one real migration)

Today the droplet's nginx serves BOTH the frontend and the API from
`beta.base.tube`. Moving the front off the droplet means the API needs its
own hostname:

| | Before | After |
|---|---|---|
| Frontend | `beta.base.tube` (droplet/nginx) | `beta.base.tube` → Vercel/CF Pages |
| API | `beta.base.tube/api/...` (same origin) | `api.base.tube` → droplet/nginx |

> Note: `api.base.tube` does NOT exist today (the mobile app was previously
> pointed at it by mistake and 404ed — commit `5373ef7`). Create it first.

## Step-by-step

### 1. Stand up the API hostname (no user impact)
- DNS: `api.base.tube` A-record → droplet IP (same as beta).
- nginx: server block for `api.base.tube` proxying to `127.0.0.1:3000`
  (copy the existing API proxy config); issue TLS (certbot).
- `.env.production` on the droplet:
  - `CORS_ALLOWED_ORIGINS` += `https://beta.base.tube` (and any preview origin you want)
  - `COOKIE_DOMAIN=.base.tube` (verify it is exactly this)
- Restart the backend. Verify: `curl https://api.base.tube/health`.
- Both hostnames now serve the API — nothing is broken yet.

### 2. Connect the repo to the host
**Vercel**: import `Base-Tube-FE`, root directory = repo root. `vercel.json`
already pins install (`npm install --legacy-peer-deps`), build
(`react-scripts build`), output (`build/`), SPA rewrites, and immutable
caching for `/static`. The npm-workspaces monorepo (`apps/mobile`,
`packages/api-sdk`) installs alongside but does not affect the CRA build.

**Cloudflare Pages**: build command `npm install --legacy-peer-deps && npx
react-scripts build`, output `build`. SPA fallback ships via
`public/_redirects` (already in the repo).

Dashboard env vars (values from your real `.env`; names documented in
`.env.example`):

```
REACT_APP_API_URL=https://api.base.tube        ← the NEW api host
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_...
REACT_APP_WALLETCONNECT_PROJECT_ID=...
REACT_APP_ONCHAINKIT_API_KEY=...
REACT_APP_SHOW_PASSES / REACT_APP_FEATURE_ONCHAIN_PASSES=true
REACT_APP_TESTNET_MODE=true|false
(optional) REACT_APP_BASETUBE_PUBLIC_API_KEY, RPC overrides
```

Deploy once to the preview URL and smoke-test against `api.base.tube`
(API calls work cross-origin; web3 login will NOT work on the preview
domain — expected, cookie domain).

### 3. Flip the frontend DNS
- Point `beta.base.tube` at the host (Vercel: CNAME `cname.vercel-dns.com`;
  CF Pages: CNAME to the pages project). Add it as a custom domain in the
  dashboard first so TLS is ready.
- The droplet's nginx block for `beta.base.tube` static files becomes unused
  (keep the API-only `api.base.tube` block).

### 4. Update every API_URL touchpoint (same day)
All consumers must point at `api.base.tube`:

| Touchpoint | Where |
|---|---|
| Web env | host dashboard: `REACT_APP_API_URL=https://api.base.tube` |
| Mobile SDK default host | `packages/api-sdk/src/config.ts` (currently beta.base.tube) |
| Mobile app env | `apps/mobile/.env` `EXPO_PUBLIC_API_URL` |
| Contract canary | `.github/workflows/canary.yml` `CANARY_BASE_URL` |
| Stripe dashboard | webhook endpoint → `https://api.base.tube/api/webhooks/stripe` |
| Clerk dashboard | allowed origins if configured |
| base-be CORS | `CORS_ALLOWED_ORIGINS` (done in step 1) |

Mobile note: the SDK host change touches the mobile contract surface
process-wise — it's client-side only (no backend change), but rebuild/retest
the mobile app afterwards.

### 5. Verify
- `node scripts/contract-canary.mjs` with `CANARY_BASE_URL=https://api.base.tube`
- Web: sign in with Clerk, sign in with wallet (cookie flows on `.base.tube`),
  play a video, buy a pass with a test card.
- Watch the host's deploy-on-push: merge to `main` → live build.

### Rollback
DNS back: point `beta.base.tube` at the droplet again (nginx static block
still there until you remove it), revert `REACT_APP_API_URL` consumers. Keep
the droplet's built `build/` directory until you're confident.

## After cutover
- `npm build` + scp is retired; deploys are git-push.
- Preview deployments: every PR gets a URL (remember: wallet auth won't work
  on preview domains — cookie scope).
- Remove the frontend static serving from the droplet's nginx when stable.
