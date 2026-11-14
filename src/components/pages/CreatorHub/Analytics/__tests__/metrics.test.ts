import { formatWatchTime,
  DURATION_BUCKET_LABELS,
  DURATION_BUCKET_ORDER,
  accurateSinceNote,
  appliedPeriodLabel,
  bucketKeys,
  engagementGranularity,
  fillSeries,
  formatCalendarDate,
  formatDateKey,
  formatDuration,
  formatPercent,
  growthGranularity,
  MIN_VIEWS_FOR_RATE,
  commentsAnsweredView,
  countryLabel,
  interactionRateView,
  isVisibleComment,
  viewCountingText,
  weekdayLabel,
  joinNotes,
  mergeGrowthSeries,
  pageWatchAverages,
  percentOf,
  periodComparisonCaption,
  previousWindowText,
  readCount,
  sumCounts,
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

describe('interactionRateView — one honest display everywhere', () => {
  it('shows the two counts and no rate below 100 views, never altering them', () => {
    // Production, Nov 2026: 25 interactions on 19 views would read "131.6%".
    const view = interactionRateView(25, 19);
    expect(view.rate).toBeNull();
    expect(view.valueText).toBe('Too few views for a rate');
    expect(view.countsText).toBe('25 likes + comments · 19 views');
    expect(view.noRateNote).toBe('A rate is shown from 100 views in the period');
    expect(view.interactions).toBe(25);
    expect(view.views).toBe(19);
  });

  it('shows the real rate from 100 views, uncapped', () => {
    expect(MIN_VIEWS_FOR_RATE).toBe(100);
    expect(interactionRateView(42, 200)).toMatchObject({ rate: 21, valueText: '21.0%', noRateNote: null });
    expect(interactionRateView(150, 100)).toMatchObject({ rate: 150, valueText: '150.0%' });
    expect(interactionRateView(1234, 5000).countsText).toBe('1,234 likes + comments · 5,000 views');
  });

  it('never shows Infinity, NaN or a rate with no views', () => {
    const none = interactionRateView(42, 0);
    expect(none.rate).toBeNull();
    expect(none.countsText).toBe('42 likes + comments · 0 views');
    expect(interactionRateView(undefined, undefined).countsText).toBe('0 likes + comments · 0 views');
    expect(interactionRateView(NaN, 1).countsText).toBe('0 likes + comments · 1 view');
  });
});

describe('view rule, weekdays, countries, replies', () => {
  it('states the server rule, and says own views count when the server sentence does not', () => {
    const server = "A view counts after 30 seconds of playback. Your own views count like any other viewer's.";
    expect(viewCountingText({ summary: server })).toBe(server);
    expect(viewCountingText({ summary: 'A view counts after 30 seconds.' })).toBe(
      "A view counts after 30 seconds. Your own views count like any viewer's."
    );
    expect(viewCountingText(undefined)).toMatch(/Your own views count like any viewer's\.$/);
  });

  it('reads MySQL DAYOFWEEK (1 = Sunday)', () => {
    expect(weekdayLabel(1)).toBe('Sunday');
    expect(weekdayLabel(2)).toBe('Monday');
    expect(weekdayLabel(7)).toBe('Saturday');
    expect(weekdayLabel(0)).toBe('Unknown day');
  });

  it('names an unresolved country "Unknown"', () => {
    expect(countryLabel({ country: 'Unknown', countryCode: 'ZZ' })).toBe('Unknown');
    expect(countryLabel({ country: 'France', countryCode: 'FR' })).toBe('France');
    expect(countryLabel({ country: '', countryCode: 'fr' })).toBe('FR');
  });

  it('describes replies to comments from others, and no rate without any', () => {
    expect(
      commentsAnsweredView({ commentsFromOthers: 5, commentsAnswered: 3, responseRate: 60, averageResponseTime: 2.5, windowDays: 30 })
    ).toEqual({
      valueText: '60.0%',
      caption: 'You replied to 3 of 5 comments from others, last 30 days',
      note: 'Average time to your first reply: 2.5 h'
    });
    expect(
      commentsAnsweredView({ commentsFromOthers: 4, commentsAnswered: 1, responseRate: 25, averageResponseTime: 0.25, windowDays: 30 }).note
    ).toBe('Average time to your first reply: 15 min');
    expect(
      commentsAnsweredView({ commentsFromOthers: 0, commentsAnswered: 0, responseRate: 0, averageResponseTime: 0, windowDays: 30 })
    ).toEqual({ valueText: '—', caption: 'No comments from others in the last 30 days', note: null });
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

describe('formatWatchTime', () => {
  it('speaks in seconds and minutes below an hour, hours above', () => {
    expect(formatWatchTime(0, 0)).toBe('0 s');
    expect(formatWatchTime(79, 0)).toBe('1 min 19 s');
    expect(formatWatchTime(120, 0)).toBe('2 min');
    expect(formatWatchTime(5400, 1.5)).toBe('1.5 hours');
  });
  it('falls back to the rounded hours when seconds are missing', () => {
    expect(formatWatchTime(undefined, 2.3)).toBe('2.3 hours');
    expect(formatWatchTime(null, NaN)).toBe('0.0 hours');
  });
});

describe('formatDuration — one format everywhere', () => {
  it('rounds to whole seconds and writes "1 min 30 s"', () => {
    expect(formatDuration(37.3333)).toBe('37 s');
    expect(formatDuration(90)).toBe('1 min 30 s');
    expect(formatDuration(89.6)).toBe('1 min 30 s');
    expect(formatDuration(120)).toBe('2 min');
    expect(formatDuration(3600)).toBe('1 h');
    expect(formatDuration(3900)).toBe('1 h 5 min');
  });

  it('carries 59.5 minutes into the next hour instead of printing "60 min"', () => {
    expect(formatDuration(3600 + 59 * 60 + 40)).toBe('2 h');
  });

  it('is an em dash when there is nothing to show, never NaN', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
    expect(formatDuration(NaN)).toBe('—');
    expect(formatDuration(-5)).toBe('0 s');
  });
});

describe('date keys are calendar dates, not instants', () => {
  const realTz = process.env.TZ;
  afterEach(() => { process.env.TZ = realTz; });

  it('prints the key it was given, with no time-zone shift', () => {
    // new Date('2026-11-10') is UTC midnight; printed in local time west of
    // UTC it read "Nov 9". The key must come back as Nov 10 everywhere.
    expect(formatDateKey('2026-11-10')).toBe('Nov 10');
    expect(formatDateKey('2026-11-10', 'week')).toBe('Nov 10, 2026');
    expect(formatDateKey('2026-11-01', 'month')).toBe('Nov 2026');
    expect(formatDateKey('2026-01-01')).toBe('Jan 1');
  });

  it('leaves anything that is not a key alone', () => {
    expect(formatDateKey('2026-W45')).toBe('2026-W45');
    expect(formatDateKey(undefined)).toBe('');
  });

  it('formats a timestamp by its UTC calendar day', () => {
    expect(formatCalendarDate('2026-08-30')).toBe('Aug 30, 2026');
    expect(formatCalendarDate('2026-11-14T00:00:00.000Z')).toBe('Nov 14, 2026');
    expect(formatCalendarDate('later')).toBeNull();
  });
});

describe('fillSeries — missing days are zeros', () => {
  // 2026-11-12 15:00 UTC, a Thursday.
  const NOW = Date.UTC(2026, 10, 12, 15, 0, 0);

  it('covers the 8 UTC days a rolling 7-day window touches, oldest first', () => {
    const filled = fillSeries([{ date: '2026-11-10', count: 3 }], 'day', 7, NOW);
    expect(filled).toHaveLength(8);
    expect(filled[0]).toEqual({ date: '2026-11-05', count: 0 });
    expect(filled[filled.length - 1]).toEqual({ date: '2026-11-12', count: 0 });
    expect(filled.find((p) => p.date === '2026-11-10')?.count).toBe(3);
    expect(sumCounts(filled)).toBe(3);
  });

  it('accepts an already padded series without changing it', () => {
    const padded = bucketKeys([], 'day', 7, NOW).map((date, i) => ({ date, count: i }));
    expect(fillSeries(padded, 'day', 7, NOW)).toEqual(padded);
  });

  it('fills Monday-keyed weeks up to the current week on all time', () => {
    const filled = fillSeries(
      [{ date: '2026-10-19', count: 2 }, { date: '2026-11-02', count: 1 }],
      'week',
      null,
      NOW
    );
    expect(filled.map((p) => p.date)).toEqual(['2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09']);
    expect(filled.map((p) => p.count)).toEqual([2, 0, 1, 0]);
  });

  it('fills months and merges two rows of the same month', () => {
    const filled = fillSeries(
      [{ date: '2026-08-01', count: 1 }, { date: '2026-08-15', count: 2 }],
      'month',
      null,
      NOW
    );
    expect(filled).toEqual([
      { date: '2026-08-01', count: 3 },
      { date: '2026-09-01', count: 0 },
      { date: '2026-10-01', count: 0 },
      { date: '2026-11-01', count: 0 }
    ]);
  });

  it('is empty for all time with no data, and drops rows without a key', () => {
    expect(fillSeries([], 'month', null, NOW)).toEqual([]);
    expect(fillSeries([{ date: 'Point 1', count: 4 }], 'week', null, NOW)).toEqual([]);
  });
});

describe('mergeGrowthSeries — joined by date, not by position', () => {
  const NOW = Date.UTC(2026, 10, 12, 15, 0, 0);

  it('lines each value up with its own month on all time (today\'s unpadded response)', () => {
    const rows = mergeGrowthSeries(
      {
        subscribers: { data: [{ date: '2026-10-01', value: 2 }] },
        views: { data: [{ date: '2026-08-01', value: 50 }, { date: '2026-10-01', value: 70 }] },
        engagement: { data: [{ date: '2026-09-01', value: 4 }] }
      },
      'all',
      NOW
    );
    expect(rows).toEqual([
      { date: '2026-08-01', subscribers: 0, views: 50, interactions: 0 },
      { date: '2026-09-01', subscribers: 0, views: 0, interactions: 4 },
      { date: '2026-10-01', subscribers: 2, views: 70, interactions: 0 },
      { date: '2026-11-01', subscribers: 0, views: 0, interactions: 0 }
    ]);
  });

  it('still draws a channel with no subscribers at all', () => {
    const rows = mergeGrowthSeries(
      {
        subscribers: { data: [] },
        views: { data: [{ date: '2026-11-01', value: 9 }] },
        engagement: { data: [] }
      },
      'all',
      NOW
    );
    expect(rows).toEqual([{ date: '2026-11-01', subscribers: 0, views: 9, interactions: 0 }]);
  });

  it('works the same with the aligned, padded response and its granularity field', () => {
    const keys = bucketKeys([], 'day', 7, NOW);
    const series = (n: number) => ({ data: keys.map((date) => ({ date, value: n })) });
    const rows = mergeGrowthSeries(
      { granularity: 'day', subscribers: series(1), views: series(5), engagement: series(2) },
      '7d',
      NOW
    );
    expect(rows).toHaveLength(8);
    expect(rows[3]).toEqual({ date: keys[3], subscribers: 1, views: 5, interactions: 2 });
  });

  it('reads the declared granularity first', () => {
    expect(growthGranularity({ granularity: 'month' }, '7d')).toBe('month');
    expect(growthGranularity({}, 'all')).toBe('month');
    expect(growthGranularity({}, '30d')).toBe('day');
    expect(engagementGranularity('week', '7d')).toBe('week');
    expect(engagementGranularity(undefined, 'all')).toBe('week');
    expect(engagementGranularity(null, '30d')).toBe('day');
  });
});

describe('period comparisons are words with raw counts', () => {
  it('writes the caption the owner asked for', () => {
    expect(periodComparisonCaption({ current: 2, previous: 0, days: 7 })).toBe(
      '+2 in the last 7 days (0 the week before)'
    );
  });

  it('never invents "+100%" from an empty earlier week', () => {
    expect(periodComparisonCaption({ current: 5, previous: 0, days: 7 })).not.toContain('%');
  });

  it('adds the percentage only when the earlier window had something', () => {
    expect(periodComparisonCaption({ current: 120, previous: 95, days: 7 })).toBe(
      '+120 in the last 7 days (95 the week before, +26%)'
    );
    expect(periodComparisonCaption({ current: 50, previous: 100, days: 30 })).toBe(
      '+50 in the last 30 days (100 the 30 days before, -50%)'
    );
    expect(periodComparisonCaption({ current: 4, previous: 4, days: 7 })).toBe(
      '+4 in the last 7 days (4 the week before, no change)'
    );
  });

  it('shows no comparison at all without the raw earlier count', () => {
    expect(periodComparisonCaption({ current: 3, previous: null, days: 7 })).toBe('+3 in the last 7 days');
    expect(periodComparisonCaption({ current: 0, days: 7 })).toBe('0 in the last 7 days');
    expect(periodComparisonCaption({ current: null, days: 7 })).toBeNull();
  });

  it('describes the earlier window on its own for a card that already shows the current one', () => {
    expect(previousWindowText({ current: 3, previous: 0, days: 7 })).toBe('0 the week before');
    expect(previousWindowText({ current: 120, previous: 95, days: 7 })).toBe('95 the week before (+26%)');
    expect(previousWindowText({ current: 3, previous: undefined, days: 7 })).toBeNull();
  });

  it('reads additive counts defensively', () => {
    expect(readCount(4)).toBe(4);
    expect(readCount('4')).toBe(4);
    expect(readCount(null)).toBeNull();
    expect(readCount(undefined)).toBeNull();
    expect(readCount('')).toBeNull();
    expect(readCount(true)).toBeNull();
    expect(readCount(NaN)).toBeNull();
  });
});

describe('pageWatchAverages — weighted by views', () => {
  it('does not let an unwatched video halve the page average', () => {
    const result = pageWatchAverages([
      { views: 100, average_percentage_viewed: 60, average_watch_duration_seconds: 90 },
      { views: 0, average_percentage_viewed: 0, average_watch_duration_seconds: 0 }
    ]);
    // The old plain mean said 30 % and 45 s.
    expect(result.avgPercentWatched).toBe(60);
    expect(result.avgWatchSeconds).toBe(90);
  });

  it('weights each video by its views', () => {
    const result = pageWatchAverages([
      { views: 300, average_percentage_viewed: 20, average_watch_duration_seconds: 30 },
      { views: 100, average_percentage_viewed: 60, average_watch_duration_seconds: 120 }
    ]);
    expect(result.avgPercentWatched).toBe(30);
    expect(result.avgWatchSeconds).toBeCloseTo(52.5, 5);
    expect(result.views).toBe(400);
  });

  it('uses the backend\'s exact per-row sums when it sends them', () => {
    const result = pageWatchAverages([
      // Rounded averages would say 33 % / 33 s; the sums say 100 / 3.
      { views: 3, average_percentage_viewed: 33, average_watch_duration_seconds: 33, percent_watched_sum: 100, watch_seconds_total: 100 },
      { views: 1, average_percentage_viewed: 50, average_watch_duration_seconds: 10 }
    ]);
    expect(result.avgPercentWatched).toBeCloseTo(150 / 4, 5);
    expect(result.avgWatchSeconds).toBeCloseTo(110 / 4, 5);
  });

  it('is null — rendered as an em dash — when no video on the page has views', () => {
    const result = pageWatchAverages([{ views: 0, average_percentage_viewed: 0, average_watch_duration_seconds: 0 }]);
    expect(result).toEqual({ avgWatchSeconds: null, avgPercentWatched: null, views: 0 });
    expect(formatPercent(result.avgPercentWatched)).toBe('—');
    expect(formatDuration(result.avgWatchSeconds)).toBe('—');
    expect(pageWatchAverages([]).avgPercentWatched).toBeNull();
  });
});

describe('like rate', () => {
  it('is an em dash with no views, not 300%', () => {
    // likes / (views || 1) printed "300.0%" for 3 likes and 0 views.
    expect(formatPercent(percentOf(3, 0))).toBe('—');
    expect(formatPercent(percentOf(3, 60))).toBe('5.0%');
  });
});

describe('top comments', () => {
  it('never shows a comment the API marks deleted or hidden', () => {
    expect(isVisibleComment({ id: 1, status: 'approved' })).toBe(true);
    expect(isVisibleComment({ id: 1, status: 'flagged' })).toBe(true);
    expect(isVisibleComment({ id: 1 })).toBe(true);
    expect(isVisibleComment({ id: 1, status: 'hidden' })).toBe(false);
    expect(isVisibleComment({ id: 1, status: 'removed' })).toBe(false);
    expect(isVisibleComment({ id: 1, status: 'DELETED' })).toBe(false);
    expect(isVisibleComment({ id: 1, deletedAt: '2026-11-01T00:00:00Z' })).toBe(false);
    expect(isVisibleComment({ id: 1, is_deleted: true })).toBe(false);
    expect(isVisibleComment({ id: 1, hidden: true })).toBe(false);
    expect(isVisibleComment(null)).toBe(false);
  });
});

describe('labels', () => {
  it('names the period a list was computed over', () => {
    expect(appliedPeriodLabel('7d')).toBe('Last 7 days');
    expect(appliedPeriodLabel('30d')).toBe('Last 30 days');
    expect(appliedPeriodLabel('90d')).toBe('Last 90 days');
    expect(appliedPeriodLabel('all')).toBe('All time');
  });

  it('says since when watch time is accurate only when the backend sends the date', () => {
    expect(accurateSinceNote('2026-08-30')).toBe('Watch time measured accurately since Aug 30, 2026.');
    expect(accurateSinceNote(undefined)).toBeNull();
  });

  it('joins optional sentences, each with a full stop', () => {
    expect(joinNotes('0 the week before', false, null, 'Includes your own replies.')).toBe(
      '0 the week before. Includes your own replies.'
    );
    expect(joinNotes(false, undefined)).toBeUndefined();
  });
});
