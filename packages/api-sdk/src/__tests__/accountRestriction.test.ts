import { AxiosAdapter, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  accountRestrictionOf,
  createBasetubeClient,
  isAccountRestrictedError,
  UploadApiError,
} from '../index';

/** Captures outgoing requests and returns canned results, honouring validateStatus. */
function makeAdapter(
  handler: (config: InternalAxiosRequestConfig) => { status: number; data?: unknown }
): AxiosAdapter {
  return async (config) => {
    const result = handler(config);
    const response: AxiosResponse = {
      data: result.data,
      status: result.status,
      statusText: '',
      headers: {},
      config,
    };
    if (result.status >= 200 && result.status < 300) return response;
    throw new AxiosError('mock error', String(result.status), config, {}, response);
  };
}

const refused = (code: string) => ({
  status: 403,
  data: { success: false, error: { code, message: 'blocked' } },
});

async function caught(call: () => Promise<unknown>): Promise<unknown> {
  try {
    await call();
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to throw');
}

describe('account restriction (403 ACCOUNT_SUSPENDED / ACCOUNT_BANNED)', () => {
  it('flags the error and calls onAccountRestricted for a suspended account', async () => {
    const onAccountRestricted = jest.fn();
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      adapter: makeAdapter(() => refused('ACCOUNT_SUSPENDED')),
      onAccountRestricted,
    });

    const error = await caught(() => client.profile.me());

    expect(onAccountRestricted).toHaveBeenCalledTimes(1);
    expect(onAccountRestricted).toHaveBeenCalledWith('suspended');
    expect(accountRestrictionOf(error)).toBe('suspended');
    expect(isAccountRestrictedError(error)).toBe(true);
    expect((error as { accountRestriction?: string }).accountRestriction).toBe('suspended');
  });

  it('keeps the original axios error for existing callers', async () => {
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      adapter: makeAdapter(() => refused('ACCOUNT_BANNED')),
      onAccountRestricted: () => undefined,
    });

    const error = await caught(() => client.engagement.toggleLike(3));

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(403);
    expect(((error as AxiosError).response?.data as { error: { code: string } }).error.code).toBe('ACCOUNT_BANNED');
    expect(accountRestrictionOf(error)).toBe('banned');
  });

  it('ignores other 403s and unknown codes', async () => {
    const onAccountRestricted = jest.fn();
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      adapter: makeAdapter(() => refused('INSUFFICIENT_PERMISSIONS')),
      onAccountRestricted,
    });

    const error = await caught(() => client.profile.me());

    expect(onAccountRestricted).not.toHaveBeenCalled();
    expect(accountRestrictionOf(error)).toBeNull();
    expect(isAccountRestrictedError(error)).toBe(false);
  });

  it('only trusts the code on a 403', async () => {
    const onAccountRestricted = jest.fn();
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      adapter: makeAdapter(() => ({ status: 401, data: { success: false, error: { code: 'ACCOUNT_SUSPENDED' } } })),
      onAccountRestricted,
    });

    const error = await caught(() => client.profile.me());

    expect(onAccountRestricted).not.toHaveBeenCalled();
    expect(accountRestrictionOf(error)).toBeNull();
  });

  it('does not let a throwing handler replace the caller error', async () => {
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      adapter: makeAdapter(() => refused('ACCOUNT_SUSPENDED')),
      onAccountRestricted: () => {
        throw new Error('handler bug');
      },
    });

    const error = await caught(() => client.profile.me());

    expect(error).toBeInstanceOf(AxiosError);
    expect(accountRestrictionOf(error)).toBe('suspended');
  });

  it('reads already-parsed SDK errors (UploadApiError) too', () => {
    expect(accountRestrictionOf(new UploadApiError('blocked', 403, 'ACCOUNT_BANNED', null))).toBe('banned');
    expect(accountRestrictionOf(new UploadApiError('nope', 403, 'FORBIDDEN', null))).toBeNull();
  });

  it('returns null for non-errors', () => {
    expect(accountRestrictionOf(null)).toBeNull();
    expect(accountRestrictionOf('ACCOUNT_SUSPENDED')).toBeNull();
    expect(accountRestrictionOf(new Error('x'))).toBeNull();
  });
});
