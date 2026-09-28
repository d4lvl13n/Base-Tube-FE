import { AxiosAdapter, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createBasetubeClient, StudioValidationFeedbackInput, StudioValidationFeedbackResult } from '../index';

const input: StudioValidationFeedbackInput = { checkCode: 'forbidden_logo', response: 'disputed' };
const result: StudioValidationFeedbackResult = { versionId: 'version-id', validationFeedback: [{ ...input, createdAt: '2026-09-26T12:00:00Z', updatedAt: '2026-09-26T12:00:00Z' }] };
function clientFor(status = 200) {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async config => {
    requests.push(config);
    const response: AxiosResponse = { status, statusText: '', config, headers: {}, data: status === 200 ? { success: true, data: result } : { success: false, error: { code: 'VALIDATION_WARNING_NOT_FOUND', message: 'Warning unavailable' } } };
    if (status !== 200) throw new AxiosError('Request failed', String(status), config, {}, response);
    return response;
  };
  return { client: createBasetubeClient({ baseUrl: 'https://api.test', adapter }), requests };
}

test('uses the versioned feedback route and unwraps the persisted server response', async () => {
  const { client, requests } = clientFor();
  await expect(client.thumbnailStudio.saveValidationFeedback('version-id', input)).resolves.toEqual(result);
  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe('patch');
  expect(requests[0].url).toBe('/api/v1/thumbnail-studio/versions/version-id/validation-feedback');
  expect(JSON.parse(requests[0].data)).toEqual(input);
  expect(requests[0].headers.get('Idempotency-Key')).toBeUndefined();
  expect(requests[0].headers.get('If-Match')).toBeUndefined();
});

test('replays only the same feedback and allows an explicit changed choice without any paid operation', async () => {
  const { client, requests } = clientFor();
  await client.thumbnailStudio.saveValidationFeedback('version-id', input);
  await client.thumbnailStudio.saveValidationFeedback('version-id', input);
  await client.thumbnailStudio.saveValidationFeedback('version-id', { ...input, response: 'confirmed' });
  expect(requests.map(value => JSON.parse(value.data).response)).toEqual(['disputed', 'disputed', 'confirmed']);
  expect(requests.every(value => value.url?.endsWith('/validation-feedback'))).toBe(true);
});

test.each([400, 404, 422, 500])('preserves %i failures for explicit UI retry, without silently retrying', async status => {
  const { client, requests } = clientFor(status);
  await expect(client.thumbnailStudio.saveValidationFeedback('version-id', input)).rejects.toMatchObject({ response: { status } });
  expect(requests).toHaveLength(1);
});

test('encodes the version identifier as a single path segment', async () => {
  const { client, requests } = clientFor();
  await client.thumbnailStudio.saveValidationFeedback('version/other?x=1', input);
  expect(requests[0].url).toContain('/versions/version%2Fother%3Fx%3D1/validation-feedback');
});
