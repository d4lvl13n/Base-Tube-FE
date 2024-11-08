import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface EngagementMetrics {
  date: string;
  comments: number;
  replies: number;
  responseRate: number;
}

interface EngagementChartProps {
  data?: EngagementMetrics[];
  loading?: boolean;
}

export const EngagementChart: React.FC<EngagementChartProps> = ({ 
  data = [], 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="h-[300px] bg-black/50 rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="h-[300px] bg-black/50 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#000',
              border: '1px solid #333',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="comments" 
            stroke="#fa7517" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="replies" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="responseRate" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};