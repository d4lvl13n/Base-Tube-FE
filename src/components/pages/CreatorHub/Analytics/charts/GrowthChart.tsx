import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  formatDateKey,
  growthGranularity,
  mergeGrowthSeries,
  type GrowthMetricsInput,
  type GrowthRow
} from '../metrics';

interface GrowthChartProps {
  data?: GrowthMetricsInput | null;
  period: '7d' | '30d' | 'all';
}

const SERIES: Array<{ key: keyof Omit<GrowthRow, 'date'>; label: string; color: string }> = [
  { key: 'subscribers', label: 'New subscribers', color: '#fa7517' },
  { key: 'views', label: 'Views', color: '#4ade80' },
  { key: 'interactions', label: 'Likes + comments', color: '#60a5fa' }
];

/**
 * Growth Trends as three small charts on one shared date axis.
 *
 * Subscribers, views and interactions live on very different scales (a few
 * subscribers next to hundreds of views), so one shared y-axis flattened the
 * small series to a line on the floor. Each chart has its own axis and says
 * what it counts; the rows are joined by date key (see mergeGrowthSeries).
 */
export const GrowthChart: React.FC<GrowthChartProps> = ({ data, period }) => {
  const granularity = growthGranularity(data, period);
  const rows = useMemo(() => mergeGrowthSeries(data, period), [data, period]);
  const per = granularity === 'month' ? 'per month' : 'per day';
  const tickFormatter = (key: string) => formatDateKey(key, granularity);

  if (rows.length === 0) {
    return (
      <div className="w-full bg-black/50 rounded-xl p-4 text-sm text-gray-400">
        No activity yet for this period.
      </div>
    );
  }

  return (
    <div className="w-full bg-black/50 rounded-xl p-4 space-y-4">
      <p className="text-xs text-gray-500">
        Each chart has its own scale. Days and months are UTC calendar days and months.
      </p>
      {SERIES.map((series) => (
        <div key={series.key}>
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: series.color }}
            />
            {series.label} {per}
          </div>
          <div className="h-[110px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tick={{ fill: '#666', fontSize: 11 }}
                  tickFormatter={tickFormatter}
                  minTickGap={16}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fill: '#666', fontSize: 11 }}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip
                  labelFormatter={(key) => formatDateKey(String(key), granularity)}
                  formatter={(value) => [Number(value).toLocaleString(), `${series.label} ${per}`]}
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={rows.length <= 31}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
};
