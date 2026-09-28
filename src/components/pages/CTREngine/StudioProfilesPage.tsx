import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/** Channel profiles now live in Settings › Channel style; keep old links working. */
export default function StudioProfilesPage() {
  const location = useLocation();
  return <Navigate to={`/ai-thumbnails/settings/style${location.search}`} replace />;
}
