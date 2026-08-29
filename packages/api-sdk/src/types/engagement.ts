/** Engagement domain types (comments, likes, shares). */

export interface CommentAuthor {
  id?: number | string;
  username?: string | null;
  profile_image_url?: string | null;
}

export interface Comment {
  id: number;
  content: string;
  parent_id?: number | null;
  video_id?: number;
  createdAt: string;
  updatedAt?: string;
  user?: CommentAuthor | null;
  replies?: Comment[];
  likes_count?: number;
}

/** `GET /api/v1/comments/video/:videoId` */
export interface CommentsResponse {
  comments: Comment[];
  totalComments: number;
  totalPages: number;
  currentPage: number;
}

/** `POST /api/v1/likes/videos/:videoId/toggle` */
export interface LikeToggleResponse {
  success: boolean;
  data: {
    isLiked?: boolean;
    liked?: boolean;
    likesCount?: number;
    likes_count?: number;
  };
}

/** `GET /api/v1/likes/videos/:videoId/status` */
export interface LikeStatusResponse {
  success: boolean;
  data: { isLiked: boolean };
}

export type SharePlatform = 'twitter' | 'facebook' | 'whatsapp' | 'telegram' | 'copy' | 'other';

/** `POST /api/v1/videos/:videoId/views` — the created view row. */
export interface RecordViewResponse {
  success: boolean;
  message?: string;
  data: {
    viewId: string;
    /** Short-lived, single-view credential for a page-teardown beacon (web). */
    beaconToken?: string;
  };
}

/** `GET /api/v1/config/view-config` — the rules the backend enforces on views. */
export interface ViewTrackingConfig {
  thresholds: {
    /** Percent of the video that counts as a view. */
    percentage: number;
    /** Absolute seconds that count as a view, whichever comes first. */
    seconds: number;
  };
  /** Heartbeat cadence, in milliseconds. */
  updateInterval: number;
}

export interface ViewConfigResponse {
  success: boolean;
  data: ViewTrackingConfig;
}
