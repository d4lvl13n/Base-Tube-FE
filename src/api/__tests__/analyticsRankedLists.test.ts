import { getTopLikedContent, toRankedList } from '../analytics';
import api from '../index';

jest.mock('../index', () => ({ __esModule: true, default: { get: jest.fn() } }));
const get = api.get as jest.Mock;

beforeEach(() => get.mockReset());

it('sends the selected period and reads the period the backend applied', async () => {
  get.mockResolvedValue({ data: { success: true, data: [{ id: '1' }], period: '7d' } });
  await expect(getTopLikedContent('5', 5, '7d')).resolves.toEqual({
    items: [{ id: '1' }],
    appliedPeriod: '7d'
  });
  expect(get).toHaveBeenCalledWith('/api/v1/creators/channels/5/content/top-liked', {
    params: { limit: 5, period: '7d' }
  });
});

it('accepts every period the backend can apply, 90 days included', () => {
  for (const period of ['7d', '30d', '90d', 'all'] as const) {
    expect(toRankedList({ success: true, data: [], period }).appliedPeriod).toBe(period);
  }
});

it('refuses a response without a list or a known period instead of labelling it', () => {
  expect(() => toRankedList({ success: true, data: [], period: 'last7' as never })).toThrow();
  expect(() => toRankedList({ success: true, data: null as never, period: 'all' })).toThrow();
});
