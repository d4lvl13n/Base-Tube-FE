**Below is a concise overview of the API endpoints and (if any) webhooks used by each relevant component. No webhooks are actually used in the provided code; only direct REST API calls are made.**

---

### @DashboardTab.tsx
• Uses the custom hook useUserMetrics (from hooks/useMetricsData) which calls:
  – GET /api/v1/analytics/metrics  
    → Retrieves user metrics (likes given, comments, watches, etc.) for dashboard display.

---

### @ReferralsTab.tsx
• Currently uses placeholder data for referral codes.  
• The file references in src/api/profile.ts show potential calls to:
  – GET /api/v1/referrals  
  – POST /api/v1/referrals/generate  
  → Would be used to fetch or generate referral info, but this tab is presently in a “Coming Soon” state with no active API calls.

---

### @WalletTab.tsx
• Uses wallet data (UserWallet) that in practice comes from:  
  – GET /api/v1/profile/wallet  
    → Retrieves a user’s wallet balance and transaction history to display in the wallet overview.  

---

### @HistoryTab.tsx
• Uses two custom hooks, useWatchHistory and useLikesHistory (from hooks/useProfileData), which call:
  – GET /api/v1/profile/history/watch  
    → Fetches the user’s watch history.  
  – GET /api/v1/profile/history/likes  
    → Fetches the user’s liked videos history.  

---

### @SettingsTab.tsx
• Fetches and updates user profile settings via:
  – GET /api/v1/profile/settings  
    → Retrieves a user’s saved notification and account preferences.  
  – PUT /api/v1/profile/settings  
    → Updates a user’s notification/other settings.

---

### @profile.ts
• Acts as the central API utility for profile-related operations. Some key exported functions include:
  – getMyProfile() → GET /api/v1/profile
  – getMyWallet() → GET /api/v1/profile/wallet
  – getWatchHistory() → GET /api/v1/profile/history/watch
  – getLikesHistory() → GET /api/v1/profile/history/likes
  – getUserMetrics() → GET /api/v1/analytics/metrics
  – getProfileSettings() → GET /api/v1/profile/settings
  – updateProfileSettings() → PUT /api/v1/profile/settings
  – … and other similar endpoints for profile data (NFTs, referrals, etc.).

No actual webhooks are present in the displayed code — each component directly calls these REST APIs (via hooks or standard fetch calls) for data retrieval and updates.