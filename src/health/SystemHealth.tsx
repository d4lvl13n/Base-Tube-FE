import React, { useState, useEffect } from 'react';
import { monitoringApi, SystemHealthStatus } from '../api/monitoring';
import { motion } from 'framer-motion';
import { 
  HardDrive, 
  Video, 
  ListCheck,
  Database,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { formatDuration } from '../utils/format';

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

  const HealthCard = ({ title, icon: Icon, children }: { 
    title: string; 
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
    >
      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#fa7517]" />
        {title}
      </h3>
      {children}
    </motion.div>
  );

  const StatusIndicator = ({ status }: { status: 'healthy' | 'unhealthy' }) => (
    <div className={`flex items-center gap-2 ${status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
      {status === 'healthy' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span className="capitalize">{status}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <motion.div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            System Health
          </h1>
          <p className="text-gray-400 mt-2">Monitor system performance and status</p>
        </div>
        <button
          onClick={fetchHealthData}
          disabled={isRefreshing}
          className={`p-2 rounded-lg hover:bg-gray-800/50 transition-colors ${
            isRefreshing ? 'opacity-50' : ''
          }`}
        >
          <RefreshCw className={`w-5 h-5 text-[#fa7517] ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Video Processing */}
        <HealthCard title="Video Processing" icon={Video}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-900/50">
                <div className="text-sm text-gray-400">Active Jobs</div>
                <div className="text-2xl font-semibold text-white">
                  {healthStatus?.videoProcessing.metrics.activeJobs}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-900/50">
                <div className="text-sm text-gray-400">Oldest Job Age</div>
                <div className="text-2xl font-semibold text-white">
                  {formatDuration(healthStatus?.videoProcessing.metrics.oldestJobAge)}
                </div>
              </div>
            </div>
          </div>
        </HealthCard>

        {/* Queue Status */}
        <HealthCard title="Queue Status" icon={ListCheck}>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(healthStatus?.queue.metrics || {}).map(([key, value]) => (
              key !== 'oldestStuckJobAge' && (
                <div key={key} className="p-4 rounded-lg bg-gray-900/50">
                  <div className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="text-2xl font-semibold text-white">{value}</div>
                </div>
              )
            ))}
          </div>
        </HealthCard>

        {/* Database Metrics */}
        <HealthCard title="Database Metrics" icon={Database}>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(healthStatus?.database_metrics.metrics || {}).map(([key, value]) => (
              <div key={key} className="p-4 rounded-lg bg-gray-900/50">
                <div className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</div>
                <div className="text-2xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </HealthCard>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </motion.div>
      )}
    </div>
  );
};