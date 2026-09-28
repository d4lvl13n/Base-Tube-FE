/** A Studio error read from a binary (blob) response, keeping the server's code and advice. */
export class StudioRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "StudioRequestError";
  }
}
const readText = (blob: Blob): Promise<string> =>
  typeof blob.text === "function"
    ? blob.text()
    : new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
      });
/** Parse the JSON error body that the server returns instead of a file. */
export async function studioBlobError(blob: Blob): Promise<StudioRequestError> {
  try {
    const body = JSON.parse(await readText(blob));
    return new StudioRequestError(
      body.error?.code || "EXPORT_FAILED",
      body.error?.message || "Export unavailable.",
      body.error?.details,
    );
  } catch {
    return new StudioRequestError("EXPORT_FAILED", "Export unavailable.");
  }
}
/**
 * Codes the Studio uses for errors raised by shared services (BE-20). Their server
 * text is a fixed generic sentence, so the page words them itself. None of them is
 * solved by sending the same request again.
 */
export const STUDIO_GENERIC_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  FORBIDDEN: "This account cannot do this. Your saved work is unchanged.",
  CONFLICT: "This changed in the meantime. Reload the page, then try again.",
  UNPROCESSABLE_REQUEST: "The Studio cannot process this request. Your saved work is unchanged.",
};
/** Readable text for an HTTP failure that carries no Studio message: what happened and what to do. */
export function studioStatusMessage(status: number | undefined): string {
  if (status === 401) return "Your session has ended. Sign in again, then try again.";
  if (status === 403) return STUDIO_GENERIC_ERROR_MESSAGES.FORBIDDEN;
  if (status === 404) return "This could not be found. It may have been removed.";
  if (status === 409) return STUDIO_GENERIC_ERROR_MESSAGES.CONFLICT;
  if (status === 413) return "This file is too large. Choose a smaller one.";
  if (status === 422) return STUDIO_GENERIC_ERROR_MESSAGES.UNPROCESSABLE_REQUEST;
  if (status === 429) return studioRateLimitMessage();
  return STUDIO_SERVER_ERROR_MESSAGE;
}
/** A 5xx, or a failure the page cannot name. */
export const STUDIO_SERVER_ERROR_MESSAGE =
  "The Studio could not answer just now. Your saved work is safe — try again in a moment.";
/** No answer at all (offline, blocked, DNS). */
export const STUDIO_NETWORK_ERROR_MESSAGE =
  "We could not reach base.tube. Check your connection, then try again.";
/** The request gave up waiting. */
export const STUDIO_TIMEOUT_MESSAGE = "This is taking too long to answer. Try again in a moment.";
/** Axios' own wording for a failed request: never shown as a message. */
const TRANSPORT_WORDING =
  /^(request failed with status code \d+|network error|timeout of \d+ms exceeded|timeout exceeded|canceled|cancelled|aborted)$/i;
const isProgrammingError = (error: unknown) =>
  error instanceof TypeError || error instanceof ReferenceError || error instanceof SyntaxError || error instanceof RangeError;

/** A failed Studio request as the page shows it. */
export interface StudioErrorInfo {
  code: string;
  message: string;
  /** The HTTP status, when the server answered. */
  status?: number;
}
/**
 * The message of a failure that carries no Studio message (no answer, or an
 * error raised in the page). The transport's wording ("Network Error",
 * "Request failed with status code 503", "timeout of … exceeded") and
 * programming errors are never shown; a sentence written by the page is.
 */
export function studioTransportMessage(error: unknown, fallback = STUDIO_SERVER_ERROR_MESSAGE): string {
  const value = (error && typeof error === "object" ? error : null) as {
    message?: unknown;
    code?: unknown;
    isAxiosError?: unknown;
  } | null;
  const raw = typeof value?.message === "string" ? value.message.trim() : typeof error === "string" ? error.trim() : "";
  const transport = Boolean(raw && TRANSPORT_WORDING.test(raw)) || value?.isAxiosError === true;
  if (transport) {
    if (value?.code === "ECONNABORTED" || value?.code === "ETIMEDOUT" || /timeout/i.test(raw)) return STUDIO_TIMEOUT_MESSAGE;
    if (/cancel|abort/i.test(raw)) return fallback;
    return STUDIO_NETWORK_ERROR_MESSAGE;
  }
  return raw && !isProgrammingError(error) ? raw : fallback;
}
/**
 * "HTTP 503 · STUDIO_UNAVAILABLE": the technical part of a Studio error, shown
 * only in development (`StudioErrorDetail` → `TechnicalErrorDetail`).
 */
export function studioTechnicalDetail(info: { code?: string | null; status?: number | null } | null | undefined): string | null {
  if (!info) return null;
  const parts = [
    typeof info.status === "number" ? `HTTP ${info.status}` : null,
    info.code && info.code !== "ERROR" ? info.code : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

type HttpFailure = { response?: { status?: number; headers?: unknown } } | null | undefined;
const headerValue = (headers: unknown, name: string): unknown => {
  if (!headers || typeof headers !== "object") return undefined;
  const value = headers as Record<string, unknown> & { get?: (header: string) => unknown };
  if (value[name] !== undefined) return value[name];
  try {
    return typeof value.get === "function" ? value.get(name) : undefined;
  } catch {
    return undefined;
  }
};
/**
 * Seconds before a limited request may be sent again: `Retry-After` (seconds or a
 * date), else `RateLimit-Reset` (seconds). Null when the response does not say or
 * the browser may not read the header (another origin).
 */
export function studioRetryAfterSeconds(headers: unknown, now = Date.now()): number | null {
  for (const name of ["retry-after", "ratelimit-reset"]) {
    const raw = headerValue(headers, name);
    if (raw === undefined || raw === null || raw === "") continue;
    const text = String(raw).trim();
    const seconds = /^\d+$/.test(text)
      ? Number(text)
      : name === "retry-after"
        ? Math.ceil((Date.parse(text) - now) / 1000)
        : Number.NaN;
    if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds, 24 * 60 * 60);
  }
  return null;
}
const unit = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
/** "Too many requests — try again in a moment", with the wait when the response gives it. */
export function studioRateLimitMessage(seconds: number | null = null): string {
  if (!seconds) return "Too many requests — try again in a moment.";
  const wait = seconds < 60 ? unit(seconds, "second") : unit(Math.ceil(seconds / 60), "minute");
  return `Too many requests — try again in ${wait}.`;
}
/**
 * A 429 from a request-rate limit (uploads, imports, exports, YouTube source)
 * as a StudioRequestError with the wait, whatever the body is
 * (exports answer with a blob). Null for any other failure.
 */
export function studioRateLimitError(failure: unknown): StudioRequestError | null {
  const response = (failure as HttpFailure)?.response;
  if (response?.status !== 429) return null;
  const retryAfterSeconds = studioRetryAfterSeconds(response.headers);
  return new StudioRequestError("RATE_LIMIT_EXCEEDED", studioRateLimitMessage(retryAfterSeconds), { retryAfterSeconds });
}
/** A file format and size of a Studio export. */
export interface StudioExportChoice {
  format: "png" | "jpeg";
  size: "original" | "youtube";
}
/** The export the server suggests instead after EXPORT_TOO_LARGE (`details.suggested`). */
export function studioSuggestedExport(error: unknown): StudioExportChoice | null {
  if (!(error instanceof StudioRequestError) || error.code !== "EXPORT_TOO_LARGE") return null;
  const suggested = (error.details as { suggested?: Partial<StudioExportChoice> } | undefined)?.suggested;
  return suggested &&
    (suggested.format === "png" || suggested.format === "jpeg") &&
    (suggested.size === "original" || suggested.size === "youtube")
    ? { format: suggested.format, size: suggested.size }
    : null;
}
/** "JPEG, YouTube size" */
export const studioExportChoiceLabel = (choice: StudioExportChoice) =>
  `${choice.format === "jpeg" ? "JPEG" : "PNG"}, ${choice.size === "youtube" ? "YouTube size" : "original size"}`;
/** Download failures show the server's message (for example EXPORT_TOO_LARGE advice). */
export function studioDownloadErrorMessage(error: unknown): string {
  if (error instanceof StudioRequestError) return error.message;
  const rateLimited = studioRateLimitError(error);
  if (rateLimited) return rateLimited.message;
  const message = (error as { response?: { data?: { error?: { message?: unknown } } } })
    ?.response?.data?.error?.message;
  return typeof message === "string" && message
    ? message
    : "Could not download this image. Please try again.";
}
