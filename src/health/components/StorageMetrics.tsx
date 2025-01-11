import React from 'react';
import { HardDrive, Image, Video } from 'lucide-react';
import { StorageMetrics as StorageMetricsType } from '../../api/monitoring';
import { MetricCard } from '../component';

interface StorageMetricsProps {
  metrics: StorageMetricsType['metrics'];
}

const formatSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const StorageMetrics: React.FC<StorageMetricsProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* Storage Types */}
      {Object.entries(metrics).map(([type, data]) => (
        <div key={type} className="bg-black/30 rounded-xl p-4">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            {type === 'video' && <Video className="w-5 h-5 text-[#fa7517]" />}
            {type === 'thumbnail' && <Image className="w-5 h-5 text-[#fa7517]" />}
            {type === 'image' && <HardDrive className="w-5 h-5 text-[#fa7517]" />}
            <span className="capitalize">{type} Storage</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Object Count"
              value={data.objectCount.toLocaleString()}
            />
            <MetricCard
              label="Total Size"
              value={formatSize(data.totalSize)}
            />
            <MetricCard
              label="Last Modified"
              value={formatDate(data.lastModified)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}; 