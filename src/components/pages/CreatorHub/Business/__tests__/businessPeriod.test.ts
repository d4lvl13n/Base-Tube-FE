import {
  addDays,
  customRangeError,
  daysInclusive,
  formatDay,
  isValidDay,
  periodLabel,
  pointName,
  pointTick,
  resolvePeriod,
  utcToday,
} from '../businessPeriod';

// 23:30 in New York on 11 Nov is already 12 Nov in UTC: periods follow UTC.
const NOW = new Date('2026-11-12T04:30:00Z');

describe('UTC days', () => {
  it('reads today in UTC, not in the local time zone', () => {
    expect(utcToday(NOW)).toBe('2026-11-12');
    expect(utcToday(new Date('2026-11-11T23:59:59.999Z'))).toBe('2026-11-11');
  });

  it('accepts real calendar days only', () => {
    expect(isValidDay('2026-02-28')).toBe(true);
    expect(isValidDay('2028-02-29')).toBe(true);
    expect(isValidDay('2026-02-29')).toBe(false);
    expect(isValidDay('2026-13-01')).toBe(false);
    expect(isValidDay('2026-1-01')).toBe(false);
    expect(isValidDay('')).toBe(false);
    expect(isValidDay(null)).toBe(false);
  });

  it('adds days across months, years and leap days', () => {
    expect(addDays('2026-11-12', -29)).toBe('2026-10-14');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(daysInclusive('2026-11-12', '2026-11-12')).toBe(1);
    expect(daysInclusive('2026-10-14', '2026-11-12')).toBe(30);
  });
});

describe('resolvePeriod', () => {
  it('turns each preset into the days it covers, ending today (UTC)', () => {
    expect(resolvePeriod({ preset: '7d' }, NOW)).toMatchObject({ from: '2026-11-06', to: '2026-11-12', days: 7, comparisonLabel: 'previous 7 days' });
    expect(resolvePeriod({ preset: '30d' }, NOW)).toMatchObject({ from: '2026-10-14', to: '2026-11-12', days: 30 });
    expect(resolvePeriod({ preset: '90d' }, NOW)).toMatchObject({ from: '2026-08-15', days: 90 });
    expect(resolvePeriod({ preset: '12m' }, NOW)).toMatchObject({ from: '2025-11-13', days: 365, comparisonLabel: 'previous 12 months' });
  });

  it('leaves "all time" to the API (range=all): no days of its own, no comparison', () => {
    expect(resolvePeriod({ preset: 'all' }, NOW)).toEqual({ preset: 'all', from: null, to: null, days: null, comparisonLabel: null, error: null });
  });

  it('defaults to the last 30 days', () => {
    expect(resolvePeriod({}, NOW).preset).toBe('30d');
    expect(resolvePeriod({ preset: null }, NOW).days).toBe(30);
  });

  it('keeps a valid custom range and compares it with the same number of days before', () => {
    expect(resolvePeriod({ preset: 'custom', from: '2026-11-01', to: '2026-11-10' }, NOW)).toEqual({
      preset: 'custom',
      from: '2026-11-01',
      to: '2026-11-10',
      days: 10,
      comparisonLabel: 'previous 10 days',
      error: null,
    });
    expect(resolvePeriod({ preset: 'custom', from: '2026-11-01', to: '2026-11-01' }, NOW).comparisonLabel).toBe('previous 1 day');
  });

  it('falls back to the default and says why when the custom range cannot be used', () => {
    const bad = resolvePeriod({ preset: 'custom', from: '2026-11-10', to: '2026-11-01' }, NOW);
    expect(bad).toMatchObject({ preset: '30d', days: 30, error: 'The start day is after the end day.' });
    expect(resolvePeriod({ preset: 'custom', from: null, to: '2026-11-01' }, NOW).error).toBe('Pick a start day and an end day.');
  });
});

describe('customRangeError', () => {
  it('allows tomorrow (a viewer ahead of UTC) but not later', () => {
    expect(customRangeError('2026-11-01', '2026-11-13', '2026-11-12')).toBeNull();
    expect(customRangeError('2026-11-01', '2026-11-14', '2026-11-12')).toBe('The end day is in the future.');
  });

  it('accepts up to 3,660 days (10 years), like the API', () => {
    expect(customRangeError('2016-11-05', '2026-11-12', '2026-11-12')).toBeNull();
    expect(customRangeError('2016-11-04', '2026-11-12', '2026-11-12')).toBe(
      'That is 3,661 days. The longest custom range is 3,660 days (10 years); for everything, choose All time.',
    );
  });
});

describe('labels', () => {
  it('writes a UTC day without shifting it to the local time zone', () => {
    expect(formatDay('2026-11-01', 'en-GB')).toBe('1 Nov 2026');
    expect(formatDay('2026-11-01', 'en-GB', false)).toBe('1 Nov');
    expect(formatDay('not a day', 'en-GB')).toBe('not a day');
  });

  it('names the period', () => {
    expect(periodLabel(resolvePeriod({ preset: '30d' }, NOW), 'en-GB')).toBe('Last 30 days');
    expect(periodLabel(resolvePeriod({ preset: 'all' }, NOW), 'en-GB')).toBe('All time');
    expect(periodLabel(resolvePeriod({ preset: 'all' }, NOW), 'en-GB', '2024-03-05')).toBe('All time (since 5 Mar 2024)');
    expect(periodLabel(resolvePeriod({ preset: 'custom', from: '2026-11-01', to: '2026-11-10' }, NOW), 'en-GB')).toBe(
      '1 Nov 2026 – 10 Nov 2026',
    );
    expect(periodLabel(resolvePeriod({ preset: 'custom', from: '2026-11-01', to: '2026-11-01' }, NOW), 'en-GB')).toBe('1 Nov 2026');
  });
});

describe('chart points', () => {
  it('labels a point by its size', () => {
    expect(pointTick('2026-11-12', 'day', 'en-GB')).toBe('12 Nov');
    expect(pointTick('2026-11-09', 'week', 'en-GB')).toBe('Week of 9 Nov');
    expect(pointTick('2026-11-01', 'month', 'en-GB')).toBe('Nov 2026');
  });

  it('names the days a point counts, including a week or month cut by the period', () => {
    expect(pointName('2026-11-12', '2026-11-12', 'day', 'en-GB')).toBe('12 Nov 2026');
    expect(pointName('2026-11-09', '2026-11-15', 'week', 'en-GB')).toBe('Week of 9 Nov 2026 (9 Nov – 15 Nov)');
    expect(pointName('2026-11-01', '2026-11-12', 'month', 'en-GB')).toBe('November 2026 (1 Nov – 12 Nov)');
  });
});
