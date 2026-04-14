export type GrowthLeaderboardMode = 'xp' | 'reputation' | 'credits';
export type GrowthRewardLayer = 'xp' | 'reputation' | 'credits';
export type GrowthProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'claimed' | 'expired';
export type GrowthHistoryDirection = 'earn' | 'burn' | 'grant' | 'revoke' | 'adjust' | 'expire';
export type GrowthRewardRedemptionStatus = 'requested' | 'fulfilled' | 'rejected' | 'cancelled';
export type GrowthHistorySourceType =
  | 'growth_event'
  | 'mission'
  | 'quest'
  | 'reputation_signal'
  | 'admin_adjustment';

export interface GrowthVisibility {
  activePhaseKeys: string[];
  xpVisible: boolean;
  reputationVisible: boolean;
  creditsVisible: boolean;
  missionsEnabled: boolean;
  questsEnabled: boolean;
  leaderboardMode: GrowthLeaderboardMode;
  allocationMode: string | null;
}

export interface GrowthBalances {
  xp: number | null;
  reputation: number | null;
  credits: number | null;
}

export interface GrowthHiddenState {
  reputationTracked?: boolean;
}

export interface GrowthSignal {
  key?: string;
  label?: string;
  value?: string | number | boolean | null;
  [key: string]: unknown;
}

export interface GrowthMeData {
  visibility: GrowthVisibility;
  balances: GrowthBalances;
  hiddenState: GrowthHiddenState;
  signals: GrowthSignal[];
}

export interface GrowthStepProgress {
  stepKey: string;
  eventType: string;
  targetCount: number;
  ordering: number;
  currentCount: number;
  completed: boolean;
}

export interface GrowthMission {
  id: number;
  missionKey: string;
  title: string;
  description: string;
  visibility: string;
  reward: {
    layer: GrowthRewardLayer;
    amount: number;
  };
  progress: {
    status: GrowthProgressStatus;
    current: number;
    completedAt: string | null;
    rewardClaimedAt: string | null;
  };
  steps: GrowthStepProgress[];
}

export interface GrowthQuestCriterion {
  key: string;
  eventType: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export interface GrowthQuest {
  id: number;
  questKey: string;
  templateKey: string;
  reward: {
    layer: GrowthRewardLayer;
    amount: number;
  };
  progress: {
    status: GrowthProgressStatus;
    current: number;
    completedAt: string | null;
    rewardClaimedAt: string | null;
  };
  criteria: GrowthQuestCriterion[];
}

export interface GrowthHistoryEntry {
  id: number | string;
  accountId?: number | null;
  userId: string;
  layer: GrowthRewardLayer;
  direction: GrowthHistoryDirection;
  amount: number;
  scoreCode: string | null;
  sourceType: GrowthHistorySourceType | string | null;
  sourceId: string | null;
  eventType: string | null;
  ruleId: number | null;
  campaignId: string | null;
  seasonId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GrowthHistoryPagination {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface GrowthLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  score: number;
}

export interface GrowthRewardItem {
  id: number;
  rewardKey?: string | null;
  title: string;
  description: string | null;
  rewardType?: string | null;
  costLayer?: GrowthRewardLayer | null;
  costAmount?: number | null;
  inventoryCap?: number | null;
  inventoryUsed?: number | null;
  status?: string | null;
  phaseScope?: string | null;
  version?: number | null;
  maxPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface GrowthResponse<T> {
  success: true;
  data: T;
}

export interface GrowthMissionsData {
  enabled: boolean;
  visibility: GrowthVisibility;
  items: GrowthMission[];
}

export interface GrowthQuestsData {
  enabled: boolean;
  visibility: GrowthVisibility;
  items: GrowthQuest[];
}

export interface GrowthHistoryData {
  visibility: GrowthVisibility;
  entries: GrowthHistoryEntry[];
  pagination: GrowthHistoryPagination;
}

export interface GrowthLeaderboardData {
  visibility: GrowthVisibility;
  mode: GrowthLeaderboardMode;
  visible: boolean;
  entries: GrowthLeaderboardEntry[];
}

export interface GrowthRewardsData {
  visibility: GrowthVisibility;
  items: GrowthRewardItem[];
}

export interface GrowthRewardRedemption {
  id: number;
  rewardId: number;
  userId: string;
  status: GrowthRewardRedemptionStatus;
  costLayer: GrowthRewardLayer;
  costAmount: number;
  burnLedgerEntryId: number | null;
  refundLedgerEntryId: number | null;
  statusReason: string | null;
  fulfillmentPayload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  fulfilledAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  reward?: GrowthRewardItem;
}

export interface GrowthRedemptionsData {
  visibility: GrowthVisibility;
  items: GrowthRewardRedemption[];
  pagination: GrowthHistoryPagination;
}

export interface GrowthReferralApplication {
  id: number;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string | null;
  status: 'registered' | 'activated' | 'qualified' | 'rejected';
  registeredAt: string;
  activatedAt: string | null;
  qualifiedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompatibilityGrowthUserPoints {
  userId: string;
  totalPoints: number;
  updatedAt?: string;
  rank?: {
    rank: string;
    minPoints: number;
    maxPoints: number | null;
    nextRank: string | null;
    nextRankPoints: number | null;
    pointsToNextRank: number;
  };
  growth: GrowthMeData | null;
}

export interface CompatibilityGrowthHistoryPoint {
  id: number | string;
  totalPoints: number;
  calculatedAt: string;
  layer?: GrowthRewardLayer;
  amount?: number;
  direction?: GrowthHistoryDirection;
  scoreCode?: string | null;
}
