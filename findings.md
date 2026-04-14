# Findings & Decisions

## Requirements
- Validate whether the submitted report is technically correct.
- Determine whether wallet authentication can be bypassed.
- Determine whether frontend assets disclose privileged information.
- Separate confirmed evidence from exaggeration.

## Research Findings
- Planning files created to track a multi-step security validation.
- `src/api/web3authapi.ts` logs in by POSTing only `{ walletAddress }` to `/api/v1/web3auth/login` with cookies enabled; no nonce or signature is sent.
- `src/hooks/useWeb3Auth.ts` treats wallet connection plus backend login response as sufficient authentication and never asks the wallet to sign a message.
- `src/mocks/handlers/auth.handlers.ts` models a stronger flow under `/api/v1/web3/nonce` and `/api/v1/web3/verify` that requires `wallet_address`, `signature`, and `nonce`, which does not match the live client contract in `web3authapi.ts`.
- `src/components/pages/ProtectedRoute.tsx` gates routes on any authenticated session, not on role; `/monitoring` is therefore available to any authenticated user if backend authorization also permits it.
- `src/api/monitoring.ts` exposes system-health endpoints to the client, including queue, ffmpeg, storage, and database metrics.
- The archived `build.tar.gz` bundle hardcodes `http://164.90.191.118:3000` as `REACT_APP_API_URL` and uses that origin for image/API paths; this supports the reporter's IP-disclosure claim.
- I did not find the reported administrator wallet address `0xc451eE5Bb7ABA625a11D804734F2bb6Cb13d3089` in current source, the archived bundle, or the source map.
- I did not find evidence of private keys in current source or the archived bundle.
- The current backend files at `/Users/damienlarquey/basetube/base-be` now require `signature` for login, signup, and wallet linking in `web3AuthController.ts`, and call `verifyWalletSignature(...)` before issuing a session or linking a wallet.
- The current backend `web3authService.ts` verifies signatures by loading a Redis nonce, deleting it, and checking `isValidWalletAuthSignature(...)`; this is a real challenge-response path, not wallet-address-only auth.
- The current backend monitoring and metrics routes use `requireInternalToken(...)`, so the public-monitoring claim is not supported by the current code at those paths.
- Conclusion: the user's backend summary appears to describe an earlier vulnerable revision, not the current contents of those referenced files.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Review auth implementation and tests first | The highest-risk claim is authentication bypass |
| Treat monitoring exposure separately from wallet-auth bypass | The route and API exposure matter even if the reporter overstates “infrastructure compromise” |
| Do not treat exposed wallet addresses or chain IDs as secrets by default | Public addresses and network IDs are identifiers; their risk depends on surrounding authorization logic |
| Distinguish current code from historical vulnerable state | The backend files now show remediations that invalidate the claimed present-tense findings |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
|       |            |

## Resources
- `/Users/damienlarquey/base-tube-mockup/src/api/auth.ts`
- `/Users/damienlarquey/base-tube-mockup/src/api/web3authapi.ts`
- `/Users/damienlarquey/base-tube-mockup/src/hooks/useWeb3Auth.ts`
- `/Users/damienlarquey/base-tube-mockup/src/components/pages/ProtectedRoute.tsx`
- `/Users/damienlarquey/base-tube-mockup/src/api/monitoring.ts`
- `/Users/damienlarquey/base-tube-mockup/src/hooks/useWallet.ts`
- `/Users/damienlarquey/base-tube-mockup/src/tests/auth`
- `/Users/damienlarquey/base-tube-mockup/build.tar.gz`
- `/Users/damienlarquey/basetube/base-be/src/controllers/web3AuthController.ts`
- `/Users/damienlarquey/basetube/base-be/src/services/web3authService.ts`
- `/Users/damienlarquey/basetube/base-be/src/routes/monitoring.ts`
- `/Users/damienlarquey/basetube/base-be/src/routes/metricsRoutes.ts`

## Visual/Browser Findings
- None yet.
