// src/components/common/CreatorHub/StatsCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  change: number;
  loading?: boolean;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, change, loading = false, subtitle }) => {
  return (
    <div className="bg-black/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className="text-[#fa7517]" />
        <div className={`px-2 py-1 rounded ${change >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {change > 0 ? '+' : ''}{change}%
        </div>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      {loading ? (
        <div className="h-8 bg-gray-700 animate-pulse rounded" />
      ) : (
        <>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
};

export default StatsCard;