import {
  classifyConfirmError,
  confirmWithRetry,
  CryptoConfirmHardConflictError,
  extractConfirmErrorDetails,
} from '../../utils/cryptoConfirmRetry';

describe('classifyConfirmError', () => {
  it('returns hard-conflict for 409 "already confirmed with a different transaction hash"', () => {
    expect(
      classifyConfirmError(
        409,
        'Purchase already confirmed with a different transaction hash',
      ),
    ).toBe('hard-conflict');
  });

  it('returns transient for 409 variants that suggest the tx is not yet visible', () => {
    expect(classifyConfirmError(409, 'Transaction not yet mined')).toBe('transient');
    expect(classifyConfirmError(409, 'Log not matched yet')).toBe('transient');
    expect(classifyConfirmError(409, 'transaction not found')).toBe('transient');
    expect(classifyConfirmError(409, 'Receipt still pending')).toBe('transient');
    expect(classifyConfirmError(409, 'Still indexing the block')).toBe('transient');
  });

  it('returns hard-conflict for unknown 409 messages (fail-safe)', () => {
    expect(classifyConfirmError(409, 'Unexpected server state')).toBe('hard-conflict');
    expect(classifyConfirmError(409, '')).toBe('hard-conflict');
  });

  it('returns retryable-other for network errors and 5xx', () => {
    expect(classifyConfirmError(0, 'Network Error')).toBe('retryable-other');
    expect(classifyConfirmError(500, 'Internal server error')).toBe('retryable-other');
    expect(classifyConfirmError(502, 'Bad gateway')).toBe('retryable-other');
    expect(classifyConfirmError(503, 'Service unavailable')).toBe('retryable-other');
  });

  it('returns terminal for other 4xx (400, 401, 403, 404)', () => {
    expect(classifyConfirmError(400, 'Bad request')).toBe('terminal');
    expect(classifyConfirmError(401, 'Unauthorized')).toBe('terminal');
    expect(classifyConfirmError(403, 'Forbidden')).toBe('terminal');
    expect(classifyConfirmError(404, 'Not found')).toBe('terminal');
  });

  it('returns terminal for successful 2xx (defensive — classifier should not be called on success)', () => {
    expect(classifyConfirmError(200, 'ok')).toBe('terminal');
  });
});

describe('extractConfirmErrorDetails', () => {
  it('returns { status: 0, "Unknown error" } for unknowns', () => {
    expect(extractConfirmErrorDetails(null)).toEqual({
      status: 0,
      message: 'Unknown error',
    });
  });

  it('returns the message from a plain Error', () => {
    expect(extractConfirmErrorDetails(new Error('boom'))).toEqual({
      status: 0,
      message: 'boom',
    });
  });
});

describe('confirmWithRetry', () => {
  const makeErrorWithStatus = (status: number, message: string) => {
    const err = new Error(message);
    (err as any).__status = status;
    return err;
  };
  const getErrorDetails = (err: unknown) => ({
    status: (err as any)?.__status ?? 0,
    message: (err as Error)?.message ?? '',
  });
  const fastSleep = () => Promise.resolve();

  it('resolves immediately on first success', async () => {
    const attempt = jest.fn().mockResolvedValueOnce('ok');
    const result = await confirmWithRetry(attempt, {
      getErrorDetails,
      sleep: fastSleep,
      backoffs: [1, 1, 1],
    });
    expect(result).toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('retries on a transient 409 and resolves', async () => {
    const attempt = jest
      .fn()
      .mockRejectedValueOnce(makeErrorWithStatus(409, 'not yet mined'))
      .mockResolvedValueOnce('ok');
    const result = await confirmWithRetry(attempt, {
      getErrorDetails,
      sleep: fastSleep,
      backoffs: [1, 1, 1],
    });
    expect(result).toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it('throws CryptoConfirmHardConflictError on hard conflict 409 and does not retry', async () => {
    const attempt = jest
      .fn()
      .mockRejectedValue(
        makeErrorWithStatus(
          409,
          'Purchase already confirmed with a different transaction hash',
        ),
      );
    await expect(
      confirmWithRetry(attempt, {
        getErrorDetails,
        sleep: fastSleep,
        backoffs: [1, 1, 1],
      }),
    ).rejects.toBeInstanceOf(CryptoConfirmHardConflictError);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('exhausts all attempts on persistent transient 409 then throws', async () => {
    const attempt = jest.fn().mockRejectedValue(makeErrorWithStatus(409, 'not yet mined'));
    await expect(
      confirmWithRetry(attempt, {
        getErrorDetails,
        sleep: fastSleep,
        backoffs: [1, 1, 1],
      }),
    ).rejects.toThrow('not yet mined');
    expect(attempt).toHaveBeenCalledTimes(4); // 1 + 3 retries
  });

  it('throws immediately on a terminal 4xx (400) without retrying', async () => {
    const attempt = jest.fn().mockRejectedValue(makeErrorWithStatus(400, 'Bad input'));
    await expect(
      confirmWithRetry(attempt, {
        getErrorDetails,
        sleep: fastSleep,
        backoffs: [1, 1, 1],
      }),
    ).rejects.toThrow('Bad input');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx errors like transient errors', async () => {
    const attempt = jest
      .fn()
      .mockRejectedValueOnce(makeErrorWithStatus(502, 'bad gateway'))
      .mockRejectedValueOnce(makeErrorWithStatus(500, 'boom'))
      .mockResolvedValueOnce('ok');
    const result = await confirmWithRetry(attempt, {
      getErrorDetails,
      sleep: fastSleep,
      backoffs: [1, 1, 1],
    });
    expect(result).toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('calls onAttempt before each call with the 1-indexed attempt number', async () => {
    const onAttempt = jest.fn();
    const attempt = jest
      .fn()
      .mockRejectedValueOnce(makeErrorWithStatus(409, 'not yet mined'))
      .mockResolvedValueOnce('ok');
    await confirmWithRetry(attempt, {
      getErrorDetails,
      sleep: fastSleep,
      backoffs: [1, 1, 1],
      onAttempt,
    });
    expect(onAttempt).toHaveBeenNthCalledWith(1, 1);
    expect(onAttempt).toHaveBeenNthCalledWith(2, 2);
  });

  it('calls onGiveUp with hard-conflict when classifier stops the retry loop', async () => {
    const onGiveUp = jest.fn();
    const attempt = jest
      .fn()
      .mockRejectedValue(
        makeErrorWithStatus(
          409,
          'already confirmed with a different transaction hash',
        ),
      );
    await expect(
      confirmWithRetry(attempt, {
        getErrorDetails,
        sleep: fastSleep,
        backoffs: [1, 1, 1],
        onGiveUp,
      }),
    ).rejects.toBeInstanceOf(CryptoConfirmHardConflictError);
    expect(onGiveUp).toHaveBeenCalledWith('hard-conflict', 1);
  });

  it('waits the configured backoff between attempts', async () => {
    const sleep = jest.fn().mockResolvedValue(undefined);
    const attempt = jest
      .fn()
      .mockRejectedValueOnce(makeErrorWithStatus(409, 'not yet mined'))
      .mockRejectedValueOnce(makeErrorWithStatus(409, 'not yet mined'))
      .mockResolvedValueOnce('ok');
    await confirmWithRetry(attempt, {
      getErrorDetails,
      sleep,
      backoffs: [1000, 2000, 4000],
    });
    expect(sleep).toHaveBeenNthCalledWith(1, 1000);
    expect(sleep).toHaveBeenNthCalledWith(2, 2000);
    expect(sleep).toHaveBeenCalledTimes(2); // only between attempts 1→2 and 2→3
  });
});
