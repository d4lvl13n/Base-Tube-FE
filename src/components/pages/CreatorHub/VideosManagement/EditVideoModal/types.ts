import { Video } from '../../../../../types/video';

export interface EditVideoModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (videoId: string, formData: FormData) => Promise<void>;
  /**
   * Hands the delete back to the page that owns the list, so one confirmation
   * dialog and one delete path serve both the row and this screen.
   */
  onDelete?: (videoId: number) => void;
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
}
