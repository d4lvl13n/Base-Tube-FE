import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HardDrive, 
  Database,
  AlertCircle,
  RefreshCw,
  Cpu,
  Activity
} from 'lucide-react';
import { monitoringApi, SystemHealthStatus } from '../api/monitoring';
import { styles } from './styles';
import { HealthCard, StatusIndicator, MetricCard } from './component';
import { PerformanceDashboard } from './components/PerformanceDashboard';

interface SystemHealthProps {
  refreshInterval?: number;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ refreshInterval = 30000 }) => {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealthData = async () => {
    try {
      setIsRefreshing(true);
      const data = await monitoringApi.getAllHealthMetrics();
      setHealthStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch health status');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-[#fa7517]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div className={styles.header.wrapper}>
        <div>
          <h1 className={styles.header.title}>System Health</h1>
          <p className={styles.header.subtitle}>Monitor system performance and status</p>
        </div>
        <button
          onClick={fetchHealthData}
          disabled={isRefreshing}
          className={styles.refreshButton(isRefreshing)}
        >
          <RefreshCw className={`w-5 h-5 text-[#fa7517] ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      <div className={styles.grid}>
        {/* Storage Status */}
        <HealthCard title="Storage Status" icon={HardDrive}>
          <div className="space-y-3">
            <StatusIndicator status={healthStatus?.storage.status === 'healthy' ? 'healthy' : 'unhealthy'} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              {Object.entries(healthStatus?.storage.details || {}).map(([key, value]) => (
                key !== 'timestamp' && (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-gray-300 capitalize">{key}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </HealthCard>

        {/* New Performance Dashboard */}
        <div className="col-span-2">
          <HealthCard title="Queue Performance" icon={Activity}>
            {healthStatus?.queuePerformance && (
              <PerformanceDashboard 
                performance={healthStatus.queuePerformance.metrics} 
              />
            )}
          </HealthCard>
        </div>

        {/* Enhanced FFmpeg Section */}
        <HealthCard title="FFmpeg Performance" icon={Cpu}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <MetricCard 
                label="CPU Model"
                value={healthStatus?.ffmpegPerformance.metrics.systemCapabilities.cpuModel || 'N/A'}
              />
              <MetricCard 
                label="Memory"
                value={
                  healthStatus?.ffmpegPerformance.metrics.systemCapabilities.freeMemory && 
                  healthStatus?.ffmpegPerformance.metrics.systemCapabilities.totalMemory
                    ? `${healthStatus.ffmpegPerformance.metrics.systemCapabilities.freeMemory} / ${healthStatus.ffmpegPerformance.metrics.systemCapabilities.totalMemory}`
                    : 'N/A'
                }
              />
            </div>
            
            {/* Active Transcodings */}
            <div className="space-y-2">
              {healthStatus?.ffmpegPerformance.metrics.activeTranscodings.map(job => (
                <div 
                  key={job.id}
                  className="p-3 bg-gray-800/50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm text-gray-300">Video {job.videoId}</span>
                    <div className="text-xs text-gray-400">
                      Duration: {job.duration || 0}s
                    </div>
                  </div>
                  <span className="text-[#fa7517]">{job.progress || 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </HealthCard>

        {/* Database Metrics */}
        <HealthCard title="Database Metrics" icon={Database}>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(healthStatus?.database_metrics.metrics || {}).map(([key, value]) => (
              <MetricCard 
                key={key}
                label={key.replace(/_/g, ' ')}
                value={value || 0}
              />
            ))}
          </div>
        </HealthCard>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={styles.error}
        >
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className={styles.errorText}>{error}</p>
        </motion.div>
      )}
    </div>
  );
};