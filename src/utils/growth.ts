import type {
  GrowthBalances,
  GrowthHistoryData,
  GrowthHistoryEntry,
  GrowthLeaderboardData,
  GrowthLeaderboardEntry,
  GrowthMeData,
  GrowthMission,
  GrowthMissionsData,
  GrowthProgressStatus,
  GrowthQuest,
  GrowthQuestsData,
  GrowthRedemptionsData,
  GrowthReferralApplication,
  GrowthRewardItem,
  GrowthRewardRedemption,
  GrowthRewardsData,
  GrowthVisibility,
} from '../types/growth';

const DEFAULT_VISIBILITY: GrowthVisibility = {
  activePhaseKeys: [],
  xpVisible: true,
  reputationVisible: false,
  creditsVisible: false,
  missionsEnabled: false,
  questsEnabled: false,
  leaderboardMode: 'xp',
  allocationMode: null,
};

export function normalizeGrowthVisibility(raw: any): GrowthVisibility {
  return {
    activePhaseKeys: Array.isArray(raw?.activePhaseKeys) ? raw.activePhaseKeys : [],
    xpVisible: raw?.xpVisible !== false,
    reputationVisible: Boolean(raw?.reputationVisible),
    creditsVisible: Boolean(raw?.creditsVisible),
    missionsEnabled: Boolean(raw?.missionsEnabled),
    questsEnabled: Boolean(raw?.questsEnabled),
    leaderboardMode: raw?.leaderboardMode || 'xp',
    allocationMode: raw?.allocationMode ?? null,
  };
}

export function normalizeGrowthBalances(raw: any): GrowthBalances {
  return {
    xp: raw?.xp == null ? null : Number(raw.xp),
    reputation: raw?.reputation == null ? null : Number(raw.reputation),
    credits: raw?.credits == null ? null : Number(raw.credits),
  };
}

export function normalizeGrowthMe(raw: any): GrowthMeData {
  const payload = raw?.data ?? raw;
  return {
    visibility: normalizeGrowthVisibility(payload?.visibility ?? DEFAULT_VISIBILITY),
    balances: normalizeGrowthBalances(payload?.balances),
    hiddenState: payload?.hiddenState ?? {},
    signals: Array.isArray(payload?.signals) ? payload.signals : [],
  };
}

export function normalizeGrowthMission(raw: any): GrowthMission {
  return {
    id: Number(raw?.id ?? 0),
    missionKey: raw?.missionKey ?? '',
    title: raw?.title ?? 'Untitled mission',
    description: raw?.description ?? '',
    visibility: raw?.visibility ?? 'public',
    reward: {
      layer: raw?.reward?.layer ?? 'xp',
      amount: Number(raw?.reward?.amount ?? 0),
    },
    progress: {
      status: raw?.progress?.status ?? 'not_started',
      current: Number(raw?.progress?.current ?? 0),
      completedAt: raw?.progress?.completedAt ?? null,
      rewardClaimedAt: raw?.progress?.rewardClaimedAt ?? null,
    },
    steps: Array.isArray(raw?.steps)
      ? raw.steps.map((step: any) => ({
          stepKey: step?.stepKey ?? '',
          eventType: step?.eventType ?? '',
          targetCount: Number(step?.targetCount ?? 0),
          ordering: Number(step?.ordering ?? 0),
          currentCount: Number(step?.currentCount ?? 0),
          completed: Boolean(step?.completed),
        }))
      : [],
  };
}

export function normalizeGrowthQuest(raw: any): GrowthQuest {
  return {
    id: Number(raw?.id ?? 0),
    questKey: raw?.questKey ?? '',
    templateKey: raw?.templateKey ?? '',
    reward: {
      layer: raw?.reward?.layer ?? 'xp',
      amount: Number(raw?.reward?.amount ?? 0),
    },
    progress: {
      status: raw?.progress?.status ?? 'not_started',
      current: Number(raw?.progress?.current ?? 0),
      completedAt: raw?.progress?.completedAt ?? null,
      rewardClaimedAt: raw?.progress?.rewardClaimedAt ?? null,
    },
    criteria: Array.isArray(raw?.criteria)
      ? raw.criteria.map((criterion: any) => ({
          key: criterion?.key ?? '',
          eventType: criterion?.eventType ?? '',
          targetCount: Number(criterion?.targetCount ?? 0),
          currentCount: Number(criterion?.currentCount ?? 0),
          completed: Boolean(criterion?.completed),
        }))
      : [],
  };
}

export function normalizeGrowthHistoryEntry(raw: any): GrowthHistoryEntry {
  return {
    id: raw?.id ?? '',
    accountId: raw?.account_id ?? raw?.accountId ?? null,
    userId: raw?.user_id ?? raw?.userId ?? '',
    layer: raw?.layer ?? 'xp',
    direction: raw?.direction ?? 'earn',
    amount: Number(raw?.amount ?? 0),
    scoreCode: raw?.score_code ?? raw?.scoreCode ?? null,
    sourceType: raw?.source_type ?? raw?.sourceType ?? null,
    sourceId: raw?.source_id ?? raw?.sourceId ?? null,
    eventType: raw?.event_type ?? raw?.eventType ?? null,
    ruleId: raw?.rule_id ?? raw?.ruleId ?? null,
    campaignId: raw?.campaign_id ?? raw?.campaignId ?? null,
    seasonId: raw?.season_id ?? raw?.seasonId ?? null,
    metadata: raw?.metadata ?? {},
    createdAt: raw?.created_at ?? raw?.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeGrowthLeaderboardEntry(raw: any): GrowthLeaderboardEntry {
  return {
    rank: Number(raw?.rank ?? 0),
    userId: raw?.userId ?? raw?.user_id ?? '',
    username: raw?.username ?? 'anonymous',
    displayName: raw?.displayName ?? raw?.display_name ?? null,
    profileImageUrl: raw?.profileImageUrl ?? raw?.profile_image_url ?? null,
    score: Number(raw?.score ?? 0),
  };
}

export function normalizeGrowthLeaderboard(raw: any): GrowthLeaderboardData {
  const payload = raw?.data ?? raw;
  return {
    visibility: normalizeGrowthVisibility(payload?.visibility ?? DEFAULT_VISIBILITY),
    mode: payload?.mode ?? 'xp',
    visible: payload?.visible !== false,
    entries: Array.isArray(payload?.entries)
      ? payload.entries.map(normalizeGrowthLeaderboardEntry)
      : [],
  };
}

export function normalizeGrowthMissions(raw: any): GrowthMissionsData {
  const payload = raw?.data ?? raw;
  return {
    enabled: Boolean(payload?.enabled),
    visibility: normalizeGrowthVisibility(payload?.visibility ?? DEFAULT_VISIBILITY),
    items: Array.isArray(payload?.items) ? payload.items.map(normalizeGrowthMission) : [],
  };
}

export function normalizeGrowthQuests(raw: any): GrowthQuestsData {
  const payload = raw?.data ?? raw;
  return {
    enabled: Boolean(payload?.enabled),
    visibility: normalizeGrowthVisibility(payload?.visibility ?? DEFAULT_VISIBILITY),
    items: Array.isArray(payload?.items) ? payload.items.map(normalizeGrowthQuest) : [],
  };
}

export function normalizeGrowthHistory(raw: any): GrowthHistoryData {
  const payload = raw?.data ?? raw;
  return {
    visibility: normalizeGrowthVisibility(payload?.visibility ?? DEFAULT_VISIBILITY),
    entries: Array.isArray(payload?.entries) ? payload.entries.map(normalizeGrowthHistoryEntry) : [],
    pagination: {
      limit: Number(payload?.pagination?.limit ?? 20),
      offset: Number(payload?.pagination?.offset ?? 0),
      hasMore: Boolean(payload?.pagination?.hasMore),
    },
  };
}

export function normalizeGrowthRewards(raw: any): GrowthRewardsData {
  const payload = raw?.data ?? raw;
  return {
    visibility: normalizeGrowthVisibility(payload?.visibility ?? DEFAULT_VISIBILITY),
    items: Array.isArray(payload?.items) ? payload.items.map(normalizeGrowthRewardItem) : [],
  };
}

export function normalizeGrowthRewardItem(raw: any): GrowthRewardItem {
  return {
    id: Number(raw?.id ?? 0),
    rewardKey: raw?.rewardKey ?? raw?.reward_key ?? null,
    title: raw?.title ?? `Reward ${raw?.id ?? ''}`,
    description: raw?.description ?? null,
    rewardType: raw?.rewardType ?? raw?.reward_type ?? null,
    costLayer: raw?.costLayer ?? raw?.cost_layer ?? raw?.layer ?? null,
    costAmount: raw?.costAmount == null ? raw?.cost == null ? null : Number(raw.cost) : Number(raw.costAmount),
    inventoryCap: raw?.inventoryCap == null ? raw?.inventory_cap == null ? null : Number(raw.inventory_cap) : Number(raw.inventoryCap),
    inventoryUsed: raw?.inventoryUsed == null ? raw?.inventory_used == null ? null : Number(raw.inventory_used) : Number(raw.inventoryUsed),
    status: raw?.status ?? null,
    phaseScope: raw?.phaseScope ?? raw?.phase_scope ?? null,
    version: raw?.version == null ? null : Number(raw.version),
    maxPerUser: raw?.maxPerUser == null ? raw?.max_per_user == null ? null : Number(raw.max_per_user) : Number(raw.maxPerUser),
    metadata: raw?.metadata ?? null,
  };
}

export function normalizeGrowthRewardRedemption(raw: any): GrowthRewardRedemption {
  return {
    id: Number(raw?.id ?? 0),
    rewardId: Number(raw?.rewardId ?? raw?.reward_id ?? 0),
    userId: raw?.userId ?? raw?.user_id ?? '',
    status: raw?.status ?? 'requested',
    costLayer: raw?.costLayer ?? raw?.cost_layer ?? 'xp',
    costAmount: Number(raw?.costAmount ?? raw?.cost_amount ?? 0),
    burnLedgerEntryId: raw?.burnLedgerEntryId ?? raw?.burn_ledger_entry_id ?? null,
    refundLedgerEntryId: raw?.refundLedgerEntryId ?? raw?.refund_ledger_entry_id ?? null,
    statusReason: raw?.statusReason ?? raw?.status_reason ?? null,
    fulfillmentPayload: raw?.fulfillmentPayload ?? raw?.fulfillment_payload ?? null,
    metadata: raw?.metadata ?? null,
    fulfilledAt: raw?.fulfilledAt ?? raw?.fulfilled_at ?? null,
    rejectedAt: raw?.rejectedAt ?? raw?.rejected_at ?? null,
    cancelledAt: raw?.cancelledAt ?? raw?.cancelled_at ?? null,
    createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? new Date().toISOString(),
    reward: raw?.reward ? normalizeGrowthRewardItem(raw.reward) : undefined,
  };
}

export function normalizeGrowthRedemptions(raw: any): GrowthRedemptionsData {
  const payload = raw?.data ?? raw;
  return {
    visibility: normalizeGrowthVisibility(payload?.visibility ?? DEFAULT_VISIBILITY),
    items: Array.isArray(payload?.items) ? payload.items.map(normalizeGrowthRewardRedemption) : [],
    pagination: {
      limit: Number(payload?.pagination?.limit ?? 20),
      offset: Number(payload?.pagination?.offset ?? 0),
      hasMore: Boolean(payload?.pagination?.hasMore),
    },
  };
}

export function normalizeGrowthReferralApplication(raw: any): GrowthReferralApplication {
  const payload = raw?.data ?? raw;
  return {
    id: Number(payload?.id ?? 0),
    referrerUserId: payload?.referrerUserId ?? payload?.referrer_user_id ?? '',
    referredUserId: payload?.referredUserId ?? payload?.referred_user_id ?? '',
    referralCode: payload?.referralCode ?? payload?.referral_code ?? null,
    status: payload?.status ?? 'registered',
    registeredAt: payload?.registeredAt ?? payload?.registered_at ?? new Date().toISOString(),
    activatedAt: payload?.activatedAt ?? payload?.activated_at ?? null,
    qualifiedAt: payload?.qualifiedAt ?? payload?.qualified_at ?? null,
    metadata: payload?.metadata ?? null,
    createdAt: payload?.createdAt ?? payload?.created_at ?? new Date().toISOString(),
    updatedAt: payload?.updatedAt ?? payload?.updated_at ?? new Date().toISOString(),
  };
}

export function getGrowthModeLabel(mode?: string | null): string {
  switch (mode) {
    case 'reputation':
      return 'Reputation';
    case 'credits':
      return 'Credits';
    default:
      return 'XP';
  }
}

export function getLayerLabel(layer?: string | null): string {
  switch (layer) {
    case 'reputation':
      return 'Reputation';
    case 'credits':
      return 'Credits';
    default:
      return 'XP';
  }
}

export function getRedemptionStatusLabel(status?: string | null): string {
  switch (status) {
    case 'fulfilled':
      return 'Fulfilled';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Awaiting fulfillment';
  }
}

// Backend now flips status straight from in_progress → claimed in a single
// transaction. Pre-existing rows may still report 'completed'; treat them
// identically to 'claimed' for display purposes.
export function normalizeProgressStatus(
  status?: string | null,
): GrowthProgressStatus {
  if (status === 'completed') return 'claimed';
  if (
    status === 'not_started' ||
    status === 'in_progress' ||
    status === 'claimed' ||
    status === 'expired'
  ) {
    return status;
  }
  return 'not_started';
}

export function getProgressStatusLabel(status?: string | null): string {
  switch (normalizeProgressStatus(status)) {
    case 'in_progress':
      return 'In progress';
    case 'claimed':
      return 'Claimed';
    case 'expired':
      return 'Expired';
    default:
      return 'Not started';
  }
}
