import React from 'react';
import { Line } from 'react-chartjs-2';

interface InteractionChartProps {
  data?: Array<{ date: string; value: number }>;
  loading?: boolean;
}

export const InteractionChart: React.FC<InteractionChartProps> = ({ data = [], loading = false }) => {
  if (loading) {
    return <div className="animate-pulse bg-black/50 rounded-xl p-4 h-48" />;
  }

  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Engagement',
        data: data.map(item => item.value),
        borderColor: '#fa7517',
        tension: 0.4,
      }
    ]
  };

  return (
    <div className="bg-black/50 rounded-xl p-4">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};