# @basetube/mobile

BaseTube mobile app (Expo / React Native + TypeScript). Consumes the shared
[`@basetube/api`](../../packages/api-sdk) SDK.

## Run

From the monorepo root:

```bash
npm install
npm run build -w @basetube/api      # build the SDK (mobile imports its dist)
EXPO_PUBLIC_API_URL="https://backend.base.tube" npm run web -w @basetube/mobile
```

- `npm run web -w @basetube/mobile` — run in the browser (react-native-web)
- `npm run ios|android -w @basetube/mobile` — run on a simulator/device

## Configuration

| Env var | Purpose | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL | `https://backend.base.tube` |

## Phase status

- **Phase 1 (this app):** monorepo + SDK wiring; public screens — Home
  (featured + trending), Search, Video detail, Library placeholder.
- **Phase 2:** Clerk auth + wallet connect (`getToken` wired into the SDK).
- **Phase 3:** secure playback (signed-url / play-token) + native player.
- **Phase 4:** Stripe mobile checkout, pass library, push notifications.

See `base-be/docs/MOBILE_READINESS_BRIEF.md` (section G) for the full plan.
