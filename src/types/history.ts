 export interface VideoData {
    id: number;
    title: string;
    thumbnail_path: string;
    description?: string;
    channel: {
      id: number;
      name: string;
    };
  }

export interface WatchHistory {
  id: number;
  user_id: string;
  video_id: number;
  durationWatched: number;
  completed: boolean;
  createdAt: string;
  video: VideoData;
}

  export interface LikesHistory {
    id: number;
    user_id: string;
    video_id: number;
    is_like: boolean;
    createdAt: string;
    video: {
      id: number;
      title: string;
      thumbnail_path: string;
      channel: {
        id: number;
        name: string;
      };
    };
  }