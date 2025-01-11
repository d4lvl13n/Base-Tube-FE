import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { QueuePerformance } from '../../api/monitoring';
import { MetricCard } from '../component';

interface PerformanceDashboardProps {
  performance: QueuePerformance['metrics'];
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ performance }) => {
  return (
    <div className="space-y-6">
      {/* Processing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Average Processing Time"
          value={performance.performance.averageProcessingTime}
          icon={Activity}
        />
        <MetricCard
          label="Jobs Per Hour"
          value={performance.performance.jobsPerHour}
          icon={Activity}
        />
        <MetricCard
          label="Current Throughput"
          value={performance.performance.currentThroughput}
          icon={Activity}
        />
      </div>

      {/* System Load */}
      <div className="bg-black/30 rounded-xl p-4">
        <h3 className="text-lg font-medium mb-4">System Load</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="CPU Count"
            value={performance.systemLoad.cpuCount}
          />
          <MetricCard
            label="Load Average"
            value={performance.systemLoad.loadAverage}
          />
          <MetricCard
            label="System Load"
            value={performance.systemLoad.systemLoadPercentage}
          />
          <MetricCard
            label="Heap Usage"
            value={`${performance.systemLoad.memory.heapUsed}/${performance.systemLoad.memory.heapTotal}`}
          />
        </div>
      </div>

      {/* Failed Jobs */}
      <div className="bg-black/30 rounded-xl p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Recent Failures
        </h3>
        <div className="space-y-2">
          {performance.recentFailures.map(failure => (
            <div 
              key={failure.id}
              className="p-3 bg-red-500/10 rounded-lg border border-red-500/20"
            >
              <div className="flex justify-between">
                <span className="text-red-400">Job {failure.id}</span>
                <span className="text-gray-400">Attempts: {failure.attempts}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{failure.failedReason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Jobs */}
      <div className="bg-black/30 rounded-xl p-4">
        <h3 className="text-lg font-medium mb-4">Active Jobs</h3>
        <div className="space-y-2">
          {performance.activeJobs.map(job => (
            <div 
              key={job.id}
              className="p-3 bg-gray-800/50 rounded-lg"
            >
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Job {job.id}</span>
                <span className="text-[#fa7517]">{job.progress}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#fa7517] transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 mt-1">
                Duration: {job.duration}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 