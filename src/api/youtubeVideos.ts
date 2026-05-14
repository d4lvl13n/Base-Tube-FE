import api from './index';

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  description: string;
  url: string;
  privacyStatus: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationSeconds: number;
  channelId: string;
  channelTitle: string;
}

export interface YouTubeVideosPageData {
  channel: {
    id: string;
    title: string;
  };
  videos: YouTubeVideoItem[];
  nextPageToken?: string;
}

export async function fetchYouTubeVideos(params: {
  maxResults?: number;
  pageToken?: string;
}): Promise<YouTubeVideosPageData> {
  const res = await api.get('/api/integrations/youtube/videos', { params });
  return (res.data?.data ?? res.data) as YouTubeVideosPageData;
}
