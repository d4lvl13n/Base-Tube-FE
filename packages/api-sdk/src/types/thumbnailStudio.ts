/** Creator feedback is separate from the automatic validation result. */
export const STUDIO_VALIDATION_CHECK_CODES = [
  'exact_text', 'unexpected_text', 'duplicate_text',
  'forbidden_face', 'forbidden_logo', 'forbidden_price',
] as const;
export type StudioValidationCheckCode = typeof STUDIO_VALIDATION_CHECK_CODES[number];
export type StudioValidationFeedbackResponse = 'confirmed' | 'disputed';
export interface StudioValidationFeedback {
  checkCode: StudioValidationCheckCode;
  response: StudioValidationFeedbackResponse;
  createdAt: string;
  updatedAt: string;
}
export interface StudioValidationFeedbackInput {
  checkCode: StudioValidationCheckCode;
  response: StudioValidationFeedbackResponse;
}
export interface StudioValidationFeedbackResult {
  versionId: string;
  validationFeedback: StudioValidationFeedback[];
}
