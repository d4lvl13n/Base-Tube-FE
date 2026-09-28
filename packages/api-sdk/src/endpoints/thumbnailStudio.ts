import type { AxiosInstance } from 'axios';
import type { SuccessEnvelope } from '../types/common';
import type { StudioValidationFeedbackInput, StudioValidationFeedbackResult } from '../types/thumbnailStudio';

export function createThumbnailStudioApi(http: AxiosInstance) {
  return {
    /** Free, naturally idempotent feedback on an owned version's warning; available during rollout pauses. */
    async saveValidationFeedback(versionId: string, input: StudioValidationFeedbackInput): Promise<StudioValidationFeedbackResult> {
      const response = await http.patch<SuccessEnvelope<StudioValidationFeedbackResult>>(
        `/api/v1/thumbnail-studio/versions/${encodeURIComponent(versionId)}/validation-feedback`, input,
      );
      return response.data.data;
    },
  };
}
