import api from './index';
import {
  // PassDetailsResponse,
  CheckoutSessionResponse,
  SignedUrlResponse,
  Pass,
  PurchaseStatus
} from '../types/pass';

/**
 * API helpers for Pass-as-a-Link feature
 */
export const passApi = {
  /**
   * Fetch pass details by ID or slug
   * @param identifier Pass unique id or slug (string)
   */
  getPassDetails: async (identifier: string): Promise<Pass> => {
    const response = await api.get(`/api/v1/passes/${identifier}`);
    const data = 'data' in response.data ? response.data.data : response.data;
    return data as Pass;
  },

  /**
   * Create a Stripe checkout session and return redirect URL
   * @param passId Pass unique id
   */
  createCheckoutSession: async (
    passId: string
  ): Promise<CheckoutSessionResponse> => {
    const response = await api.post<CheckoutSessionResponse>(
      `/api/v1/passes/${passId}/checkout`
    );
    return response.data;
  },

  /**
   * Retrieve a signed video URL for authorized users
   * @param videoId Video uuid
   */
  getSignedVideoUrl: async (videoId: string): Promise<string> => {
    const response = await api.get<SignedUrlResponse>(
      `/api/v1/passes/videos/${videoId}/signed-url`
    );
    return response.data.signed_url;
  },
  
  /**
   * Get all passes purchased by the current user
   * Requires authentication
   */
  getPurchasedPasses: async (): Promise<Pass[]> => {
    const response = await api.get<Pass[]>('/api/v1/passes/me');
    return response.data;
  },
  
  /**
   * Check the status of a Stripe checkout session
   * @param sessionId Stripe checkout session ID
   */
  getCheckoutStatus: async (sessionId: string): Promise<PurchaseStatus> => {
    const response = await api.get<PurchaseStatus>(
      `/api/v1/passes/purchase/status/${sessionId}`
    );
    return response.data;
  }
}; 