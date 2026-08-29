import {
  DURATION_BUCKET_LABELS,
  DURATION_BUCKET_ORDER,
  formatPercent,
  interactionRate,
  sumCounts,
  trendBadgeValue,
  weightedPercentWatched
} from '../metrics';

describe('sumCounts', () => {
  it('sums the whole window instead of reading the last day', () => {
    const series = [
      { date: '2026-08-23', count: 5 },
      { date: '2026-08-24', count: 0 },
      { date: '2026-08-25', count: 3 }
    ];
    expect(sumCounts(series)).toBe(8);
    // The old getLatestCount would have returned 3 here.
    expect(sumCounts(series)).not.toBe(series[series.length - 1].count);
  });

  it('is 0 for empty / missing data and never NaN', () => {
    expect(sumCounts()).toBe(0);
    expect(sumCounts(null)).toBe(0);
    expect(sumCounts([])).toBe(0);
    expect(sumCounts([{ date: 'x', count: NaN }])).toBe(0);
  });
});

describe('weightedPercentWatched', () => {
  it('weights each bucket by its view count', () => {
    // 1,000 views at 20% and 1 view at 100% must be ~20%, not 60%.
    const result = weightedPercentWatched([
      { durationCategory: 'short', retentionRate: 20, viewCount: 1000 },
      { durationCategory: 'long', retentionRate: 100, viewCount: 1 }
    ]);
    expect(result).toBeCloseTo(20.08, 2);
  });

  it('ignores buckets with no views', () => {
    expect(
      weightedPercentWatched([
        { durationCategory: 'short', retentionRate: 50, viewCount: 10 },
        { durationCategory: 'long', retentionRate: 0, viewCount: 0 }
      ])
    ).toBe(50);
  });

  it('returns null (not 0) when nothing can be averaged', () => {
    expect(weightedPercentWatched([])).toBeNull();
    expect(weightedPercentWatched(undefined)).toBeNull();
    expect(
      weightedPercentWatched([{ durationCategory: 'short', retentionRate: 50, viewCount: 0 }])
    ).toBeNull();
  });

  it('clamps to 0..100', () => {
    const over = weightedPercentWatched([
      { durationCategory: 'short', retentionRate: 480, viewCount: 3 }
    ]);
    expect(over).toBe(100);
  });
});

describe('interactionRate', () => {
  it('is a ratio of interactions to views over the same window', () => {
    expect(interactionRate(42, 200)).toBe(21);
  });

  it('returns null instead of Infinity when there are no views', () => {
    expect(interactionRate(42, 0)).toBeNull();
    expect(interactionRate(42, undefined)).toBeNull();
    expect(interactionRate(undefined, 100)).toBeNull();
    expect(interactionRate(NaN, 100)).toBeNull();
  });
});

describe('formatPercent', () => {
  it('never emits Infinity or NaN', () => {
    expect(formatPercent(12.34)).toBe('12.3%');
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(Infinity)).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
  });
});

describe('trendBadgeValue', () => {
  it('drops zero, null and non-finite values so no badge renders', () => {
    expect(trendBadgeValue(0)).toBeUndefined();
    expect(trendBadgeValue(0.4)).toBeUndefined(); // rounds to 0
    expect(trendBadgeValue(null)).toBeUndefined();
    expect(trendBadgeValue(undefined)).toBeUndefined();
    expect(trendBadgeValue(Infinity)).toBeUndefined();
    expect(trendBadgeValue(NaN)).toBeUndefined();
  });

  it('keeps real percentages', () => {
    expect(trendBadgeValue(12.5)).toBe(13);
    expect(trendBadgeValue(-33.3)).toBe(-33);
  });
});

describe('duration buckets', () => {
  it('labels every bucket the backend can emit, with the real boundaries', () => {
    // creatorAnalyticsService: <=60s, <=300s, <=1200s, else.
    expect(DURATION_BUCKET_ORDER).toEqual(['very_short', 'short', 'medium', 'long']);
    expect(DURATION_BUCKET_LABELS.very_short).toBe('under 1 min');
    expect(DURATION_BUCKET_LABELS.short).toBe('1–5 min');
    expect(DURATION_BUCKET_LABELS.medium).toBe('5–20 min');
    expect(DURATION_BUCKET_LABELS.long).toBe('over 20 min');
    // The old copy claimed "under 3 min" for the 1-5 min bucket.
    expect(DURATION_BUCKET_LABELS.short).not.toContain('3 min');
  });
});
