export interface LikeResponse {
  success: boolean;
  data: {
    isLiked: boolean;
    likesCount: number;
  };
}

export interface LikeStatusResponse {
  success: boolean;
  data: {
    isLiked: boolean;
  };
}

export interface BatchLikeStatusRequest {
  videoIds: number[];
}

export interface BatchLikeStatusResponse {
  success: boolean;
  data: {
    [videoId: number]: boolean;
  };
}

export interface LikedVideosResponse {
  success: boolean;
  data: {
    videos: {
      id: number;
      title: string;
      thumbnail_path: string;
      channel: {
        id: number;
        name: string;
      } | null;
      likedAt: string;
    }[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
}