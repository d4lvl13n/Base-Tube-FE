import type { ViewingContext } from "./publicChannelAudit";
export type ConnectedDiagnosisKind =
  | "packaging_opportunity"
  | "verify_promise"
  | "preserve"
  | "wait_for_exposure"
  | "insufficient_comparison";
export interface ConnectedPeer {
  videoId: string;
  ctr: number;
  averageViewPercentage: number | null;
  ageDays: number;
  durationSeconds: number;
}
export interface ConnectedVideoDiagnosis {
  videoId: string;
  title: string;
  selected: boolean;
  selectionReason: string;
  kind: ConnectedDiagnosisKind;
  summary: string;
  nextAction: string;
  impressions: number | null;
  ctr: number | null;
  averageViewPercentage: number | null;
  source: string | null;
  trafficBasis: "impressions" | "views" | null;
  ageDays: number | null;
  durationSeconds: number | null;
  viewing: ViewingContext;
  peers: ConnectedPeer[];
  baselineCtr: number | null;
  baselineViewPercentage: number | null;
  missingInformation: string[];
}
export interface ConnectedAuditAnalysis {
  version: "1";
  policy: "connected-opportunity-v1";
  asOf: string;
  window: { start: string; end: string };
  fingerprint?: string;
  contextInputHash?: string;
  publicEvidenceHash?: string;
  imageEvidenceHash?: string;
  comparisonsEnabled: boolean;
  videos: ConnectedVideoDiagnosis[];
  selectionMode: "connected_opportunities" | "public_fallback";
  limitations: string[];
  history?: {
    previousAuditId?: number;
    previousAsOf: string;
    reused: boolean;
    reasons: string[];
    previousWindow: { start: string; end: string };
    previousTests: AuditExperimentTracking[];
    previousProposals: {
      id: string;
      title: string;
      videoIds: string[];
      change: string;
    }[];
  };
}
export type AuditTestStatus =
  | "prepared"
  | "running"
  | "completed"
  | "cancelled";
export type AuditTestResult = "winner" | "performed_same" | "inconclusive";
export interface AuditTestUpdate {
  status: AuditTestStatus;
  result?: AuditTestResult;
  winner?: string;
  startDate?: string;
  endDate?: string;
  note?: string;
}
export interface AuditExperimentTracking extends AuditTestUpdate {
  experimentId: string;
  proposalKey: string;
  videoIds: string[];
  source: "creator_reported";
  updatedAt: string;
  events: (AuditTestUpdate & { recordedAt: string })[];
}
