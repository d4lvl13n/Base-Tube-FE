import api from '../../api/index';
import { ctrApi } from '../../api/ctr';
jest.mock('../../api/index', () => ({ __esModule: true, default: { post: jest.fn() } }));
const post = api.post as jest.Mock;
beforeEach(() => { jest.clearAllMocks(); post.mockResolvedValue({ data: { success: true, data: { concepts: [] } } }); });
it('sends only the chosen subject image and generation controls as authenticated multipart', async () => {
  const subject = new File(['frame'], 'frame.jpg', { type: 'image/jpeg' });
  await ctrApi.generateThumbnails({ title: 'My camera', subjectReference: subject, concepts: 3, includeFace: false, quality: 'high' });
  const [url, form, config] = post.mock.calls[0];
  expect(url).toBe('/api/v1/ctr/generate');
  expect(form).toBeInstanceOf(FormData);
  expect(form.get('subjectReference')).toBe(subject);
  expect(form.get('concepts')).toBe('3');
  expect(form.get('includeFace')).toBe('false');
  expect(form.has('video')).toBe(false);
  expect(config.timeout).toBe(300000);
});
it('preserves JSON requests when no subject is selected', async () => {
  const request = { title: 'Camera', concepts: 3 };
  await ctrApi.generateThumbnails(request);
  expect(post.mock.calls[0][1]).toBe(request);
});
