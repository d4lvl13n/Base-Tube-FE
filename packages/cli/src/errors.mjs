/**
 * Exit codes and error messages. The exit codes are part of the public
 * contract (README "Exit codes"): scripts and AI agents branch on them.
 */

export const EXIT = Object.freeze({
  OK: 0,
  GENERIC: 1,
  USAGE: 2,
  AUTH: 3, // not signed in, or the key was refused
  FORBIDDEN: 4, // the key or the account is not allowed to do this
  LIMIT: 5, // a limit was reached (daily uploads, uploads in progress, calls per minute, file size)
});

const KEY_PAGE = 'base.tube → Creator Hub → API';

/** An error the CLI reports to the user, with the exit code to use and one sentence saying what to do. */
export class CliError extends Error {
  constructor(message, { exitCode = EXIT.GENERIC, code, hint, status, details } = {}) {
    super(message);
    this.exitCode = exitCode;
    this.code = code;
    this.hint = hint;
    this.status = status;
    this.details = details;
  }
}

export function usageError(message, hint) {
  return new CliError(message, { exitCode: EXIT.USAGE, code: 'USAGE', hint });
}

/** An error answer from the Base.tube API, turned into a CliError with an exit code and a hint. */
export function apiError(status, error) {
  const code = typeof error?.code === 'string' ? error.code : `HTTP_${status}`;
  const message = typeof error?.message === 'string' ? error.message : `The API answered HTTP ${status}`;
  const details = error?.details && typeof error.details === 'object' ? error.details : undefined;
  return new CliError(message, { exitCode: exitCodeFor(status, code), code, status, details, hint: hintFor(code, details) });
}

function exitCodeFor(status, code) {
  if (['UPLOAD_FILE_TOO_LARGE', 'THUMBNAIL_TOO_LARGE'].includes(code)) return EXIT.LIMIT;
  if (['INVALID_UPLOAD_METADATA', 'INVALID_VIDEO_METADATA'].includes(code)) return EXIT.USAGE;
  if (status === 401) return EXIT.AUTH;
  if (status === 403) return EXIT.FORBIDDEN;
  if (status === 429 || status === 413) return EXIT.LIMIT;
  return EXIT.GENERIC;
}

function hintFor(code, details) {
  switch (code) {
    case 'INVALID_API_KEY':
      return `Check the key, or create a new one on ${KEY_PAGE}, then run "basetube login".`;
    case 'KEY_REVOKED':
      return `This key was revoked or has expired. Create a new key on ${KEY_PAGE}, then run "basetube login".`;
    case 'SCOPE_MISSING': {
      const required = typeof details?.required === 'string' ? details.required : 'the missing';
      return `Create a key with the '${required}' permission on ${KEY_PAGE}, then run "basetube login".`;
    }
    case 'ACCOUNT_NOT_ELIGIBLE': {
      const reasons = Array.isArray(details?.reasons) ? details.reasons : [];
      if (reasons.includes('email_not_verified')) return 'Verify your email address on base.tube, then try again.';
      if (reasons.includes('no_channel')) return 'Create a channel on base.tube first, then try again.';
      return 'Your account cannot use the API right now. Contact Base.tube support.';
    }
    case 'CHANNEL_FORBIDDEN':
      return 'This key may not publish to that channel. Run "basetube channels" to see the channels it can use.';
    case 'UPLOAD_DAILY_QUOTA_EXCEEDED':
      return 'You reached today\'s upload limit (website and API together). It resets at midnight UTC.';
    case 'UPLOAD_ADMISSION_BUSY':
      return 'Too many uploads are in progress on your account. Let one finish, then try again.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many calls with this key in one minute. Wait a minute, then try again.';
    case 'UPLOAD_FILE_TOO_LARGE':
      return 'A video can be at most 2 GB. Send a smaller file.';
    case 'THUMBNAIL_TOO_LARGE':
      return 'A thumbnail can be at most 3 MB. Send a smaller JPEG, PNG or WebP image.';
    case 'INVALID_UPLOAD_METADATA':
    case 'INVALID_VIDEO_METADATA':
      return 'Fix the values named above, then run the command again.';
    case 'VIDEO_NOT_READY':
      return 'A video can be made public only once it is ready. Check with "basetube videos get <id>".';
    case 'VIDEO_NOT_FOUND':
    case 'UPLOAD_NOT_FOUND':
      return 'Run "basetube videos list" to see the videos this key can reach.';
    case 'UPLOAD_ALREADY_COMPLETED':
      return 'This file was already sent to this channel. Find it with "basetube videos list", or add --restart to send it again as a new video.';
    case 'IDEMPOTENCY_CONFLICT':
    case 'UPLOAD_STATE_CONFLICT':
    case 'UPLOAD_COMPLETION_CONFLICT':
    case 'UPLOAD_INITIALIZATION_UNKNOWN':
    case 'MEDIA_VALIDATION_FAILED':
      return 'Run the same command again with --restart to start a new upload.';
    case 'UPLOAD_INTAKE_PAUSED':
    case 'STORAGE_UNAVAILABLE':
    case 'RATE_LIMIT_UNAVAILABLE':
      return 'Base.tube is temporarily unavailable. Try again in a few minutes.';
    default:
      return undefined;
  }
}

export function notSignedIn() {
  return new CliError('Not signed in.', {
    exitCode: EXIT.AUTH,
    code: 'NOT_SIGNED_IN',
    hint: `Create a key on ${KEY_PAGE}, then run "basetube login" (or set BASETUBE_API_KEY).`,
  });
}

/** Errors of the CLI itself (file system, network) become CliErrors; CliErrors pass through. */
export function asCliError(error) {
  if (error instanceof CliError) return error;
  if (error?.name === 'TypeError' && /fetch failed/i.test(error.message)) {
    const cause = error.cause?.code ?? error.cause?.message;
    return new CliError(`Could not reach the API${cause ? ` (${cause})` : ''}.`, {
      code: 'NETWORK_ERROR',
      hint: 'Check your internet connection and the API address (--api / BASETUBE_API_URL), then try again.',
    });
  }
  if (error?.code === 'ENOENT' && error.path) {
    return new CliError(`File not found: ${error.path}`, { exitCode: EXIT.USAGE, code: 'FILE_NOT_FOUND' });
  }
  return new CliError(error?.message ?? String(error), { code: 'ERROR' });
}

/** Redact active credentials in strings and nested JSON values, including object keys. */
export function redactSecrets(value, secrets) {
  if (typeof value === 'string') {
    for (const secret of secrets) if (secret) value = value.split(secret).join('[REDACTED]');
    return value;
  }
  if (Array.isArray(value)) return value.map((entry) => redactSecrets(entry, secrets));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) =>
      [redactSecrets(key, secrets), redactSecrets(entry, secrets)]));
  }
  return value;
}
