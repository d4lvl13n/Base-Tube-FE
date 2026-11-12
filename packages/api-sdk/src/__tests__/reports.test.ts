import { AxiosAdapter, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  composeReportReason,
  createBasetubeClient,
  REPORT_REASON_MAX_LENGTH,
  reportFailureOf,
} from '../index';

/** Captures outgoing requests and returns canned results, honouring validateStatus. */
function makeAdapter(
  handler: (
    config: InternalAxiosRequestConfig
  ) => { status: number; data?: unknown; headers?: Record<string, string> }
): { adapter: AxiosAdapter; requests: InternalAxiosRequestConfig[] } {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    const result = handler(config);
    const response: AxiosResponse = {
      data: result.data,
      status: result.status,
      statusText: '',
      headers: result.headers ?? {},
      config,
    };
    if (result.status >= 200 && result.status < 300) return response;
    throw new AxiosError('mock error', String(result.status), config, {}, response);
  };
  return { adapter, requests };
}

const clientWith = (adapter: AxiosAdapter) =>
  createBasetubeClient({ baseUrl: 'https://api.test', adapter, maxRateLimitRetries: 0 });

/** Runs `call` and returns what it threw. */
async function caught(call: () => Promise<unknown>): Promise<unknown> {
  try {
    await call();
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to throw');
}

describe('reports.reportVideo', () => {
  it('posts the reason to the video report route and reads a new report', async () => {
    const { adapter, requests } = makeAdapter(() => ({
      status: 201,
      data: { success: true, message: 'Report received', data: { id: 12, status: 'open', alreadyReported: false } },
    }));

    const result = await clientWith(adapter).reports.reportVideo(42, 'Spam or misleading');

    expect(requests[0].method).toBe('post');
    expect(requests[0].url).toBe('/api/v1/reports/videos/42');
    expect(JSON.parse(requests[0].data)).toEqual({ reason: 'Spam or misleading' });
    expect(result).toEqual({ reportId: 12, status: 'open', alreadyReported: false });
  });

  it('treats a repeat report as a success flagged alreadyReported', async () => {
    const { adapter } = makeAdapter(() => ({
      status: 200,
      data: { success: true, message: 'You already reported this', data: { id: 12, status: 'open', alreadyReported: true } },
    }));

    await expect(clientWith(adapter).reports.reportVideo(42, 'Violence')).resolves.toMatchObject({
      alreadyReported: true,
      reportId: 12,
    });
  });

  it('returns a 429 at once instead of sleeping and retrying', async () => {
    const { adapter, requests } = makeAdapter(() => ({
      status: 429,
      headers: { 'retry-after': '60' },
      data: { success: false, error: { code: 'INTERACTION_RATE_LIMIT_EXCEEDED', message: 'slow down' } },
    }));
    // Default client: one automatic 429 retry for every other route.
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    const videoError = await caught(() => client.reports.reportVideo(42, 'Violence'));
    const commentError = await caught(() => client.reports.reportComment(7, 'Violence'));

    expect(requests).toHaveLength(2);
    expect(reportFailureOf(videoError)).toBe('rate_limited');
    expect(reportFailureOf(commentError)).toBe('rate_limited');
  });

  it('fails soft on a body without data', async () => {
    const { adapter } = makeAdapter(() => ({ status: 201, data: { success: true } }));

    await expect(clientWith(adapter).reports.reportVideo(42, 'Violence')).resolves.toEqual({
      reportId: null,
      status: null,
      alreadyReported: false,
    });
  });
});

describe('reports.reportComment', () => {
  it('posts to the existing comment report route', async () => {
    const { adapter, requests } = makeAdapter(() => ({
      status: 200,
      data: { success: true, message: 'Comment reported successfully' },
    }));

    const result = await clientWith(adapter).reports.reportComment(7, 'Hateful or abusive');

    expect(requests[0].method).toBe('post');
    expect(requests[0].url).toBe('/api/v1/comments/7/report');
    expect(JSON.parse(requests[0].data)).toEqual({ reason: 'Hateful or abusive' });
    expect(result).toEqual({ reportId: null, status: null, alreadyReported: false });
  });

  it('sends an empty body when no reason is given', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true } }));

    await clientWith(adapter).reports.reportComment(7);

    expect(JSON.parse(requests[0].data)).toEqual({});
  });
});

describe('composeReportReason', () => {
  it('uses the label alone when there is no detail', () => {
    expect(composeReportReason('Copyright')).toBe('Copyright');
    expect(composeReportReason('Copyright', '   ')).toBe('Copyright');
  });

  it('joins label and trimmed detail', () => {
    expect(composeReportReason('Something else', '  fake giveaway link ')).toBe('Something else: fake giveaway link');
  });

  it('never exceeds the backend limit', () => {
    const reason = composeReportReason('Spam or misleading', 'x'.repeat(5000));
    expect(reason.length).toBe(REPORT_REASON_MAX_LENGTH);
    expect(reason.startsWith('Spam or misleading: ')).toBe(true);
  });

  it('does not leave half an emoji at the cut', () => {
    // "ab" + emoji (2 code units): a cut at 3 would split the emoji.
    expect(composeReportReason('ab\u{1F600}', undefined, 3)).toBe('ab');
  });
});

describe('reportFailureOf', () => {
  const failing = (status: number, data?: unknown) =>
    clientWith(makeAdapter(() => ({ status, data })).adapter);

  it.each([
    [401, { success: false, error: { code: 'NO_AUTH_TOKEN', message: 'Authentication required' } }, 'sign_in_required'],
    [404, { success: false, message: 'Video not found' }, 'not_found'],
    [429, { success: false, error: { code: 'INTERACTION_RATE_LIMIT_EXCEEDED', message: 'slow down' } }, 'rate_limited'],
    [400, { success: false, message: 'too long', code: 'REASON_TOO_LONG' }, 'invalid_reason'],
    [400, { success: false, message: 'bad id', code: 'INVALID_ID' }, 'unknown'],
    [403, { success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'suspended' } }, 'account_restricted'],
    [403, { success: false, error: { code: 'SOMETHING_NEW', message: '?' } }, 'unknown'],
    [500, { success: false, message: 'Failed to send the report' }, 'unknown'],
  ])('maps HTTP %i to its failure kind', async (status, data, expected) => {
    const error = await caught(() => failing(status, data).reports.reportVideo(1, 'Violence'));
    expect(reportFailureOf(error)).toBe(expected);
  });

  it('maps a request without a response to network', () => {
    expect(reportFailureOf(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe('network');
  });
});
