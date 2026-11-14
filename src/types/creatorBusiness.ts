// src/modules/creatorBusiness/types.ts
//
// EXACT response shapes of the creator business read API
// (base path /api/v1/creator/business). The web creator screens are built
// from these types. Leaf module: no imports, safe to copy into the web repo.
//
// Envelope (every endpoint except the CSV export):
//   success: { success: true, data: <Response> }
//   failure: { success: false, error: { code: CreatorBusinessErrorCode, message: string, field?: string } }
//
// Money rules for every amount below:
//   - Always PER CURRENCY. EUR, USD and USDC are never added together.
//   - Integer MINOR units + `decimals` of that currency: EUR/USD cents (2),
//     USDC atomic units (6: 1 USDC = 1_000_000). Show amount / 10^decimals.
//   - A purchase recorded before amounts were stored is COUNTED but never
//     summed: see every `amountUnknownPurchases`. It is never shown as 0.
//
// Dates: `from` / `to` / `day` are UTC calendar days 'YYYY-MM-DD'. Moments
// are ISO-8601 UTC strings.

// --- Shared ------------------------------------------------------------------

export type CreatorBusinessErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_DATE'
  | 'INVALID_DATE_RANGE'
  | 'INVALID_CHANNEL_ID'
  | 'INVALID_PAGINATION'
  | 'INVALID_SORT'
  | 'INVALID_FILTER'
  | 'INVALID_SEARCH'
  | 'CHANNEL_NOT_FOUND'
  | 'PASS_NOT_FOUND'
  | 'CUSTOMER_NOT_FOUND'
  | 'CREATOR_BUSINESS_RATE_LIMITED'
  | 'CREATOR_BUSINESS_FAILED'
  // Creator actions (pause / resume, videos, selling readiness): see the sections below.
  | 'INVALID_BODY'
  | 'VIDEO_NOT_FOUND'
  | 'SALE_NOT_STARTED'
  | 'SALE_PAUSED_BY_BASETUBE'
  | 'SALE_CANNOT_RESUME'
  | 'LAST_VIDEO'
  | 'VIDEO_STILL_WORKS'
  | 'INVALID_VIDEO_URL'
  | 'VIDEO_ALREADY_IN_PASS'
  | 'VIDEO_NOT_VERIFIED'
  | 'REMOVAL_NOT_CONFIRMED'
  | 'REMOVAL_CONFIRMATION_STALE'
  | 'REVIEW_NOT_NEEDED'
  | 'REVIEW_ALREADY_REQUESTED'
  | 'CREATOR_ACTION_RATE_LIMITED'
  | 'CREATOR_ACTION_FAILED';

/**
 * Failure body (`error` of the envelope). Extra fields, only with these codes:
 *   blockers          SALE_CANNOT_RESUME: what must be fixed before sales can resume.
 *   buyersWithAccess  REMOVAL_NOT_CONFIRMED / REMOVAL_CONFIRMATION_STALE: the number to confirm.
 *   requestedAt       REVIEW_ALREADY_REQUESTED: when the pending request was sent (ISO).
 */
export interface CreatorBusinessErrorBody {
  code: CreatorBusinessErrorCode;
  message: string;
  field?: string;
  blockers?: Array<{ code: PurchaseBlockCode; reason: string }>;
  buyersWithAccess?: number;
  requestedAt?: string;
}

export interface DateRange {
  from: string;
  to: string;
  /** Days in the range, both ends included. */
  days: number;
  /**
   * True for range=all: `from` is the day of the first purchase or checkout
   * on the selected passes (today when there is none), `to` is today.
   */
  allTime: boolean;
}

/** Size of one point of the series: day up to 92 days, week (Monday–Sunday, UTC) up to 731 days, month beyond. */
export type Granularity = 'day' | 'week' | 'month';

/** Pass sales can be switched off for the whole platform (CONTENT_PASSES_ENABLED). */
export interface SalesSwitch {
  salesEnabled: boolean;
  /** Plain sentence when salesEnabled is false, else null. */
  salesDisabledReason: string | null;
}

export interface ScopeInfo {
  /** The channel filter that was applied, or null for "all your channels". */
  channelId: number | null;
  channels: Array<{ id: number; name: string; handle: string }>;
  /** Passes counted (after the channel filter). 0 = nothing to show yet. */
  passCount: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  /** Rows matching, all pages together. */
  total: number;
}

/** An amount that is only known for some rows (processing fee, net received). */
export interface PartlyKnownAmount {
  /** Sum over the purchases where it is known; null when known for none. */
  amount: number | null;
  /** Purchases where it is known. */
  knownFor: number;
  /** Purchases where it is not known (not counted in `amount`). */
  unknownFor: number;
}

export type SourceKey =
  | 'youtube'
  | 'x'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'google'
  | 'newsletter'
  | 'direct'
  | 'other'
  | 'unknown';

export interface SourceRef {
  key: SourceKey;
  /** Plain label: 'YouTube', 'X', 'Instagram', 'TikTok', 'Facebook', 'Google search', 'Newsletter / email', 'Direct', 'Other site', 'Unknown'. */
  label: string;
}

// --- Totals (overview, passes, pass detail) ---------------------------------

export interface MoneyLine {
  /** 'EUR', 'USD', 'USDC'… */
  currency: string;
  /** 2 for card currencies, 6 for USDC. */
  decimals: number;
  /** Paid purchases in this currency (refunded and disputed ones included). */
  purchases: number;
  /** Passes sold in this currency (sum of quantities). */
  units: number;
  /** What buyers paid, for purchases still standing (not refunded / disputed) with a recorded amount. */
  gross: number;
  /** BaseTube's fee on those purchases. */
  platformFee: number;
  /** Your earnings (gross − BaseTube's fee) on those purchases. */
  proceeds: number;
  /** Standing purchases with no recorded amount: counted, not summed. */
  amountUnknownPurchases: number;
  /** Card processing fee taken on your Stripe account, where Stripe told us. */
  processingFee: PartlyKnownAmount;
  /** What reached your Stripe balance after all fees, where Stripe told us. */
  netReceived: PartlyKnownAmount;
  refunds: {
    /** Purchases refunded (access removed). */
    count: number;
    /** What those purchases had cost the buyers (recorded amounts only). */
    refundedPurchasesGross: number;
    /** Money actually returned, where recorded. */
    amountReturned: number;
    /** Refunded purchases whose returned amount is not recorded. */
    amountUnknownCount: number;
    /** Small refunds that left the buyer's access in place (still counted in proceeds). */
    keptAccessCount: number;
    keptAccessAmount: number;
  };
  disputes: {
    /** Purchases the buyer's bank disputed (access removed). */
    count: number;
    /** What those purchases had cost the buyers (recorded amounts only). */
    gross: number;
    amountUnknownCount: number;
  };
}

export interface Totals {
  /** Paid purchases (refunded and disputed ones included). */
  purchases: number;
  /** Passes sold (sum of quantities). */
  units: number;
  /** Distinct people who paid in the range. */
  buyers: number;
  /** Buyers whose first paid purchase with you is in the range. */
  newBuyers: number;
  /** Buyers who had already paid you before the range. */
  returningBuyers: number;
  /** All currencies: standing purchases with no recorded amount. */
  amountUnknownPurchases: number;
  refunds: { count: number };
  disputes: { count: number };
  /** One line per currency, sorted by currency code. Empty when nothing was paid. */
  money: MoneyLine[];
}

/** One point of the series (named "daily" for history; its size is `granularity`). */
export interface DailyPoint {
  /** First day of the point inside the range (a week or month cut by the range starts later). */
  day: string;
  /** Last day of the point inside the range (= day for a daily point). */
  end: string;
  purchases: number;
  buyers: number;
  /** One entry per currency seen in the range (same currencies on every day; zero when nothing). */
  money: Array<{ currency: string; decimals: number; purchases: number; proceeds: number }>;
}

export interface Funnel {
  /** Visits to your pass pages in the range; null when visits were not counted for any of it. */
  visits: number | null;
  /** Visitors counted once per pass per day, days added up; null like `visits`. */
  uniqueVisitors: number | null;
  /** First UTC day visits were counted; null when never. */
  visitCountingSince: string | null;
  /** False when visit counting started after the range began (the visit numbers cover only part of it). */
  visitsCoverWholeRange: boolean;
  /** Distinct signed-in people who started a checkout in the range. */
  checkoutsStarted: number;
  /** Of those, people who paid (from a checkout started in the range). */
  paid: number;
  /** Of those, people who did not pay. Never named anywhere. */
  abandoned: number;
  /** paid / uniqueVisitors, 0–1; null when visitors are unknown or 0. */
  visitConversion: number | null;
  /** paid / checkoutsStarted, 0–1; null when no checkout started. */
  checkoutConversion: number | null;
}

export interface HoldersNow {
  /** People who hold at least one of your passes right now. */
  activeHolders: number;
  /** Of those, people who have not opened any pass they hold (no first-play mark and no playback link on its videos). */
  neverOpened: number;
}

export type DefinitionKey =
  | 'days'
  | 'paymentMoment'
  | 'purchase'
  | 'unit'
  | 'gross'
  | 'platformFee'
  | 'proceeds'
  | 'earningsBeforeCardFee'
  | 'processingFee'
  | 'netReceived'
  | 'amountUnknown'
  | 'buyer'
  | 'newBuyer'
  | 'returningBuyer'
  | 'activeHolder'
  | 'neverOpened'
  | 'opened'
  | 'refunded'
  | 'disputed'
  | 'checkoutStarted'
  | 'paidCheckout'
  | 'abandoned'
  | 'visits'
  | 'uniqueVisitors'
  | 'source'
  | 'previousPeriod'
  | 'currencies'
  | 'conversion'
  | 'allTime'
  | 'series'
  | 'canContact';

/** "How this is counted": one plain sentence per number on the screen. */
export type Definitions = Record<DefinitionKey, string>;

// --- GET /overview -------------------------------------------------------------

export interface OverviewResponse extends SalesSwitch {
  range: DateRange;
  /** Same length, just before `range`. null for all time. */
  previousRange: DateRange | null;
  scope: ScopeInfo;
  totals: Totals;
  /** null for all time. */
  previous: Totals | null;
  granularity: Granularity;
  daily: DailyPoint[];
  funnel: Funnel;
  holdersNow: HoldersNow;
  definitions: Definitions;
  generatedAt: string;
}

// --- GET /passes -----------------------------------------------------------------

/**
 * 'on_sale' only when someone can actually buy right now.
 * 'paused': you paused the sales (you can resume them).
 * 'paused_by_basetube': BaseTube paused the sales (only BaseTube can resume them).
 * 'sales_off': pass sales are switched off on the whole platform.
 * 'not_available': blocked for another reason, see purchaseBlock.code.
 */
export type PassSaleStatus =
  | 'draft'
  | 'publishing'
  | 'publish_failed'
  | 'on_sale'
  | 'paused'
  | 'paused_by_basetube'
  | 'sold_out'
  | 'sales_off'
  | 'not_available';

/**
 * Same codes as `purchase_block_reason_code` of GET /passes/creator/all, plus
 * CONTENT_PASSES_DISABLED, and PASS_SALE_PAUSED_BY_BASETUBE where that route
 * says PASS_SALE_INACTIVE for a pause made by BaseTube (buyers and the mobile
 * app see one "paused" code; the creator sees who paused it).
 */
export type PurchaseBlockCode =
  | 'CONTENT_PASSES_DISABLED'
  | 'PASS_CHANNEL_NOT_APPROVED'
  | 'PASS_NOT_PUBLISHED'
  | 'PASS_NOT_ONCHAIN'
  | 'PASS_CONTENT_INVALID'
  | 'PASS_SALE_INACTIVE'
  | 'PASS_SALE_PAUSED_BY_BASETUBE'
  | 'PASS_SOLD_OUT';

export interface PurchaseBlock {
  canPurchase: boolean;
  /** null when canPurchase. */
  code: PurchaseBlockCode | null;
  /** Plain sentence for the creator; null when canPurchase. */
  reason: string | null;
}

/** Sales of the pass are switched off, and by whom. */
export interface SalePause {
  /** 'you' = you paused them; 'basetube' = BaseTube did (also when it was not recorded who). */
  by: 'you' | 'basetube';
  /** When (ISO); null when it was not recorded. */
  at: string | null;
  /** BaseTube's reason, when one was written. Always null for your own pause. */
  reason: string | null;
  /** True only for your own pause. */
  canResume: boolean;
}

export interface PassRow {
  passId: string;
  title: string;
  channelId: number;
  status: PassSaleStatus;
  statusLabel: string;
  /** The public sales page. */
  publicUrl: string;
  price: { amount: number; currency: string; decimals: number };
  supply: {
    /**
     * How many passes exist. Every pass has one; null only on a pass created
     * before caps were required, which cannot be published until one is set.
     */
    cap: number | null;
    /** Still available to buy; null when cap is null. */
    remaining: number | null;
    /** Most passes one person may buy (never above cap). */
    maxPerBuyer: number;
  };
  createdAt: string;
  purchaseBlock: PurchaseBlock;
  /** null while sales are on. Set even when another reason blocks the pass first. */
  salePause: SalePause | null;
  /** For the selected range. */
  totals: Totals;
  /** For the selected range (visits null when not counted, as in the overview). */
  funnel: Funnel;
  holdersNow: HoldersNow;
}

export type PassSort = 'newest' | 'title' | 'purchases' | 'buyers';

export interface PassesResponse extends SalesSwitch {
  range: DateRange;
  scope: ScopeInfo;
  sort: PassSort;
  dir: 'asc' | 'desc';
  items: PassRow[];
  pagination: Pagination;
  generatedAt: string;
}

// --- GET /passes/:passId -----------------------------------------------------------

export interface PassVideoStat {
  videoId: string;
  title: string;
  /** Holders of the pass (now) who opened this video. Your own plays are not counted. */
  openedBy: number;
  /** Holders of the pass now. */
  holders: number;
}

export interface PassDetailResponse extends SalesSwitch {
  range: DateRange;
  previousRange: DateRange | null;
  pass: Omit<PassRow, 'totals' | 'holdersNow' | 'funnel'>;
  totals: Totals;
  previous: Totals | null;
  granularity: Granularity;
  daily: DailyPoint[];
  funnel: Funnel;
  holdersNow: HoldersNow;
  videos: PassVideoStat[];
  /** True when the pass has more videos than listed (cap 500). */
  videosTruncated: boolean;
  sources: SourcesBlock;
  definitions: Definitions;
  generatedAt: string;
}

// --- GET /customers ----------------------------------------------------------------

export type AccessState = 'active' | 'refunded' | 'disputed' | 'none';
export type OpenedState = 'opened' | 'not_opened' | 'no_access';
/** Why the email is not shown. */
export type EmailHiddenReason = 'bought_before_disclosure' | 'no_real_address';

export interface CustomerRow {
  /** Opaque id, only valid for you. Use it for GET /customers/:customerId. */
  customerId: string;
  /** Real name, else the username they chose, else 'Buyer' + a short code (e.g. 'Buyer 3FA9C1'). */
  displayName: string;
  /** Shown only when the buyer was told at checkout that you would see it, and it is a real address. */
  email: string | null;
  emailHidden: EmailHiddenReason | null;
  /** First / last paid purchase on the selected channel(s), ISO moment. */
  firstPurchaseAt: string;
  lastPurchaseAt: string;
  /** Paid purchases (refunded / disputed included). */
  purchases: number;
  /** Different passes bought. */
  passesBought: number;
  /** Passes they can open right now. */
  passesHeld: number;
  accessState: AccessState;
  /**
   * A held pass counts as opened when it has a first-play mark or a playback
   * link on one of its videos (your own plays excluded). 'not_opened' = holds
   * passes, opened none; this is exactly the opened=never filter.
   */
  opened: {
    state: OpenedState;
    passesHeld: number;
    passesOpened: number;
    /** Distinct videos opened, across the passes they hold from you. */
    videosOpened: number;
    /** Videos in the passes they hold from you. */
    videosAvailable: number;
  };
  /** Your earnings from their standing purchases, per currency. */
  paidToYou: Array<{ currency: string; decimals: number; amount: number; amountUnknownPurchases: number }>;
  /** Source of their first purchase (on the selected channel(s)). */
  firstSource: SourceRef;
  /** True when their first paid purchase with you is before the selected range. */
  isReturning: boolean;
  /** They agreed you may contact them (and have not withdrawn it). */
  canContact: boolean;
  /** When that agreement was given (ISO). null whenever canContact is false. */
  canContactSince: string | null;
}

export type CustomerSort = 'last_purchase' | 'first_purchase' | 'total_paid' | 'purchases';

export interface CustomersResponse {
  range: DateRange;
  scope: ScopeInfo;
  sort: CustomerSort;
  dir: 'asc' | 'desc';
  /** Currency used to sort by total paid. */
  sortCurrency: string;
  filters: CustomerFilters;
  items: CustomerRow[];
  pagination: Pagination;
  /** The CSV export stops after this many people; compare with pagination.total. */
  exportRowCap: number;
  generatedAt: string;
}

export interface CustomerFilters {
  search: string | null;
  passId: string | null;
  access: AccessState | null;
  buyerType: 'new' | 'returning' | null;
  canContact: boolean | null;
  opened: 'opened' | 'never' | null;
  source: SourceKey | null;
}

// --- GET /customers/:customerId --------------------------------------------------

export interface CustomerPurchase {
  purchaseId: string;
  passId: string;
  passTitle: string;
  paidAt: string;
  quantity: number;
  rail: 'card' | 'crypto';
  currency: string;
  decimals: number;
  /** null when this purchase's amount was not recorded. */
  gross: number | null;
  platformFee: number | null;
  proceeds: number | null;
  /** null when not known. */
  netReceived: number | null;
  /** Raw purchase status (pending, claimed, refunded…). */
  status: string;
  accessState: AccessState;
  refund: null | {
    /** null for refunds recorded before this date was stored. */
    refundedAt: string | null;
    /** null when not recorded. */
    amountReturned: number | null;
    /** False for a small refund that left access in place. */
    accessRemoved: boolean;
  };
  disputedAt: string | null;
  source: SourceRef;
  campaign: string | null;
}

export interface CustomerPassOpened {
  passId: string;
  passTitle: string;
  hasAccess: boolean;
  /** Distinct videos of the pass they opened (got a playback link for). */
  videosOpened: number;
  videosInPass: number;
  /** UTC day only, never a time. null = not opened yet. */
  firstOpenedDay: string | null;
}

export interface CustomerDetailResponse {
  range: DateRange;
  customer: CustomerRow;
  purchases: CustomerPurchase[];
  purchasesPagination: Pagination;
  /** Every pass they bought from you (at most the number of passes you have). */
  passes: CustomerPassOpened[];
  generatedAt: string;
}

// --- GET /customers/export -------------------------------------------------------
// text/csv; charset=utf-8 (with BOM). Headers: X-Total-Count (people matching),
// X-Export-Row-Count (rows written), X-Export-Truncated ('true' | 'false').
// Columns: Customer id, Name, Email (only for people who agreed to be
// contacted), Can contact, Can contact since (UTC, empty unless Can contact),
// First purchase (UTC), Last purchase (UTC),
// Purchases, Passes held, Access, Opened, First source, New or returning,
// then one "Your earnings (CUR)" column per currency (decimal, e.g. 12.50).

// --- GET /sources ------------------------------------------------------------------

export interface SourceMoney {
  currency: string;
  decimals: number;
  proceeds: number;
  amountUnknownPurchases: number;
}

export interface CampaignRow {
  /** null = purchases from this source without a campaign name. */
  campaign: string | null;
  checkoutsStarted: number;
  checkoutsPaid: number;
  paidPurchases: number;
  buyers: number;
  money: SourceMoney[];
  /** checkoutsPaid / checkoutsStarted, 0–1; null when no checkout. */
  checkoutConversion: number | null;
}

export interface SourceRow extends SourceRef {
  /** null when visits were not counted in the range. Visits have no campaign breakdown. */
  visits: number | null;
  uniqueVisitors: number | null;
  /** People who started a checkout in the range, credited to this source. */
  checkoutsStarted: number;
  /** Of those, people who paid. */
  checkoutsPaid: number;
  /** Paid purchases in the range credited to this source. */
  paidPurchases: number;
  /** Distinct people behind those purchases. */
  buyers: number;
  money: SourceMoney[];
  /** buyers / uniqueVisitors, 0–1; null when visitors unknown or 0. */
  visitorConversion: number | null;
  checkoutConversion: number | null;
  /** Top 20 campaigns by paid purchases. */
  campaigns: CampaignRow[];
  campaignsTruncated: boolean;
}

export interface SourcesBlock {
  visitCountingSince: string | null;
  visitsCoverWholeRange: boolean;
  /** Sources with any visit, checkout or purchase; most paid purchases first. */
  sources: SourceRow[];
}

export interface SourcesResponse extends SourcesBlock {
  range: DateRange;
  scope: ScopeInfo;
  definitions: Pick<Definitions, 'source' | 'visits' | 'uniqueVisitors' | 'checkoutStarted' | 'paidCheckout'>;
  generatedAt: string;
}

// --- GET /payouts --------------------------------------------------------------------

export type SettlementRoute = 'card_direct' | 'card_cross_rail' | 'crypto_split' | 'crypto_cross_rail';

export interface PayoutLine {
  currency: string;
  decimals: number;
  /** Paid sales still standing. */
  salesCount: number;
  sold: number;
  baseTubeFee: number;
  /** Your earnings. = settled + pending + failed. */
  creatorShare: number;
  settled: number;
  settledCount: number;
  pending: number;
  pendingCount: number;
  /** Oldest sale whose money is still on its way. */
  pendingSince: string | null;
  pendingRoutes: Array<{ route: SettlementRoute; label: string }>;
  failed: number;
  failedCount: number;
  refundedCount: number;
  refundedGross: number;
  disputedCount: number;
  disputedGross: number;
  /** Sales with no recorded amount (counted, not summed). */
  withoutAmount: number;
  lastSettledAt: string | null;
  lastDistributionAt: string | null;
}

export interface StripeAccountState {
  connected: boolean;
  detailsSubmitted: boolean;
  canReceiveCardMoney: boolean;
  summary: string;
}

export interface PayoutsResponse {
  /** null = all time (default, or range=all). Set only when from/to were given. */
  range: DateRange | null;
  scope: ScopeInfo;
  card: {
    channels: Array<{ channelId: number; name: string; stripeAccount: StripeAccountState; lines: PayoutLine[] }>;
  };
  crypto: {
    lines: PayoutLine[];
    /** Where crypto sales are paid: wallet masked as 0x1234…abcd. */
    destinations: Array<{ walletMasked: string | null; routing: 'creator' | 'platform_settlement' | null; routingLabel: string; passes: number }>;
    lastDistributionAt: string | null;
  };
  /** Your payout choice per pass. */
  payoutChoices: Array<{ preference: 'fiat' | 'crypto' | null; label: string; passes: number }>;
  notes: string[];
  generatedAt: string;
}

// =====================================================================================
// Creator actions. Same base path, same envelope, signed-in owner only: a pass,
// video or channel that is not yours answers 404 (PASS_NOT_FOUND,
// VIDEO_NOT_FOUND, CHANNEL_NOT_FOUND), never 403. Every action answers the
// pass's new state so the screens update without waiting for the next read.
// =====================================================================================

/** A pass without its numbers: what GET /passes says about it, minus totals. */
export type PassSummary = Omit<PassRow, 'totals' | 'holdersNow' | 'funnel'>;

// --- POST /passes/:passId/sale/pause  and  POST /passes/:passId/sale/resume -----------
// Body: none. Pause: new buyers can no longer start a checkout; everyone who
// bought keeps their access, and a checkout already paid is still delivered.
// Pause again / resume again = no change (unchanged: true).
// Refusals: SALE_NOT_STARTED (409, the pass is not published), SALE_PAUSED_BY_BASETUBE
// (409, only BaseTube can resume or re-pause it), SALE_CANNOT_RESUME (409, with
// `blockers`: what must be fixed first; sales stay paused).

export interface SaleActionResponse {
  pass: PassSummary;
  /** True when the pass was already in the asked state. */
  unchanged: boolean;
  /** Plain sentence: what happened. */
  message: string;
}

// --- GET /passes/:passId/videos ---------------------------------------------------------

/** Why a video cannot be sold (see `problemReason` for the sentence). */
export type PassVideoProblem = 'not_youtube' | 'youtube_not_found' | 'youtube_private' | 'youtube_public' | 'youtube_not_owned';

export interface CreatorPassVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  /** 'youtube', 'twitch', 'other'… */
  platform: string;
  /** null = this video can be sold. */
  problem: PassVideoProblem | null;
  problemReason: string | null;
  /** Last answer read from YouTube (ISO); null when never checked. */
  lastCheckedAt: string | null;
  /** "Check again" is possible (it is a YouTube link). */
  canCheck: boolean;
  /** False when removing it is refused; `removeBlockedReason` says why. */
  canRemove: boolean;
  removeBlockedReason: string | null;
  /**
   * "Replace this video" is possible: the video cannot be played by buyers (see
   * `problem`), or nobody has bought the pass yet. The main action for a broken video.
   */
  canReplace: boolean;
  addedAt: string;
}

export interface PassVideosResponse {
  pass: PassSummary;
  /** Videos in the pass now, oldest first. Removed videos are not listed. */
  videos: CreatorPassVideo[];
  /** People who can open this pass right now. Each of them can watch every video of it. */
  buyersWithAccess: number;
  /** Video order is the order they were added in; it cannot be changed yet. */
  reorderable: false;
}

// --- POST /passes/:passId/videos/:videoId/remove -----------------------------------------
// A pass is a fixed promise to its buyers, not a subscription. So:
//   - no buyer yet (draft, unsold pass): any video can be removed (free editing);
//   - people have access: only a video they can NOT play any more (`problem` set:
//     deleted, private, not the creator's…) can be removed; a video that still
//     works is refused (409 VIDEO_STILL_WORKS). Prefer "replace" below.
// Body: { confirmBuyersWithAccess?: number }. When people have access, the body
// must carry the number of buyers the creator was shown (GET /videos): missing →
// 409 REMOVAL_NOT_CONFIRMED, different from now → 409 REMOVAL_CONFIRMATION_STALE;
// both with `buyersWithAccess`. Never removes the last video (409 LAST_VIDEO).
// The video is taken out of the pass, not deleted: purchases, play history and
// watch statistics keep it; nobody can play it any more; adding the same
// YouTube video again brings it back.

export interface RemoveVideoResponse extends PassVideosResponse {
  removedVideoId: string;
  message: string;
}

// --- POST /passes/:passId/videos/:videoId/replace -------------------------------------------
// Body: { srcUrl: string, title?: string }. Puts a working YouTube video in the
// place of this one (same position in the pass), in one step: the new video is
// checked first (a YouTube link, on the pass's YouTube channel, unlisted), then
// it takes the old one's place and the old one leaves the pass (kept for history).
// Buyers keep access and get the new video. While people have access, only a
// video they can no longer play may be replaced (409 VIDEO_STILL_WORKS).
// Refusals: INVALID_VIDEO_URL (400), VIDEO_NOT_VERIFIED (400: YouTube said no, the
// message says why), VIDEO_ALREADY_IN_PASS (409).

export interface ReplaceVideoResponse extends PassVideosResponse {
  replacedVideoId: string;
  newVideoId: string;
  message: string;
}

// --- POST /passes/:passId/videos/:videoId/check ---------------------------------------------
// Body: none. Asks YouTube now. Only YouTube's own answers are kept; when the
// check cannot be made nothing changes and `outcome` says why.

export type VideoCheckOutcome = 'ok' | 'problem' | 'not_youtube' | 'youtube_not_connected' | 'failed';

export interface CheckVideoResponse extends PassVideosResponse {
  outcome: VideoCheckOutcome;
  /** Plain sentence: what YouTube said, or why it could not be asked. */
  message: string;
  video: CreatorPassVideo;
}

// --- GET /readiness?channelId= -------------------------------------------------------------
// What a channel needs before its passes can be sold, and what to do next.
// No channelId = every channel of yours.

/**
 * 'done'     nothing to do.
 * 'todo'     you can do it now (see `action`).
 * 'waiting'  you did your part; someone else is on it (Stripe reviewing your details).
 * 'basetube' only BaseTube can lift it (see `basetubeReason` and `action`).
 */
export type ReadinessState = 'done' | 'todo' | 'waiting' | 'basetube';

export type ReadinessItemKey = 'channel_active' | 'youtube' | 'approval' | 'card_payouts' | 'payout_method' | 'published_pass';

export type ReadinessActionKind =
  | 'connect_youtube'
  | 'start_stripe'
  | 'resume_stripe'
  | 'choose_payout'
  | 'publish_pass'
  | 'create_pass'
  | 'request_review'
  | 'contact_basetube';

export interface ReadinessAction {
  kind: ReadinessActionKind;
  /** Button text. */
  label: string;
  /** A page of the app to open, or a mailto: link (contact_basetube); null for API actions. */
  href: string | null;
  /**
   * The API call that does it (path from the API root), or null for links.
   * connect_youtube: GET answers { url } (Google sign-in) to open.
   * start_stripe / resume_stripe: POST answers { onboardingUrl } (Stripe) to open; start_stripe needs `country` in the body.
   * choose_payout: PATCH with { creator_settlement_preference: 'fiat' | 'crypto' } (once per pass).
   * request_review: POST with { message? }.
   */
  api: { method: 'GET' | 'POST' | 'PATCH'; path: string; body: Record<string, unknown> | null } | null;
}

export interface ReadinessItem {
  key: ReadinessItemKey;
  state: ReadinessState;
  /** Short title ("YouTube channel connected"). */
  title: string;
  /** One plain sentence about the current state. */
  detail: string;
  /** Needed for the channel's passes to be sold the way you chose. */
  required: boolean;
  /** What you can do now; null when the item is done or when you only wait. */
  action: ReadinessAction | null;
  /** 'basetube' items: the reason BaseTube recorded, when one was written. */
  basetubeReason: string | null;
  /** payout_method / published_pass: the passes concerned. */
  passes: Array<{ passId: string; title: string }>;
}

export interface ChannelReadiness {
  channelId: number;
  channelName: string;
  /** Every required item is done. */
  ready: boolean;
  /** One line: "Ready to sell" or the first thing to do. */
  summary: string;
  items: ReadinessItem[];
  /** "Request review" (only when BaseTube stopped this channel's pass sales). */
  review: {
    /** You can send a request now. */
    canRequest: boolean;
    /** Your pending request (ISO), or null. A new one can be sent 7 days later. */
    requestedAt: string | null;
  };
}

export interface ReadinessResponse extends SalesSwitch {
  channels: ChannelReadiness[];
  generatedAt: string;
}

// --- POST /readiness/:channelId/review-request ------------------------------------------------
// Body: { message?: string } (at most 1000 characters). Sends BaseTube a request
// to look at the channel again (an alert on the admin panel's Alerts page and
// an email to the team). One request per channel per 7 days:
// REVIEW_ALREADY_REQUESTED (409, with requestedAt). REVIEW_NOT_NEEDED (409) when
// BaseTube has not stopped this channel's pass sales.

export interface ReviewRequestResponse {
  requestedAt: string;
  message: string;
}

// --- Legacy GET /api/v1/creator/sales (kept for the current web dashboard) -------
// Shape unchanged; additive fields: card/crypto `amount_unknown_count`,
// `by_currency`, and on every row `paid_at`, `checkout_started_at`,
// `buyer_display_name`. `purchased_at` now holds the payment moment.
