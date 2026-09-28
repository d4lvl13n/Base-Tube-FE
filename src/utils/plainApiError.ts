/**
 * What a person reads when an API call fails.
 *
 * The server's own sentence wins (`{error:{message}}` or `{message}`). Without
 * one, a plain sentence says what happened and what to do. Axios' wording
 * ("Request failed with status code 503", "Network Error") is never the
 * message: it goes to `technical`, which the page shows only in development.
 */
export interface PlainApiError {
  message: string;
  /** "HTTP 503 · PROVIDER_UNAVAILABLE": shown only when NODE_ENV is development. */
  technical: string | null;
  status: number | null;
  code: string | null;
}

export const PLAIN_ERROR_FALLBACK = 'Something went wrong. Please try again.';

/** Axios' own wording for a failed request. */
const TRANSPORT_WORDING =
  /^(request failed with status code \d+|network error|timeout of \d+ms exceeded|timeout exceeded|canceled|cancelled|aborted)$/i;

type HttpFailure = {
  response?: { status?: unknown; data?: unknown };
  code?: unknown;
  message?: unknown;
  isAxiosError?: unknown;
  name?: unknown;
};

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/** The message and code in the server's error body, if it has them. */
export function serverErrorBody(data: unknown): { message: string | null; code: string | null } {
  if (!data || typeof data !== 'object') return { message: null, code: null };
  const body = data as Record<string, unknown>;
  const error = body.error;
  if (error && typeof error === 'object') {
    const inner = error as Record<string, unknown>;
    return { message: text(inner.message) ?? text(body.message), code: text(inner.code) ?? text(body.code) };
  }
  return { message: text(body.message) ?? text(error), code: text(body.code) };
}

/** A plain sentence for an HTTP status without a server message. */
function statusSentence(status: number, fallback: string): string {
  if (status === 401) return 'Your session has ended. Sign in again, then try again.';
  if (status === 403) return 'Your account cannot do this.';
  if (status === 404) return 'We could not find this. It may have been removed.';
  if (status === 413) return 'This file is too large.';
  if (status === 429) return 'Too many requests. Wait a moment, then try again.';
  return fallback;
}

const isProgrammingError = (error: unknown) =>
  error instanceof TypeError || error instanceof ReferenceError || error instanceof SyntaxError || error instanceof RangeError;

export function plainApiError(error: unknown, fallback: string = PLAIN_ERROR_FALLBACK): PlainApiError {
  const failure = (error && typeof error === 'object' ? error : null) as HttpFailure | null;
  const response = failure?.response && typeof failure.response === 'object' ? failure.response : null;
  const status = typeof response?.status === 'number' ? response.status : null;
  const body = serverErrorBody(response?.data);
  const raw = text(failure?.message) ?? text(error);
  const transportCode = text(failure?.code);
  const transport = Boolean(raw && TRANSPORT_WORDING.test(raw));
  const technical =
    [
      status !== null ? `HTTP ${status}` : null,
      body.code,
      !body.code && transportCode ? transportCode : null,
      transport && status === null ? raw : null,
      isProgrammingError(error) ? `${(error as Error).name}: ${(error as Error).message}` : null,
    ]
      .filter(Boolean)
      .join(' · ') || null;
  const result = (message: string): PlainApiError => ({ message, technical, status, code: body.code });

  if (body.message) return result(body.message);
  if (status !== null) return result(statusSentence(status, fallback));
  // "Request failed with status code 500" rethrown without its response.
  const statusInText = raw?.match(/status code (\d{3})$/i);
  if (statusInText) return result(statusSentence(Number(statusInText[1]), fallback));
  if (transport || failure?.isAxiosError === true) {
    const timedOut = transportCode === 'ECONNABORTED' || transportCode === 'ETIMEDOUT' || /timeout/i.test(raw || '');
    if (timedOut) return result('This is taking too long to answer. Please try again.');
    if (/cancel|abort/i.test(raw || '')) return result(fallback);
    return result('We could not reach base.tube. Check your connection, then try again.');
  }
  // Our API layer rethrows the server's sentence as a plain Error.
  if (raw && !isProgrammingError(error)) return result(raw);
  return result(fallback);
}

/** Technical details are for developers: never shown outside development. */
export const showTechnicalErrors = () => process.env.NODE_ENV === 'development';
