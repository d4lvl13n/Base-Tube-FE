import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface LineChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKey,
  color = '#fa7517'
}) => {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey={xKey}
            stroke="#666"
            tick={{ fill: '#666' }}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: '#666' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color }}
            activeDot={{ r: 8 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};