import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface GrowthChartProps {
  data?: {
    subscribers: { data: Array<{ date: string; value: number }> };
    views: { data: Array<{ date: string; value: number }> };
    engagement: { data: Array<{ date: string; value: number }> };
  };
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ data }) => {
  const combinedData = data?.subscribers.data.map((item, index) => ({
    date: item.date,
    subscribers: item.value,
    views: data.views.data[index]?.value,
    engagement: data.engagement.data[index]?.value,
  }));

  return (
    <div className="h-[300px] w-full bg-black/50 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedData}>
          <XAxis dataKey="date" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <Line type="monotone" dataKey="subscribers" stroke="#fa7517" />
          <Line type="monotone" dataKey="views" stroke="#4ade80" />
          <Line type="monotone" dataKey="engagement" stroke="#60a5fa" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 