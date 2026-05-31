# @basetube/mobile

BaseTube mobile app (Expo / React Native + TypeScript). Consumes the shared
[`@basetube/api`](../../packages/api-sdk) SDK.

> Status: **app shell only.** The earlier demo screens were intentionally
> removed. This package currently contains the providers, dark theme, web
> phone-frame, and the SDK client wiring — ready for the v1 screens below.

## Run

From the monorepo root:

```bash
npm install
# Metro bundles @basetube/api directly from its TypeScript source — no SDK build step needed.
EXPO_PUBLIC_API_URL="https://beta.base.tube" npm run web -w @basetube/mobile
```

- `npm run web -w @basetube/mobile` — run in the browser (react-native-web)
- `npm run ios|android -w @basetube/mobile` — run on a simulator/device

| Env var | Purpose | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL | `https://beta.base.tube` |

## v1 screen list (derived from the web app routes)

Grounded in `Base-Tube-FE/src/App.tsx`. Scope is the **consumer** experience
plus auth and the content-pass differentiator. Creator tooling and NFT/AI
features are deferred.

### In scope for v1

| # | Screen | Web route / page | Primary SDK / backend |
|---|---|---|---|
| 1 | Auth — sign in / sign up (Clerk) | `/sign-in`, `/sign-up` (`SignInPage`, `SignUpPage`) | Clerk Expo SDK → SDK `getToken` |
| 2 | Auth — wallet sign-in | `/sign-in-web3` (`SignInWeb3`) | `web3auth.*` (needs backend bearer support, Brief G.1) |
| 3 | Onboarding (username/handle) | `/onboarding`, `/onboarding/web3` | `web3auth.username`, profile |
| 4 | Home feed | `/` (`V2HomePage`) | `videos.getFeatured/getTrending`, `channels.popular` |
| 5 | Discover | `/discover` (`DiscoveryPage`) | `discovery.getFeed` |
| 6 | Search | `/search` (`SearchPage`) | `search.videos` |
| 7 | Video player + detail | `/video/:id` (`SingleVideo`) | `videos.getById`, likes/comments/share, view tracking |
| 8 | Channel detail | `/channel/:identifier` (`ChannelDetailPage`) | `channels.getByHandle`, `channels.getVideos`, subscribe |
| 9 | Subscriptions | `/subscribed` (`SubscribedChannelPage`) | `channels` subscribed list |
| 10 | Profile + Wallet | `/profile` (`UserProfileWallet`) | `profile.me`, `profile.myWallet` |
| 11 | Profile settings | `/profile/settings` (`ProfileSettings`) | `profile` settings |
| 12 | Content pass detail / buy | `/p/:slug` (`PassDetailsPage`) | passes detail + Stripe/crypto checkout |
| 13 | Checkout return | `/pay/success` (`CheckoutSuccessPage`) | purchase follow-up (deep-link return, Brief G.1) |
| 14 | Gated playback (watch pass) | `/watch/:passId` (`WatchPassPage`) | access + `play-token` / `signed-url` |
| 15 | Library (owned passes/purchases) | composed (no single web route) | passes owned + purchases (Brief BFF `/mobile/library`) |

### Deferred to v2+ (out of v1)

- **Creator Hub** — upload, video/channel management, analytics, growth,
  content studio, monetization, create/manage passes (`/creator-hub/*`).
- **AI / CTR Thumbnail engine** (`/ai-thumbnails/*`).
- **NFT Marketplace** (`/nft-marketplace`) — no mounted backend API (Brief).
- **Moment NFT mint** (`/mint/moment-nft`), Leaderboard (`/leaderboard`),
  Create channel (`/create-channel`), FAQ, Embed (web-only).

### Build order

Auth (1–3) → core consumer (4–11) → passes & playback (12–15).

See `base-be/docs/MOBILE_READINESS_BRIEF.md` (section G) for backend prerequisites.
