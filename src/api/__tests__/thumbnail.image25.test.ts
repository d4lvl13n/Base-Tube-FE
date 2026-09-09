import api from '../index';
import { thumbnailApi } from '../thumbnail';

jest.mock('../index', () => ({ __esModule: true, default: { post: jest.fn() } }));

const options = { model: 'gpt-image-2.5-flare' as const, quality: 'max' as const, size: '2048x1152' as const, background: 'transparent' as const, outputFormat: 'webp' as const, outputCompression: 0 };

beforeEach(() => {
  jest.clearAllMocks();
  (api.post as jest.Mock).mockResolvedValue({ data: { success: true, data: {} } });
});

it('passes new settings through video generation without changing the endpoint', async () => {
  await thumbnailApi.generateThumbnailForVideo(42, options);
  expect(api.post).toHaveBeenCalledWith('/api/v1/thumbnails/videos/42/thumbnail/generate', options, expect.any(Object));
});

it('passes new settings through reference uploads, including zero compression', async () => {
  await thumbnailApi.generateThumbnailWithReference({ ...options, referenceImage: new File(['image'], 'ref.png', { type: 'image/png' }) });
  const form = (api.post as jest.Mock).mock.calls[0][1] as FormData;
  Object.entries(options).forEach(([key, value]) => expect(form.get(key)).toBe(String(value)));
});

it.each([false, true])('passes settings through conversational refinement (upload=%s)', async upload => {
  await thumbnailApi.refineThumbnailConversationally({ ...options, instruction: 'Change only the background', thumbnailId: 42, ...(upload ? { image: new File(['image'], 'ref.png', { type: 'image/png' }) } : {}) });
  const payload = (api.post as jest.Mock).mock.calls[0][1];
  Object.entries(options).forEach(([key, value]) => {
    expect(upload ? payload.get(key) : payload[key]).toBe(upload ? String(value) : value);
  });
});
