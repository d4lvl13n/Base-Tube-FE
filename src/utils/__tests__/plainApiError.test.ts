import { plainApiError, serverErrorBody } from '../plainApiError';

const http = (status: number, data?: unknown) => ({
  isAxiosError: true,
  message: `Request failed with status code ${status}`,
  response: { status, data },
});

it("shows the server's sentence from either error envelope, with the status as technical detail", () => {
  const audit = plainApiError(
    http(503, {
      success: false,
      error: { code: 'PROVIDER_UNAVAILABLE', message: 'The audit analysis did not finish. Please try again; no incomplete report was saved.' },
    }),
  );
  expect(audit).toEqual({
    message: 'The audit analysis did not finish. Please try again; no incomplete report was saved.',
    technical: 'HTTP 503 · PROVIDER_UNAVAILABLE',
    status: 503,
    code: 'PROVIDER_UNAVAILABLE',
  });
  expect(plainApiError(http(400, { message: 'Pick a pack first.' })).message).toBe('Pick a pack first.');
  expect(serverErrorBody({ error: 'Legacy text' })).toEqual({ message: 'Legacy text', code: null });
});

it('never shows axios wording: a plain sentence says what happened and what to do', () => {
  for (const status of [500, 502, 503]) {
    const plain = plainApiError(http(status), 'The channel audit did not finish. Please try again.');
    expect(plain.message).toBe('The channel audit did not finish. Please try again.');
    expect(plain.message).not.toMatch(/status code/);
    expect(plain.technical).toBe(`HTTP ${status}`);
  }
  expect(plainApiError(http(429)).message).toBe('Too many requests. Wait a moment, then try again.');
  expect(plainApiError(http(401)).message).toMatch(/^Your session has ended/);
  expect(plainApiError(http(404)).message).toMatch(/could not find/);
});

it('explains a lost connection and a timeout, keeping the transport text for developers', () => {
  const offline = plainApiError({ isAxiosError: true, message: 'Network Error', code: 'ERR_NETWORK' });
  expect(offline.message).toBe('We could not reach base.tube. Check your connection, then try again.');
  expect(offline.technical).toBe('ERR_NETWORK · Network Error');
  expect(plainApiError({ isAxiosError: true, message: 'timeout of 600000ms exceeded', code: 'ECONNABORTED' }).message).toBe(
    'This is taking too long to answer. Please try again.',
  );
});

it("keeps the server sentence our API layer rethrows, but never a programming error's text", () => {
  expect(plainApiError(new Error('Daily audit limit of 3 reached.')).message).toBe('Daily audit limit of 3 reached.');
  const rethrown = plainApiError(new Error('Request failed with status code 500'), 'Could not load packs.');
  expect(rethrown.message).toBe('Could not load packs.');
  expect(rethrown.technical).toBe('Request failed with status code 500');
  const crash = plainApiError(new TypeError("Cannot read properties of undefined (reading 'x')"), 'Could not load packs.');
  expect(crash.message).toBe('Could not load packs.');
  expect(crash.technical).toMatch(/^TypeError: Cannot read/);
  expect(plainApiError(undefined).message).toBe('Something went wrong. Please try again.');
});
