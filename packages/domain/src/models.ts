import type { Complaint } from "./complaint";
import { DEMO_NOW_ISO } from "./persistence";
import type { Priority } from "./priority";
import type { PrivacyMode } from "./privacy";
import type { CaseStatus } from "./status";
import { terminalStatuses } from "./status";
import type { Gender, SubcategoryCode, WorkerCategoryCode } from "./taxonomy";

export function isOverdue(
  complaint: Pick<Complaint, "dueAt" | "status">,
  demoNow = DEMO_NOW_ISO,
): boolean {
  if ((terminalStatuses as readonly CaseStatus[]).includes(complaint.status)) {
    return false;
  }
  return demoNow > complaint.dueAt;
}

export function withDerivedFields(complaint: Complaint, demoNow = DEMO_NOW_ISO): Complaint {
  return { ...complaint, overdue: isOverdue(complaint, demoNow) };
}

export type RightsProvince = "Punjab" | "Sindh";

export type RightsTopicTier = "core" | "more";

export type RightsTopicTone = "green" | "teal" | "gold" | "red";

export type RightsTopicVisual =
  | "wages"
  | "pesticide"
  | "heat"
  | "injury"
  | "equality"
  | "child"
  | "freedom"
  | "facilities"
  | "contract"
  | "maternity"
  | "collective"
  | "compensation"
  | "migrant";

export interface RightsProvinceNote {
  province: RightsProvince;
  bodyKey: string;
  sourceLabelKey: string;
  sourceUrl: string;
}

export interface RightsTopic {
  id: string;
  titleKey: string;
  bodyKey: string;
  tier: RightsTopicTier;
  tone: RightsTopicTone;
  visual: RightsTopicVisual;
  categoryCode?: WorkerCategoryCode;
  guidanceKeys: string[];
  warningKeys: string[];
  actionKeys: string[];
  provinceNotes: RightsProvinceNote[];
  lastReviewedAt: string;
}

export interface NamedCount {
  key: string;
  count: number;
}

export interface AnalyticsSnapshot {
  generatedAt: string;
  total: number;
  newCount: number;
  criticalCount: number;
  inProgressCount: number;
  overdueCount: number;
  resolvedCount: number;
  openCount: number;
  resolutionRate: number | null;
  criticalRate: number | null;
  reopenRate: number | null;
  positiveOutcomeRate: number | null;
  averageFirstActionHours: number | null;
  averageResolutionHours: number | null;
  aiLowConfidenceShare: number | null;
  aiHumanReviewShare: number | null;
  byCategory: NamedCount[];
  byStatus: NamedCount[];
  byProvince: NamedCount[];
  byPriority: NamedCount[];
  byPrivacy: NamedCount[];
  byGender: NamedCount[];
  byOutcome: NamedCount[];
  byAiConfidence: NamedCount[];
  byHumanReview: NamedCount[];
  trend: NamedCount[];
}

export interface DemoScenario {
  id: string;
  labelKey: string;
  trackingId: string;
  complaintIds: string[];
}

export interface LocalEvidence {
  id: string;
  localUri: string;
  fileName: string;
  mimeType: string;
}

export interface ComplaintFilters {
  status?: CaseStatus[];
  priority?: Priority[];
  category?: WorkerCategoryCode[];
  search?: string;
  privacyMode?: PrivacyMode[];
  province?: string[];
  gender?: Gender[];
  from?: string;
  to?: string;
}

export type AnalyticsFilters = ComplaintFilters;

export interface ContactAction {
  channel: "call" | "message" | "none";
  note?: string;
}

export interface ActionInput {
  type: string;
  note: string;
}

export interface ResolutionInput {
  summary: string;
}

export interface TransitionMeta {
  at: string;
  actorRole: "worker" | "puwf-grievance-manager" | "system";
  note?: string;
  visibility?: "internal" | "worker-visible";
}

export interface ScenarioContext {
  scenarioId?: string;
}

export interface TranscriptResult {
  textUr: string;
  confidence: "high" | "medium" | "low";
  failed: boolean;
}

export interface TranslationResult {
  text: string;
  failed: boolean;
}

export interface ClassificationResult {
  suggestedCategory: WorkerCategoryCode;
  suggestedSubcategory?: SubcategoryCode;
  confidence: "high" | "medium" | "low";
}

export interface SummaryResult {
  summaryUr: string;
  summaryEn: string;
  confidence: "high" | "medium" | "low";
}

export interface ExtractedFactsResult {
  facts: string[];
}

export interface PrioritySuggestion {
  suggested: Priority;
  confidence: "high" | "medium" | "low";
}
