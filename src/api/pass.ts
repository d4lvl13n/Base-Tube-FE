import api from './index';
import {
  // PassDetailsResponse,
  CheckoutSessionResponse,
  SignedUrlResponse,
  Pass,
  PurchaseStatus,
  DiscoverPassesParams,
  DiscoverPassesResponse,
  CreatePassRequest,
  AddVideoRequest
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
  },

  /**
   * Create a new pass for monetization
   * @param data Pass creation data including title, price, and source URL(s)
   * @returns The newly created pass
   */
  createPass: async (data: CreatePassRequest): Promise<Pass> => {
    const response = await api.post<Pass>('/api/v1/passes', data);
    return response.data;
  },
  
  /**
   * Get all passes created by the current user
   * Requires authentication
   */
  getCreatorPasses: async (): Promise<Pass[]> => {
    const response = await api.get<Pass[]>('/api/v1/passes/creator/all');
    return response.data;
  },
  
  /**
   * Add a new video to an existing pass
   * @param passId Pass ID to add the video to
   * @param data Video source URL data
   * @returns The updated pass with the new video
   */
  addVideoToPass: async (passId: string, data: AddVideoRequest): Promise<Pass> => {
    const response = await api.post<Pass>(`/api/v1/passes/${passId}/videos`, data);
    return response.data;
  },

  /**
   * Discover available passes with filtering options
   * @param params Discovery parameters and filters
   */
  discoverPasses: async (params: DiscoverPassesParams = {}): Promise<DiscoverPassesResponse> => {
    // Convert params object to URL query parameters
    const queryParams = new URLSearchParams();
    
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.tier) queryParams.append('tier', params.tier);
    if (params.price_min !== undefined) queryParams.append('price_min', params.price_min.toString());
    if (params.price_max !== undefined) queryParams.append('price_max', params.price_max.toString());
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.channel_id) queryParams.append('channel_id', params.channel_id);
    if (params.sold_out !== undefined) queryParams.append('sold_out', params.sold_out.toString());
    
    const url = `/api/v1/passes/discover${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<DiscoverPassesResponse>(url);
    return response.data;
  }
}; 