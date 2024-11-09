import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as commentsApi from '../api/comment';
import { Comment, CommentsResponse } from '../types/comment';

interface UseCommentsProps {
  videoId: string;
  initialLimit?: number;
  sortBy?: 'latest' | 'top';
}

export const useComments = ({ videoId, initialLimit = 10, sortBy }: UseCommentsProps) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['comments', videoId, sortBy], [videoId, sortBy]);

  console.log('useComments called with queryKey:', queryKey);

  const {
    data,
    isLoading,
    error
  } = useQuery<CommentsResponse>({
    queryKey,
    queryFn: async () => {
      console.log('Fetching comments for videoId:', videoId);
      const response = await commentsApi.getVideoComments(videoId, 1, initialLimit, sortBy);
      return response;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const canModifyComment = useCallback((comment: Comment) => {
    if (!user) return false;
    return comment.commenter?.id === user.id;
  }, [user]);

  const canPinComment = useCallback((comment: Comment) => {
    if (!user) return false;
    return user.id === comment.video_id.toString();
  }, [user]);

  const addCommentMutation = useMutation({
    mutationFn: (variables: { content: string; parentId?: number }) => 
      commentsApi.addComment(Number(videoId), variables.content, variables.parentId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<CommentsResponse>(queryKey);

      if (user) {
        queryClient.setQueryData<CommentsResponse>(queryKey, (old) => {
          const newComment = {
            id: Number('temp-' + Date.now()),
            video_id: Number(videoId),
            user_id: user.id,
            content: variables.content,
            parent_id: variables.parentId || null,
            status: 'approved' as const,
            isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            commenter: {
              id: user.id,
              username: user.username || '',
              profile_image_url: user.imageUrl || null
            },
            replies: []
          };

          return {
            ...old!,
            comments: [newComment, ...(old?.comments || [])],
            total: (old?.total || 0) + 1,
            currentPage: old?.currentPage || 1,
            totalPages: old?.totalPages || 1
          };
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      commentsApi.editComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.deleteComment(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<CommentsResponse>(queryKey);

      queryClient.setQueryData<CommentsResponse>(queryKey, (old) => ({
        ...old!,
        comments: old?.comments.filter(c => c.id !== commentId) || [],
        total: (old?.total || 0) - 1
      }));

      return { previousData };
    },
    onError: (err, commentId, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const pinCommentMutation = useMutation({
    mutationFn: (commentId: number) => 
      commentsApi.pinComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const unpinCommentMutation = useMutation({
    mutationFn: (commentId: number) => 
      commentsApi.unpinComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const addComment = async (content: string, parentId?: number) => {
    if (!user) throw new Error('You must be logged in to comment');
    return addCommentMutation.mutateAsync({ content, parentId });
  };

  const editComment = async (commentId: number, content: string) => {
    const comment = data?.comments.find((c: Comment) => c.id === commentId);
    if (!comment || !canModifyComment(comment)) {
      throw new Error('You do not have permission to edit this comment');
    }
    const result = await editCommentMutation.mutateAsync({ commentId, content });
    return result;
  };

  const deleteComment = async (commentId: number) => {
    const comment = data?.comments.find(c => c.id === commentId);
    if (!comment || !canModifyComment(comment)) {
      throw new Error('You do not have permission to delete this comment');
    }
    return deleteCommentMutation.mutateAsync(commentId);
  };

  const pinComment = async (commentId: number) => {
    const comment = data?.comments.find(c => c.id === commentId);
    if (!comment || !canPinComment(comment)) {
      throw new Error('You do not have permission to pin this comment');
    }
    const result = await pinCommentMutation.mutateAsync(commentId);
    return result;
  };

  const unpinComment = async (commentId: number) => {
    const result = await unpinCommentMutation.mutateAsync(commentId);
    return result;
  };

  const loadMore = useCallback(async () => {
    if (data?.currentPage && data?.currentPage < (data?.totalPages || 0)) {
      const nextPage = data.currentPage + 1;
      try {
        console.log('Loading more comments for page:', nextPage);
        const newComments = await commentsApi.getVideoComments(videoId, nextPage, initialLimit, sortBy);
        queryClient.setQueryData<CommentsResponse>(queryKey, (oldData) => ({
          ...oldData!,
          comments: [...(oldData?.comments || []), ...(newComments.comments || [])],
          currentPage: nextPage,
          total: newComments.total,
          totalPages: newComments.totalPages
        }));
      } catch (error) {
        console.error('Error loading more comments:', error);
      }
    }
  }, [data?.currentPage, data?.totalPages, videoId, initialLimit, sortBy, queryClient, queryKey]);

  return {
    comments: data?.comments || [],
    loading: isLoading,
    error,
    hasMore: data ? data.currentPage < data.totalPages : false,
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
    isAddingComment: addCommentMutation.isPending
  };
};