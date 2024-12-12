// src/api/discovery.ts

import api from './index'; // Your configured axios instance
import type { DiscoveryResponse, GetDiscoveryOptions } from '../types/discovery';

/**
 * Fetches the discovery feed based on the given options.
 * @param options - Discovery query options such as page, limit, sort, and timeframe.
 */
export const getDiscoveryFeed = async (options: GetDiscoveryOptions = {}): Promise<DiscoveryResponse> => {
  const {
    page = 1,
    limit = 24,
    timeFrame = 'all',
    sort = 'trending',
  } = options;

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('timeFrame', timeFrame);
  params.append('sort', sort);

  try {
    const response = await api.get<DiscoveryResponse>(`/api/v1/discovery?${params.toString()}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching discovery feed:', error);
    throw error;
  }
};