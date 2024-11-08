import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface WatchTimeChartProps {
  data?: { hour: number; viewCount: number }[];
}

export const WatchTimeChart: React.FC<WatchTimeChartProps> = ({ data = [] }) => {
  const formattedData = data?.map(item => ({
    ...item,
    hour: `${item.hour}:00`,
  }));

  return (
    <div className="h-[300px] w-full bg-black/50 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData}>
          <XAxis dataKey="hour" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="viewCount" fill="#fa7517" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};