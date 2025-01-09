import api from './index';

export interface StorageHealth {
  status: string;
  details: {
    video: boolean;
    thumbnail: boolean;
    image: boolean;
    timestamp: string;
  };
}

export interface VideoProcessingHealth {
  status: string;
  metrics: {
    activeJobs: number;
    oldestJobAge: number;
  };
}

export interface QueueHealth {
  metrics: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    stuckJobs: number;
    oldestStuckJobAge: number;
  };
}

export interface StorageMetrics {
  metrics: {
    [key in 'video' | 'thumbnail' | 'image']: {
      objectCount: number;
      totalSize: number;
      lastModified: string;
    };
  };
}

export interface DatabaseMetrics {
  metrics: {
    total_videos: number;
    processing_videos: number;
    failed_videos: number;
    total_channels: number;
    total_users: number;
  };
}

export interface SystemHealthStatus {
  storage: StorageHealth;
  videoProcessing: VideoProcessingHealth;
  queue: QueueHealth;
  storage_metrics: StorageMetrics;
  database_metrics: DatabaseMetrics;
}

export const monitoringApi = {
  async getStorageHealth(): Promise<StorageHealth> {
    const { data } = await api.get('/api/v1/monitoring/health/storage');
    return data;
  },

  async getVideoProcessingHealth(): Promise<VideoProcessingHealth> {
    const { data } = await api.get('/api/v1/monitoring/health/video-processing');
    return data;
  },

  async getQueueHealth(): Promise<QueueHealth> {
    const { data } = await api.get('/api/v1/monitoring/health/queue');
    return data;
  },

  async getStorageMetrics(): Promise<StorageMetrics> {
    const { data } = await api.get('/api/v1/monitoring/health/storage-metrics');
    return data;
  },

  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const { data } = await api.get('/api/v1/monitoring/health/database-metrics');
    return data;
  },

  async getAllHealthMetrics(): Promise<SystemHealthStatus> {
    const [storage, videoProcessing, queue, storageMetrics, dbMetrics] = await Promise.all([
      this.getStorageHealth(),
      this.getVideoProcessingHealth(),
      this.getQueueHealth(),
      this.getStorageMetrics(),
      this.getDatabaseMetrics()
    ]);

    return {
      storage,
      videoProcessing,
      queue,
      storage_metrics: storageMetrics,
      database_metrics: dbMetrics
    };
  }
};