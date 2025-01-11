import api from './index';

// Base interfaces
interface BaseHealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

// Extended interfaces for new endpoints
export interface StorageHealth extends BaseHealthResponse {
  details: {
    video: boolean;
    thumbnail: boolean;
    image: boolean;
    timestamp: string;
  };
}

export interface VideoProcessingHealth extends BaseHealthResponse {
  metrics: {
    activeJobs: number;
    oldestJobAge: number;
  };
}

export interface QueueHealth extends BaseHealthResponse {
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

export interface QueuePerformance extends BaseHealthResponse {
  metrics: {
    jobCounts: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
    performance: {
      averageProcessingTime: string;
      jobsPerHour: number;
      currentThroughput: string;
    };
    systemLoad: {
      cpuCount: number;
      loadAverage: string;
      systemLoadPercentage: string;
      memory: {
        heapUsed: string;
        heapTotal: string;
        rss: string;
      };
    };
    issues: {
      stuckJobs: Array<{
        id: string;
        duration: string;
        data: any;
      }>;
    };
    activeJobs: Array<{
      id: string;
      progress: number;
      duration: string;
      data: any;
    }>;
    recentFailures: Array<{
      id: string;
      failedReason: string;
      data: any;
      attempts: number;
    }>;
  };
}

export interface FFmpegPerformance extends BaseHealthResponse {
  metrics: {
    systemCapabilities: {
      cpuCount: number;
      cpuModel: string;
      totalMemory: string;
      freeMemory: string;
    };
    activeTranscodings: Array<{
      id: string;
      progress: number;
      duration: number;
      videoId: number;
    }>;
  };
}

export interface StorageMetrics extends BaseHealthResponse {
  metrics: {
    [key in 'video' | 'thumbnail' | 'image']: {
      objectCount: number;
      totalSize: number;
      lastModified: string;
    };
  };
}

export interface DatabaseMetrics extends BaseHealthResponse {
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
  queuePerformance: QueuePerformance;
  ffmpegPerformance: FFmpegPerformance;
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

  async getQueuePerformance(): Promise<QueuePerformance> {
    const { data } = await api.get('/api/v1/monitoring/health/queue-performance');
    return data;
  },

  async getFFmpegPerformance(): Promise<FFmpegPerformance> {
    const { data } = await api.get('/api/v1/monitoring/health/ffmpeg-performance');
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
    const [
      storage,
      videoProcessing,
      queue,
      queuePerformance,
      ffmpegPerformance,
      storageMetrics,
      dbMetrics
    ] = await Promise.all([
      this.getStorageHealth(),
      this.getVideoProcessingHealth(),
      this.getQueueHealth(),
      this.getQueuePerformance(),
      this.getFFmpegPerformance(),
      this.getStorageMetrics(),
      this.getDatabaseMetrics()
    ]);

    return {
      storage,
      videoProcessing,
      queue,
      queuePerformance,
      ffmpegPerformance,
      storage_metrics: storageMetrics,
      database_metrics: dbMetrics
    };
  }
};