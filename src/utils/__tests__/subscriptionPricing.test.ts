import { thumbnailAllowanceText, creditUsageText } from '../subscriptionPricing';

it('uses the current generation price, rounds down and keeps the maximum distinct from a mixed workflow', () => {
  expect(thumbnailAllowanceText(540, 15)).toBe('Up to 36 AI thumbnails per month');
  expect(thumbnailAllowanceText(1800, 15)).toBe('Up to 120 AI thumbnails per month');
  expect(thumbnailAllowanceText(4500, 15)).toBe('Up to 300 AI thumbnails per month');
  expect(thumbnailAllowanceText(540, 20)).toBe('Up to 27 AI thumbnails per month');
  expect(thumbnailAllowanceText(539, 15)).toBe('Up to 35 AI thumbnails per month');
  expect(thumbnailAllowanceText(0, 15)).toBe('Up to 0 AI thumbnails per month');
  expect(thumbnailAllowanceText(15, 15)).toBe('Up to 1 AI thumbnail per month');
  expect(thumbnailAllowanceText(540, 0)).toBe('540 shared credits per month');
  expect(creditUsageText({ conceptCredits: 20, editCredits: 25, auditCredits: 3 })).toBe('Generation: 20 credits · AI edit: 25 credits · Thumbnail review: from 3 credits.');
});
