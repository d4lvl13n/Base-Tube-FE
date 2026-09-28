import {
  StudioRequestError,
  studioDownloadErrorMessage,
  studioExportChoiceLabel,
  studioRateLimitError,
  studioRateLimitMessage,
  studioRetryAfterSeconds,
  studioSuggestedExport,
} from '../studioErrors';

const now = Date.parse('2026-09-26T12:00:00.000Z');

describe('rate-limit answers', () => {
  it.each([
    [{ 'retry-after': '42' }, 42],
    [{ 'retry-after': 'Sat, 26 Sep 2026 12:05:00 GMT' }, 300],
    [{ 'ratelimit-reset': '540' }, 540],
    [{ 'retry-after': '0', 'ratelimit-reset': '90' }, 90],
    [{ get: (name: string) => (name === 'retry-after' ? '7' : undefined) }, 7],
    [{}, null],
    [undefined, null],
    [{ 'retry-after': 'soon' }, null],
  ])('reads the wait from %p', (headers, seconds) => {
    expect(studioRetryAfterSeconds(headers, now)).toBe(seconds);
  });

  it.each([
    [null, 'Too many requests — try again in a moment.'],
    [1, 'Too many requests — try again in 1 second.'],
    [42, 'Too many requests — try again in 42 seconds.'],
    [60, 'Too many requests — try again in 1 minute.'],
    [540, 'Too many requests — try again in 9 minutes.'],
  ])('words a wait of %p seconds', (seconds, message) => {
    expect(studioRateLimitMessage(seconds)).toBe(message);
  });

  it('turns any 429 into a StudioRequestError with the wait, whatever the body', () => {
    const blob = new Blob(['{}'], { type: 'application/json' });
    const error = studioRateLimitError({ response: { status: 429, headers: { 'retry-after': '120' }, data: blob } });
    expect(error).toBeInstanceOf(StudioRequestError);
    expect(error).toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests — try again in 2 minutes.', details: { retryAfterSeconds: 120 } });
    expect(studioRateLimitError({ response: { status: 422 } })).toBeNull();
    expect(studioRateLimitError(new Error('Network Error'))).toBeNull();
  });

  it('never words a refused download as a generic failure', () => {
    expect(studioDownloadErrorMessage({ response: { status: 429, headers: {}, data: {} } })).toBe('Too many requests — try again in a moment.');
  });
});

describe('EXPORT_TOO_LARGE alternatives', () => {
  it.each([
    [{ suggested: { format: 'jpeg', size: 'youtube' } }, { format: 'jpeg', size: 'youtube' }, 'JPEG, YouTube size'],
    [{ suggested: { format: 'png', size: 'original' } }, { format: 'png', size: 'original' }, 'PNG, original size'],
  ])('reads %p as a one-click alternative', (details, choice, label) => {
    const suggested = studioSuggestedExport(new StudioRequestError('EXPORT_TOO_LARGE', 'Too large.', details));
    expect(suggested).toEqual(choice);
    expect(studioExportChoiceLabel(suggested!)).toBe(label);
  });
  it.each([
    new StudioRequestError('EXPORT_TOO_LARGE', 'Too large.'),
    new StudioRequestError('EXPORT_TOO_LARGE', 'Too large.', { suggested: { format: 'gif', size: 'youtube' } }),
    new StudioRequestError('SOURCE_UNAVAILABLE', 'Gone.', { suggested: { format: 'png', size: 'original' } }),
    new Error('Network Error'),
  ])('offers nothing for %p', error => {
    expect(studioSuggestedExport(error)).toBeNull();
  });
});
