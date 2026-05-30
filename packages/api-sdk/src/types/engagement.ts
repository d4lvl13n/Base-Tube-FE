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
