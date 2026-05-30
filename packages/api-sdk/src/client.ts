import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import type { BasetubeClientConfig } from './config';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RATE_LIMIT_RETRIES = 1;
const RATE_LIMIT_FALLBACK_MS = 5_000;
const RATE_LIMIT_MAX_BACKOFF_MS = 60_000;

type RetryableConfig = InternalAxiosRequestConfig & { __rlRetried?: boolean };

const parseRetryAfterMs = (headerValue: unknown): number => {
  if (typeof headerValue !== 'string' && typeof headerValue !== 'number') {
    return RATE_LIMIT_FALLBACK_MS;
  }
  const seconds = Number(headerValue);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return RATE_LIMIT_FALLBACK_MS;
  }
  return Math.min(seconds * 1000, RATE_LIMIT_MAX_BACKOFF_MS);
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Builds the shared axios instance used by every endpoint module.
 *
 * Platform-agnostic: token retrieval and credential handling are injected via
 * config, so the same transport works in the browser, React Native, and Node.
 */
export function createHttpClient(config: BasetubeClientConfig): AxiosInstance {
  const {
    baseUrl,
    getToken,
    withCredentials = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    maxRateLimitRetries = DEFAULT_RATE_LIMIT_RETRIES,
    onUnauthorized,
    adapter,
  } = config;

  const instance = axios.create({
    baseURL: baseUrl.replace(/\/$/, ''),
    timeout: timeoutMs,
    withCredentials,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(adapter ? { adapter } : {}),
  });

  instance.interceptors.request.use(async (req: InternalAxiosRequestConfig) => {
    if (getToken) {
      try {
        const token = await getToken();
        if (token) {
          req.headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // Token resolution failures must not block the request; the backend
        // will respond 401 and onUnauthorized handles re-auth.
      }
    }
    return req;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const status = error.response?.status;

      if (status === 401 && onUnauthorized) {
        onUnauthorized();
      }

      if (status === 429 && maxRateLimitRetries > 0) {
        const reqConfig = error.config as RetryableConfig | undefined;
        if (reqConfig && !reqConfig.__rlRetried) {
          reqConfig.__rlRetried = true;
          await delay(parseRetryAfterMs(error.response?.headers?.['retry-after']));
          return instance.request(reqConfig);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

/** Convenience GET that unwraps the axios response to `response.data`. */
export async function getData<T>(
  http: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await http.get<T>(url, config);
  return res.data;
}
