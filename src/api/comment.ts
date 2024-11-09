import api from './index';
import {
  Comment,
  CommentsResponse,
  AddCommentRequest,
  EditCommentRequest,
  PinCommentResponse,
  UnpinCommentResponse,
  DeleteCommentResponse,
  ApiResponse
} from '../types/comment';

export const getVideoComments = async (
  videoId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'latest' | 'top' = 'latest'
): Promise<CommentsResponse> => {
  try {
    const response = await api.get(
      `/api/v1/comments/video/${videoId}?page=${page}&limit=${limit}&sortBy=${sortBy}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const addComment = async (
  video_id: number,
  content: string,
  parent_id?: number
): Promise<ApiResponse<Comment>> => {
  try {
    const payload: AddCommentRequest = {
      video_id,
      content,
      parent_id: parent_id || null
    };
    const response = await api.post('/api/v1/comments', payload);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const editComment = async (
  commentId: number,
  content: string
): Promise<ApiResponse<Comment>> => {
  try {
    const payload: EditCommentRequest = { content };
    const response = await api.put(`/api/v1/comments/${commentId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error editing comment:', error);
    throw error;
  }
};

export const deleteComment = async (
  commentId: number
): Promise<DeleteCommentResponse> => {
  try {
    const response = await api.delete(`/api/v1/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const pinComment = async (
  commentId: number
): Promise<PinCommentResponse> => {
  try {
    const response = await api.post(`/api/v1/comments/${commentId}/pin`);
    return response.data;
  } catch (error) {
    console.error('Error pinning comment:', error);
    throw error;
  }
};

export const unpinComment = async (
  commentId: number
): Promise<UnpinCommentResponse> => {
  try {
    const response = await api.post(`/api/v1/comments/${commentId}/unpin`);
    return response.data;
  } catch (error) {
    console.error('Error unpinning comment:', error);
    throw error;
  }
};