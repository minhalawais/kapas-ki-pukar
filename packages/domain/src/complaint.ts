import type { Locale } from "./ids";
import type { Priority } from "./priority";
import type { PrivacyMode } from "./privacy";
import type { CaseActionType, CaseStatus } from "./status";
import type {
  EmploymentType,
  Gender,
  GroupImpact,
  ReporterType,
  SubcategoryCode,
  WorkerCategoryCode,
} from "./taxonomy";

export interface Reporter {
  type: ReporterType;
  displayName?: string;
  contactAllowed: boolean;
}

export type ReporterIdentity =
  | { mode: "cnic"; cnicLast4: string; cnicVerified: boolean }
  | { mode: "phone"; phoneLast4: string; cnicVerified: boolean }
  | { mode: "anonymous"; cnicVerified: false };

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  province: string;
  district: string;
  tehsil?: string;
  villageLabel?: string;
  village?: string;
  field?: string;
  placeLabel?: string;
  formattedAddress?: string;
  source?: "device" | "manual";
  accuracyMeters?: number;
  exactCoordinates: GeoCoordinates | null;
}

export interface Incident {
  whenLabel: string;
  occurredAt?: string;
  description?: string;
  currentDanger: boolean;
  immediateDanger: boolean;
  othersAffected: GroupImpact;
  structuredAnswers: Record<string, unknown>;
}

export interface Evidence {
  id: string;
  kind: "photo" | "document";
  localUri: string;
  fileName: string;
  mimeType: string;
  capturedAt: string;
}

export interface VoiceEvidence {
  id: string;
  localUri: string;
  durationMs: number;
  recordedAt: string;
  locale: Locale;
}

export interface ExtractedComplaintFacts {
  actor?: string;
  amountExpected?: number;
  amountReceived?: number;
  affectedWorkers?: string;
  symptoms?: string[];
  locationText?: string;
}

export interface AIAnalysis {
  suggestedCategory?: WorkerCategoryCode;
  suggestedSubcategory?: SubcategoryCode;
  suggestedPriority?: Priority;
  summaryUr?: string;
  summaryEn?: string;
  transcriptUr?: string;
  transcriptEn?: string;
  confidenceScore: number;
  confidence: "high" | "medium" | "low";
  failed: boolean;
  humanReviewRequired: boolean;
  extractedFacts?: ExtractedComplaintFacts;
  warnings?: string[];
}

export interface CaseAction {
  id: string;
  type: CaseActionType;
  at: string;
  actorRole: "worker" | "puwf-grievance-manager" | "system";
  note?: string;
  visibility?: "internal" | "worker-visible";
}

export interface Resolution {
  summary: string;
  proposedAt?: string;
  resolvedAt?: string;
}

export interface WorkerFeedback {
  outcome: "satisfied" | "partial" | "unresolved";
  submittedAt: string;
}

export interface Complaint {
  id: string;
  trackingId: string;
  referenceNumber: string;
  createdAt: string;
  submittedAt: string;
  updatedAt: string;
  dueAt: string;
  categoryCode: WorkerCategoryCode;
  subcategoryCode?: SubcategoryCode;
  category: WorkerCategoryCode;
  subcategory?: string;
  priority: Priority;
  status: CaseStatus;
  privacyMode: PrivacyMode;
  reporterType: ReporterType;
  reporter: Reporter;
  reporterIdentity?: ReporterIdentity;
  affectedWorkerType?: EmploymentType;
  gender?: Gender;
  location: Location;
  othersAffected: boolean;
  affectedRange?: GroupImpact;
  incident: Incident;
  evidence: Evidence[];
  voice: VoiceEvidence | null;
  ai: AIAnalysis | null;
  actions: CaseAction[];
  resolution: Resolution | null;
  workerFeedback: WorkerFeedback | null;
  overdue: boolean;
  scenarioId?: string;
}

export interface ComplaintDraft {
  id: string;
  stepId: string;
  privacyMode?: PrivacyMode;
  reporterIdentity?: ReporterIdentity;
  category?: WorkerCategoryCode;
  incident: Partial<Incident>;
  location: Partial<Location>;
  evidence: Evidence[];
  voice: VoiceEvidence | null;
  ai?: AIAnalysis | null;
  scenarioId?: string;
  updatedAt: string;
}

export interface ComplaintContext {
  category?: WorkerCategoryCode;
  subcategory?: SubcategoryCode;
  immediateDanger: boolean;
  pesticideSymptoms?: boolean;
  harassmentThreat?: boolean;
  privacyMode?: PrivacyMode;
  scenarioId?: string;
  othersAffected?: string;
}
