import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface WatchTimeChartProps {
  /** View counts per hour of the day, bucketed by the backend in UTC. */
  data?: { hour: number; viewCount: number }[];
}

const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/**
 * Views by hour of day, UTC. (Its titles used to say "Watch Time
 * Distribution", but it plots view COUNTS, not time watched.)
 */
export const WatchTimeChart: React.FC<WatchTimeChartProps> = ({ data = [] }) => {
  const formattedData = data?.map(item => ({
    ...item,
    hour: hourLabel(item.hour),
  }));

  return (
    <div className="h-[300px] w-full bg-black/50 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData}>
          <XAxis dataKey="hour" stroke="#666" />
          <YAxis stroke="#666" allowDecimals={false} />
          <Tooltip
            labelFormatter={(label) => `${label} UTC`}
            formatter={(value) => [Number(value).toLocaleString(), 'Views']}
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="viewCount" name="Views" fill="#fa7517" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
