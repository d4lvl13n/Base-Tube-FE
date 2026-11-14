/**
 * Calls to the Base.tube API. The key goes only in the Authorization header,
 * never in a URL, and is never sent to the storage addresses.
 */
import { apiError } from './errors.mjs';

const MAX_ATTEMPTS = 20;
/** A longer Retry-After (for example a daily limit) is reported, not waited for. */
const MAX_WAIT_SECONDS = 120;

export const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

/**
 * Returns call(method, path, { json, body, headers }) → { status, data }.
 * 429 / 503 answers that carry Retry-After are waited for and sent again.
 */
export function createClient({ base, key, log = () => {} }) {
  return async function call(method, path, { json, body, headers = {} } = {}) {
    for (let attempt = 1; ; attempt += 1) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          accept: 'application/json',
          'user-agent': 'basetube-cli',
          ...(key ? { authorization: `Bearer ${key}` } : {}),
          ...(json === undefined ? {} : { 'content-type': 'application/json' }),
          ...headers,
        },
        body: json === undefined ? body : JSON.stringify(json),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) return { status: response.status, data: payload?.data };
      const retryAfter = Number(response.headers.get('retry-after'));
      const retryable = response.status === 429 || response.status === 503;
      if (retryable && retryAfter > 0 && retryAfter <= MAX_WAIT_SECONDS && attempt < MAX_ATTEMPTS) {
        log(`${payload?.error?.code ?? `HTTP ${response.status}`}: waiting ${retryAfter}s as the API asks`);
        await sleep(retryAfter);
        continue;
      }
      throw apiError(response.status, payload?.error);
    }
  };
}
