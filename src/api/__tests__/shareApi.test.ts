import { recordShareAction } from '../shareApi';
import api from '../index';

jest.mock('../index', () => ({ __esModule: true, default: { post: jest.fn() } }));
const post = api.post as jest.Mock;

beforeEach(() => post.mockReset());

const httpError = (status: number) => Object.assign(new Error(String(status)), { response: { status } });

it('records one share per completed action, with its platform (201)', async () => {
  post.mockResolvedValue({ status: 201, data: { success: true, data: { id: 9, deduplicated: false } } });
  await expect(recordShareAction('42', 'copy_link')).resolves.toBe('recorded');
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith('/api/v1/videos/42/share', { platform: 'copy_link' });
});

it('reports a repeat within 30 minutes as deduplicated (200)', async () => {
  post.mockResolvedValue({ status: 200, data: { success: true, data: { id: null, deduplicated: true } } });
  await expect(recordShareAction('42', 'linkedin')).resolves.toBe('deduplicated');
});

it('reports the rate limit (429) and never retries anything', async () => {
  post.mockRejectedValue(httpError(429));
  await expect(recordShareAction('42', 'x')).resolves.toBe('rate_limited');
  expect(post).toHaveBeenCalledTimes(1);
  post.mockReset().mockRejectedValue(httpError(500));
  await expect(recordShareAction('42', 'facebook')).resolves.toBe('failed');
  post.mockReset().mockRejectedValue(httpError(400));
  await expect(recordShareAction('42', 'email')).resolves.toBe('failed');
  expect(post).toHaveBeenCalledTimes(1);
});

it('only ever sends a platform the backend stores', async () => {
  post.mockResolvedValue({ data: { success: true, data: { deduplicated: false } } });
  await recordShareAction('42', 'twitter' as never);
  expect(post.mock.calls[0][1]).toEqual({ platform: 'other' });
});

it('never throws and sends nothing without a video id', async () => {
  post.mockRejectedValue(new Error('network'));
  await expect(recordShareAction('42', 'native')).resolves.toBe('failed');
  post.mockReset();
  await expect(recordShareAction(undefined, 'native')).resolves.toBeNull();
  await recordShareAction('', 'native');
  expect(post).not.toHaveBeenCalled();
});
