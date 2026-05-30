import type { AxiosInstance } from 'axios';
import { createHttpClient } from './client';
import type { BasetubeClientConfig } from './config';
import { createVideosApi } from './endpoints/videos';
import { createDiscoveryApi, createSearchApi } from './endpoints/discovery';
import { createChannelsApi } from './endpoints/channels';
import { createProfileApi } from './endpoints/profile';
import { createAuthApi, createWeb3AuthApi } from './endpoints/web3auth';

export * from './types';
export type { BasetubeClientConfig, TokenProvider } from './config';
export { createHttpClient } from './client';

export interface BasetubeClient {
  videos: ReturnType<typeof createVideosApi>;
  discovery: ReturnType<typeof createDiscoveryApi>;
  search: ReturnType<typeof createSearchApi>;
  channels: ReturnType<typeof createChannelsApi>;
  profile: ReturnType<typeof createProfileApi>;
  web3auth: ReturnType<typeof createWeb3AuthApi>;
  auth: ReturnType<typeof createAuthApi>;
  /** Escape hatch to the underlying axios instance for not-yet-wrapped routes. */
  http: AxiosInstance;
}

/**
 * Creates a fully-typed BaseTube API client.
 *
 * @example
 * const client = createBasetubeClient({
 *   baseUrl: 'https://backend.base.tube',
 *   getToken: () => clerk.session?.getToken() ?? null,
 * });
 * const { data } = await client.videos.getTrending({ limit: 10 });
 */
export function createBasetubeClient(config: BasetubeClientConfig): BasetubeClient {
  const http = createHttpClient(config);
  return {
    videos: createVideosApi(http),
    discovery: createDiscoveryApi(http),
    search: createSearchApi(http),
    channels: createChannelsApi(http),
    profile: createProfileApi(http),
    web3auth: createWeb3AuthApi(http),
    auth: createAuthApi(http),
    http,
  };
}
