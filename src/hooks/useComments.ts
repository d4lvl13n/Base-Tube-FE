import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as commentsApi from '../api/comment';
import type { Comment, CommentsResponse, ApiResponse } from '../types/comment';

// Add this helper function at the top of the file, before useComments
const findCommentById = (comments: Comment[], id: number): Comment | null => {
  for (const comment of comments) {
    if (comment.id === id) return comment;
    if (comment.replies) {
      const found = findCommentById(comment.replies, id);
      if (found) return found;
    }
  }
  return null;
};

interface UseCommentsProps {
  videoId: string;
  initialLimit?: number;
  sortBy?: 'latest' | 'top';
}

export const useComments = ({ videoId, initialLimit = 30, sortBy = 'latest' }: UseCommentsProps) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  // Use React Query for caching and state management
  const queryKey = useMemo(() => ['comments', videoId, sortBy], [videoId, sortBy]);

  const {
    data,
    isLoading,
    error
  } = useQuery<CommentsResponse>({
    queryKey,
    queryFn: async () => {
      const response = await commentsApi.getVideoComments(videoId, 1, initialLimit, sortBy);
      return {
        ...response,
        comments: structureComments(response.comments)
      };
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchOnWindowFocus: false,
    enabled: !!videoId // Only fetch when videoId is available
  });

  // Permission checks
  const canModifyComment = useCallback((comment: Comment) => 
    user?.id === comment.commenter?.id, [user]);

  const canPinComment = useCallback((comment: Comment) => 
    user?.id === comment.video_id.toString(), [user]);

  // Mutations
  const addCommentMutation = useMutation<ApiResponse<Comment>, Error, { content: string; parentId?: number }>({
    mutationFn: async ({ content, parentId }) => {
      if (!user) throw new Error('Must be logged in to comment');

      const parentComment = parentId ? 
        findCommentById(data?.comments || [], parentId) : null;

      const effectiveParentId = parentId;
      const replyingTo = parentComment?.commenter?.username;

      const response = await commentsApi.addComment(
        Number(videoId), 
        content, 
        effectiveParentId
      );

      return {
        success: true,
        data: {
          ...response.data,
          replyingTo,
          replies: []
        }
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => 
      commentsApi.editComment(commentId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  const pinCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.pinComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  const unpinCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.unpinComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  // Action handlers
  const addComment = (content: string, parentId?: number): Promise<ApiResponse<Comment>> => 
    addCommentMutation.mutateAsync({ content, parentId });

  const editComment = async (commentId: number, content: string) => {
    const comment = data?.comments.find(c => c.id === commentId);
    if (!comment || !canModifyComment(comment)) {
      throw new Error('Permission denied');
    }
    return editCommentMutation.mutateAsync({ commentId, content });
  };

  const deleteComment = async (commentId: number) => {
    const comment = data?.comments.find(c => c.id === commentId);
    if (!comment || !canModifyComment(comment)) {
      throw new Error('Permission denied');
    }
    return deleteCommentMutation.mutateAsync(commentId);
  };

  const pinComment = async (commentId: number) => {
    const comment = data?.comments.find(c => c.id === commentId);
    if (!comment || !canPinComment(comment)) {
      throw new Error('Permission denied');
    }
    return pinCommentMutation.mutateAsync(commentId);
  };

  const unpinComment = async (commentId: number) => {
    const comment = data?.comments.find(c => c.id === commentId);
    if (!comment || !canPinComment(comment)) {
      throw new Error('Permission denied');
    }
    return unpinCommentMutation.mutateAsync(commentId);
  };

  // Load more handler
  const loadMore = useCallback(async () => {
    if (data?.currentPage && data.currentPage < (data?.totalPages || 0)) {
      const nextPage = data.currentPage + 1;
      const newComments = await commentsApi.getVideoComments(
        videoId, 
        nextPage, 
        initialLimit, 
        sortBy
      );
      queryClient.setQueryData<CommentsResponse>(queryKey, old => ({
        ...old!,
        comments: [...(old?.comments || []), ...newComments.comments],
        currentPage: nextPage
      }));
    }
  }, [
    data?.currentPage, 
    data?.totalPages, 
    videoId, 
    initialLimit, 
    sortBy,
    queryClient,
    queryKey
  ]);

  return {
    comments: data?.comments || [],
    loading: isLoading,
    error,
    hasMore: data ? data.currentPage < data.totalPages : false,
    totalComments: data?.totalComments || 0,
    loadMore,
    addComment,
    editComment,
    deleteComment,
    pinComment,
    unpinComment,
    canModifyComment,
    canPinComment,
    isDeletingComment: deleteCommentMutation.isPending,
    isEditingComment: editCommentMutation.isPending,
    isAddingComment: addCommentMutation.isPending,
    isUnpinningComment: unpinCommentMutation.isPending,
    sortBy
  };
};

// Helper function to structure comments with proper nesting
const structureComments = (comments: Comment[]): Comment[] => {
  const commentMap = new Map<number, Comment>();
  const rootComments: Comment[] = [];

  // First pass: create a map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: build the tree structure
  comments.forEach(comment => {
    const structuredComment = commentMap.get(comment.id)!;
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(structuredComment);
      }
    } else {
      rootComments.push(structuredComment);
    }
  });

  return rootComments;
};