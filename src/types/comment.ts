export interface Comment {
  id: number;
  video_id: number;
  user_id: string;
  content: string;
  parent_id: number | null;
  status: 'pending' | 'approved' | 'flagged' | 'removed';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  replies: Comment[];
  commenter: {
    id: string;
    username: string;
    profile_image_url: string | null;
  };
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface AddCommentRequest {
  video_id: number;
  content: string;
  parent_id?: number | null;
}

export type AddCommentResponse = ApiResponse<Comment>;

export interface EditCommentRequest {
  content: string;
}

export type EditCommentResponse = ApiResponse<Comment>;

export type DeleteCommentResponse = ApiResponse<void>;

export type PinCommentResponse = ApiResponse<Comment>;

export type UnpinCommentResponse = ApiResponse<void>;

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

// API Response types for type safety
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
}

// Mutation types for React Query
export interface CommentMutationVariables {
  commentId?: number;
  content?: string;
}

export interface CommentQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'top';
}

// Comment state types
export interface CommentState {
  isLiked?: boolean;
  likesCount?: number;
  isReplying?: boolean;
  isEditing?: boolean;
}