# AGENTS.md

See `CLAUDE.md` for full project overview, build commands, architecture, and testing setup.

## Cursor Cloud specific instructions

### Running the dev server

```bash
PORT=3001 BROWSER=none npm start
```

### Environment

The `.env` file needs at minimum:
- `REACT_APP_API_URL=http://localhost:3000`
- `REACT_APP_CLERK_PUBLISHABLE_KEY` (real key needed for auth UI to render)
- `REACT_APP_WALLETCONNECT_PROJECT_ID`
- `REACT_APP_ONCHAINKIT_API_KEY`

### Gotchas

- **`npm install` requires `--legacy-peer-deps`** due to peer conflicts between wagmi/viem/rainbowkit/onchainkit.
- **Missing env vars crash at startup**: `REACT_APP_CLERK_PUBLISHABLE_KEY` and `REACT_APP_ONCHAINKIT_API_KEY` both throw in `src/index.tsx` if absent. Set placeholder values to start the dev server; Clerk will show an "invalid key" overlay but the app won't crash.
- **Jest test failures**: Some test suites fail due to `@coinbase/onchainkit/wallet` module resolution issues in the Jest transformer. This is a pre-existing issue.
- Backend must be running on port 3000 for API calls to work.
