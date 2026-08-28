import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import type { BasetubeClientConfig } from './config';

/**
 * This package is compiled to CommonJS and consumed by three module systems
 * (webpack in the CRA web app, Metro in Expo, Node in Jest). Depending on how the
 * bundler resolves axios's `exports` map, `require('axios')` may yield the
 * instance itself, `{ default: instance }`, or a namespace wrapped one level
 * deeper — then `axios.create` is undefined at runtime ("axios_1.default.create
 * is not a function" in the web bundle). Unwrap until we hold the object that
 * actually has `create`.
 */
function resolveAxios(): typeof axios {
  let candidate: unknown = axios;
  for (let depth = 0; depth < 3; depth += 1) {
    const value = candidate as { create?: unknown; default?: unknown } | null;
    if (value && typeof value.create === 'function') return candidate as typeof axios;
    if (!value || value.default === undefined) break;
    candidate = value.default;
  }
  throw new Error('@basetube/api: could not resolve the axios module (no create())');
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RATE_LIMIT_RETRIES = 1;
const RATE_LIMIT_FALLBACK_MS = 5_000;
const RATE_LIMIT_MAX_BACKOFF_MS = 60_000;

type RetryableConfig = InternalAxiosRequestConfig & {
  __rlRetried?: boolean;
  /** Stamped before `transformRequest` runs; see `isUnreplayableBody`. */
  __rlUnreplayable?: boolean;
};

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

/** Upload V2 control plane: the queue owns its own `Retry-After` handling. */
const UPLOAD_CONTROL_PLANE_PREFIX = '/api/v1/videos/uploads';

/**
 * True for a body axios cannot faithfully re-send.
 *
 * A `FormData`/`Blob`/`File` payload is a stream the browser has already read
 * once; replaying the config either re-uploads gigabytes or sends nothing at
 * all. (`File` extends `Blob`, so the Blob check covers both.) The guards are
 * `typeof`-first because the SDK also runs in Node and React Native, where
 * these globals may be absent.
 *
 * This must be evaluated in the REQUEST interceptor: `transformRequest` runs
 * after it and may replace the body with a serialised form, so by the time the
 * response interceptor sees `config.data` the original type is gone.
 */
const isUnreplayableBody = (data: unknown): boolean => {
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  if (typeof Blob !== 'undefined' && data instanceof Blob) return true;
  return false;
};

/**
 * True for the Upload V2 control plane.
 *
 * Its 429 is `UPLOAD_ADMISSION_BUSY` — a concurrency verdict the upload queue
 * answers with backoff and single-file probing (contract §7.2). A transport
 * that quietly slept and retried would both hide that signal from the queue
 * and add a second retry on top of the queue's own.
 */
const isUploadControlPlane = (url: string | undefined): boolean =>
  typeof url === 'string' && url.startsWith(UPLOAD_CONTROL_PLANE_PREFIX);

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

  const instance = resolveAxios().create({
    baseURL: baseUrl.replace(/\/$/, ''),
    timeout: timeoutMs,
    withCredentials,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(adapter ? { adapter } : {}),
  });

  instance.interceptors.request.use(async (req: InternalAxiosRequestConfig) => {
    (req as RetryableConfig).__rlUnreplayable = isUnreplayableBody(req.data);
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
        if (
          reqConfig &&
          !reqConfig.__rlRetried &&
          !reqConfig.__rlUnreplayable &&
          !isUnreplayableBody(reqConfig.data) &&
          !isUploadControlPlane(reqConfig.url)
        ) {
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
