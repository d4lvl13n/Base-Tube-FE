import { Video } from '../../../../../types/video';

export interface EditVideoModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (videoId: string, formData: FormData) => Promise<void>;
}

export interface FormErrors {
  title?: string;
  description?: string;
  thumbnail?: string;
  submit?: string;
}

export interface FormFields {
  title: string;
  description: string;
  tags: string;
  is_public: boolean;
  thumbnail?: File;
}

export interface VisibilityOption {
  id: 'public' | 'private';
  icon: React.ElementType;
  label: string;
  description: string;
} 