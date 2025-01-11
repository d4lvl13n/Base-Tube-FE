import React from 'react';
import { AlertOctagon, AlertTriangle, Clock } from 'lucide-react';
import { QueuePerformance } from '../../api/monitoring';
import { MetricCard } from '../component';

interface ErrorTrackingProps {
  performance: QueuePerformance['metrics'];
}

const ErrorTracking: React.FC<ErrorTrackingProps> = ({ performance }) => {
  const failuresByType = performance.recentFailures.reduce((acc, failure) => {
    const type = failure.failedReason.includes('timeout') ? 'Timeout' :
                failure.failedReason.includes('memory') ? 'Memory' : 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total Failed Jobs"
          value={performance.jobCounts.failed}
          icon={AlertOctagon}
          trend={performance.jobCounts.failed > 10 ? 'negative' : 'neutral'}
        />
        <MetricCard
          label="Stuck Jobs"
          value={performance.issues.stuckJobs.length}
          icon={Clock}
          trend={performance.issues.stuckJobs.length > 0 ? 'negative' : 'positive'}
        />
        <MetricCard
          label="Recent Failures"
          value={performance.recentFailures.length}
          icon={AlertTriangle}
          trend={performance.recentFailures.length > 5 ? 'negative' : 'neutral'}
        />
      </div>

      {/* Error Types Breakdown */}
      <div className="bg-black/30 rounded-xl p-4">
        <h3 className="text-lg font-medium mb-4">Error Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(failuresByType).map(([type, count]) => (
            <div 
              key={type}
              className="p-3 bg-red-500/10 rounded-lg border border-red-500/20"
            >
              <div className="text-sm text-gray-400">{type}</div>
              <div className="text-xl font-semibold text-red-400">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Failures Timeline */}
      <div className="bg-black/30 rounded-xl p-4">
        <h3 className="text-lg font-medium mb-4">Recent Failures</h3>
        <div className="space-y-3">
          {performance.recentFailures.map((failure, index) => (
            <div 
              key={`${failure.id}-${index}`}
              className="p-3 bg-red-500/10 rounded-lg border border-red-500/20"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-red-400 font-medium">Job {failure.id}</span>
                  <p className="text-sm text-gray-400 mt-1">{failure.failedReason}</p>
                </div>
                <span className="text-sm text-gray-500">
                  Attempts: {failure.attempts}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ErrorTracking; 