import { ctrApi } from '../ctr';
import { thumbnailApi } from '../thumbnail';
import api from '../index';
jest.mock('../index', () => ({ __esModule: true, default: { post: jest.fn() } }));
const post = api.post as jest.Mock;
const brief = { title: 'My camera', description: 'A test', creatorHook: 'Best in my test' };
beforeEach(() => { post.mockReset(); post.mockResolvedValue({ data: { success: true, data: { thumbnailUrl: 'final', concepts: [] } } }); });
it('serializes the text brief separately from the intentional subject photo for creator uploads', async () => {
  const photo = new File(['PHOTO'], 'photo.png', { type: 'image/png' });
  await thumbnailApi.generateThumbnailWithReference({ referenceImage: photo, creatorBrief: brief, distinctConcepts: true });
  const form = post.mock.calls[0][1] as FormData;
  expect(JSON.parse(String(form.get('creatorBrief')))).toEqual(brief);
  expect(form.get('referenceImage')).toBe(photo);
  expect(form.has('videoFile')).toBe(false);
});
it('serializes the same brief in standalone generation with a subject photo', async () => {
  await ctrApi.generateThumbnails({ title: brief.title, creatorBrief: brief, subjectReference: new File(['PHOTO'], 'photo.png', { type: 'image/png' }) });
  const form = post.mock.calls[0][1] as FormData;
  expect(JSON.parse(String(form.get('creatorBrief')))).toEqual(brief);
  expect(form.has('subjectReference')).toBe(true);
});
it('sends only a stable base ID and bounded rendering settings for final adjustments', async () => {
  const editing = { baseThumbnailId: 7, baseImageUrl: 'https://expired.example/base', textPlan: { headline: 'Exact Words', zone: 'bottom' as const }, textStyle: { font: 'DejaVu Sans' as const, color: '#FFFFFF', fontScale: 1, stroke: true } };
  await ctrApi.applyFinalAdjustments(editing);
  expect(post).toHaveBeenCalledWith('/api/v1/ctr/overlay', { baseThumbnailId: 7, textPlan: editing.textPlan, textStyle: editing.textStyle });
  expect(JSON.stringify(post.mock.calls[0])).not.toContain('expired');
});
