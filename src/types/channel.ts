export interface Channel {
  id: number;
  name: string;
  description: string | null;
  avatar_path?: string;
  banner_path?: string;
  subscriber_count?: number;
  video_count?: number;
  createdAt?: string;
  updatedAt?: string;
}
