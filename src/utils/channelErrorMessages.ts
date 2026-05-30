import { parseApiError } from './apiError';

export type ChannelErrorField = 'handle' | 'name' | 'channel_image' | 'submit' | null;

export interface ChannelErrorResult {
  code: string | null;
  message: string;
  field: ChannelErrorField;
}

const CHANNEL_ERROR_MAP: Record<
  string,
  { message: string; field: ChannelErrorField }
> = {
  INVALID_HANDLE: {
    message: 'Enter a valid channel handle (3–29 characters, letters, numbers, underscores).',
    field: 'handle',
  },
  INVALID_CHANNEL_NAME: {
    message: 'Channel name must be at least 3 characters.',
    field: 'name',
  },
  HANDLE_UNAVAILABLE: {
    message: 'This handle is taken or reserved. Please choose another.',
    field: 'handle',
  },
  CHANNEL_IMAGE_UPLOAD_FAILED: {
    message: 'Image upload failed. Please try again.',
    field: 'channel_image',
  },
  CHANNEL_VALIDATION_FAILED: {
    message: 'Please check your channel details and try again.',
    field: 'submit',
  },
  CHANNEL_LIMIT_EXCEEDED: {
    message:
      "You've reached the daily limit for creating channels. Please try again tomorrow.",
    field: 'submit',
  },
  UNAUTHORIZED: {
    message: 'Please sign in to continue.',
    field: 'submit',
  },
  CHANNEL_CREATE_FAILED: {
    message:
      'We could not create your channel. Please try again, or contact support if this continues.',
    field: 'submit',
  },
};

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

export function getChannelErrorMessage(error: unknown): ChannelErrorResult {
  const { code, message } = parseApiError(error);

  if (code && CHANNEL_ERROR_MAP[code]) {
    return { code, ...CHANNEL_ERROR_MAP[code] };
  }

  const hasServerMessage =
    typeof message === 'string' &&
    message.trim().length > 0 &&
    message !== DEFAULT_MESSAGE &&
    !/^Request failed with status code/i.test(message);

  return {
    code,
    message: hasServerMessage ? message : DEFAULT_MESSAGE,
    field: 'submit',
  };
}
