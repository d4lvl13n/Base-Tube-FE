import axios, { AxiosRequestConfig } from 'axios';

const RATE_LIMIT_DEFAULT_BACKOFF_MS = 5000;
const REDEEM_PATH_PATTERN = /\/growth\/rewards\/[^/]+\/redeem$/;

type RetryableConfig = AxiosRequestConfig & {
  __rateLimitRetried?: boolean;
  /** Stamped before `transformRequest` runs; see `isUnreplayableBody`. */
  __unreplayableBody?: boolean;
};

const parseRetryAfterMs = (headerValue: unknown): number => {
  if (typeof headerValue !== 'string' && typeof headerValue !== 'number') {
    return RATE_LIMIT_DEFAULT_BACKOFF_MS;
  }
  const seconds = Number(headerValue);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return RATE_LIMIT_DEFAULT_BACKOFF_MS;
  }
  return Math.min(seconds * 1000, 60_000);
};

/**
 * True for a request body the browser cannot faithfully re-send.
 *
 * `FormData`, `Blob` and `File` (which extends `Blob`) are one-shot streams:
 * axios has already handed them to the network stack, so replaying the same
 * config either re-uploads the whole payload or sends an empty body. The
 * `typeof` guards keep this safe under SSR/jsdom where the globals may be
 * missing.
 *
 * Evaluated in the REQUEST interceptor: `transformRequest` runs afterwards and
 * can replace the body with a serialised form, so the response interceptor no
 * longer sees the original type.
 */
const isUnreplayableBody = (data: unknown): boolean => {
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  if (typeof Blob !== 'undefined' && data instanceof Blob) return true;
  return false;
};

const isRedeemRequest = (config: AxiosRequestConfig): boolean => {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  return method === 'post' && REDEEM_PATH_PATTERN.test(url);
};

/**
 * A manual insights REGENERATION (`?refresh=1`).
 *
 * The generic 429 retry exists for shared rate limiters, where waiting and replaying is
 * the right move. It is exactly the wrong move here: a 429 on this request means the
 * creator's DAILY regeneration budget is gone, so the replay cannot succeed, and if it
 * somehow did it would spend a second one. The message from the backend names the
 * budget, and the card shows it — silently retrying hides both.
 *
 * The cached read (no `refresh`) is deliberately NOT excluded: a 429 there is the
 * ordinary hourly limiter and a retry is appropriate.
 */
const isInsightsRegeneration = (config: AxiosRequestConfig): boolean => {
  const url = config.url || '';
  if (!/\/analytics\/insights\b/.test(url)) return false;
  const params = config.params as Record<string, unknown> | undefined;
  const refresh = params?.refresh;
  return refresh === '1' || refresh === 1 || refresh === true;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 600000, // 10 minutes timeout for long operations like image generation
});

api.interceptors.request.use(
  async (config) => {
    (config as RetryableConfig).__unreplayableBody = isUnreplayableBody(config.data);
    try {
      const authMethod = localStorage.getItem('auth_method');
      if (process.env.NODE_ENV !== 'production') {
        console.log('Request:', {
          url: config.url,
          method: config.method,
          authMethod,
          cookies: document.cookie
        });
      }

      if (authMethod !== 'web3') {
        // Clerk-based auth:
        const clerkToken = await window.Clerk?.session?.getToken();
        if (clerkToken) {
          config.headers.Authorization = `Bearer ${clerkToken}`;
        }
      }
      // For web3 auth, the cookie will be sent automatically
      // because withCredentials: true is set
    } catch (error) {
      console.warn('Failed to process auth in interceptor', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== 'production') {
      if (response.data?.data?.thumbnail_url || response.data?.data?.video_url) {
        console.log('Media URLs in response:', {
          thumbnail: response.data.data.thumbnail_url,
          video: response.data.data.video_url,
          isStorj: {
            thumbnail: response.data.data.thumbnail_url?.includes('storjshare.io'),
            video: response.data.data.video_url?.includes('storjshare.io')
          }
        });
      }
    }
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        const authMethod = localStorage.getItem('auth_method');

        if (authMethod === 'web3') {
          // For web3 users, dispatch an event to trigger re-auth
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        // For Clerk users, let Clerk handle it
      }

      // Handle 429 Rate Limit errors: retry once after Retry-After (or 5s),
      // except for reward-redeem POSTs which are user-driven mutations.
      if (error.response?.status === 429) {
        const config = error.config as RetryableConfig | undefined;
        const canRetry =
          !!config &&
          !config.__rateLimitRetried &&
          !isRedeemRequest(config) &&
          // A spent daily budget cannot be waited out, and replaying it would spend a
          // second one if it could.
          !isInsightsRegeneration(config) &&
          // Never auto-replay a binary body: the stream has already been
          // consumed, so a retried upload would re-send gigabytes (or fail).
          !config.__unreplayableBody &&
          !isUnreplayableBody(config.data);

        if (canRetry) {
          config.__rateLimitRetried = true;
          const delayMs = parseRetryAfterMs(error.response.headers?.['retry-after']);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return api.request(config);
        }

        // Terminal 429 — surface to caller and notify any listeners.
        const errorCode = error.response?.data?.error?.code;
        const message = error.response?.data?.error?.message ||
                       error.response?.data?.message ||
                       'Too many requests. Please wait a moment and try again.';
        window.dispatchEvent(new CustomEvent('auth:rate-limited', {
          detail: { errorCode, message }
        }));
      }

      // Log error details (keep your existing logging)
      const errorDetails = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.error?.message || error.response?.data?.message,
        errorCode: error.response?.data?.error?.code,
        url: error.config?.url,
        method: error.config?.method,
        authMethod: localStorage.getItem('auth_method'),
      };
      if (process.env.NODE_ENV !== 'production') {
        console.error('API Error:', errorDetails);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
