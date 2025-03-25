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
  videoUploadPoints: number;
  commentPoints: number;
  videoViewPoints: number;
  likePoints: number;
  watchTimePoints: number;
  uploaderBonusPoints: number;
  totalPoints: number;
  createdAt?: string;
  updatedAt?: string;
  rank: UserRank;
  progressToNextRank?: number;      
}

export interface UserPointsHistoryData {
  id: number;
  userId: string;
  videoUploadPoints: number;
  commentPoints: number;
  videoViewPoints: number;
  likePoints: number;
  watchTimePoints: number;
  uploaderBonusPoints: number;
  totalPoints: number;
  calculatedAt: string;
}