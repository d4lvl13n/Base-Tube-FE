import type {
  CompatibilityGrowthHistoryPoint,
  CompatibilityGrowthUserPoints,
} from './growth';

export interface UserRank {
  rank: string;
  minPoints: number;
  maxPoints: number | null;  // null indicates no upper limit.
  nextRank: string | null;
  nextRankPoints: number | null;
  pointsToNextRank: number;
}

export interface UserPointsData {
  userId: string;
  totalPoints: number;
  createdAt?: string;
  updatedAt?: string;
  rank?: UserRank;
  progressToNextRank?: number;
  growth?: CompatibilityGrowthUserPoints['growth'];
}

export interface UserPointsHistoryData {
  id: number | string;
  totalPoints: number;
  calculatedAt: string;
  layer?: CompatibilityGrowthHistoryPoint['layer'];
  amount?: number;
  direction?: CompatibilityGrowthHistoryPoint['direction'];
  scoreCode?: string | null;
}
