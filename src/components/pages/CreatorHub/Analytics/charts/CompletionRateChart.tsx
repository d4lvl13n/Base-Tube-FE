import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CompletionRateChartProps {
  data?: {
    short: number;
    medium: number;
    long: number;
  };
}

export const CompletionRateChart: React.FC<CompletionRateChartProps> = ({ data }) => {
  if (!data) return null;

  const chartData = [
    { name: 'Short (<5m)', rate: data.short },
    { name: 'Medium (5-20m)', rate: data.medium },
    { name: 'Long (>20m)', rate: data.long },
  ];

  return (
    <div className="h-[300px] w-full bg-black/50 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis 
            dataKey="name" 
            stroke="#666"
            tick={{ fill: '#666' }}
          />
          <YAxis 
            stroke="#666"
            tick={{ fill: '#666' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [`${value}%`, 'Completion Rate']}
          />
          <Bar 
            dataKey="rate" 
            fill="#fa7517" 
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};