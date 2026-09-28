import React from "react";
import { studioTechnicalDetail } from "../../../../../api/studioErrors";
import { TechnicalErrorDetail } from "../../../../common/TechnicalErrorDetail";

/**
 * The HTTP status and error code after a Studio error message ("HTTP 503 ·
 * STUDIO_UNAVAILABLE"), small and muted, in development only (the same
 * suffix as the other AI Thumbnails pages). Creators only read the sentence.
 */
export function StudioErrorDetail({ error }: { error?: { code?: string | null; status?: number | null } | null }) {
  return <TechnicalErrorDetail detail={studioTechnicalDetail(error)} />;
}

/** A Studio error message with its development-only technical detail. */
export function StudioErrorText({ error }: { error: { message: string; code?: string | null; status?: number | null } }) {
  return <>{error.message}<StudioErrorDetail error={error} /></>;
}
