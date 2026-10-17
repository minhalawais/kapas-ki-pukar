import type { SubcategoryCode, WorkerCategoryCode } from "./taxonomy";

export const HISTORY_KEY = "_history";
export const INTRO_NODE_ID = "identity";
export const REVIEW_NODE_ID = "review";

export const workflowSections = ["intro", "category", "details", "facts", "safety", "ai", "review"] as const;
export type WorkflowSection = (typeof workflowSections)[number];

export type AnswerType =
  | "single"
  | "multi"
  | "voice"
  | "amount"
  | "date"
  | "location"
  | "notice"
  | "evidence"
  | "ai-processing"
  | "ai-understanding"
  | "review"
  | "cnic"
  | "current-location"
  | "text";

export interface AnswerOption {
  value: string;
  labelKey: string;
  helperKey?: string;
  subcategory?: SubcategoryCode;
}

export type NextRule =
  | { type: "node"; id: string }
  | { type: "map"; by?: string; cases: Record<string, string>; fallback: string }
  | { type: "conditional"; cases: Array<{ when: Record<string, string | string[]>; id: string }>; fallback: string }
  | { type: "end" };

export interface QuestionNode {
  id: string;
  promptKey: string;
  helperKey?: string;
  promptAudioId?: string;
  type: AnswerType;
  options?: AnswerOption[];
  required?: boolean;
  section: WorkflowSection;
  next: NextRule;
  storeAs?:
    | "category"
    | "whenLabel"
    | "othersAffected"
    | "immediateDanger"
    | "privacyMode"
    | "province"
    | "district"
    | "placeLabel"
    | "villageLabel"
    | "contactPreference"
    | "structured";
}

export type AnswerValue = string | string[];
export type AnswerMap = Record<string, AnswerValue>;

export const CATEGORY_ENTRY: Record<WorkerCategoryCode, string> = {
  WAG: "wag-what",
  PES: "pes-what",
  HSE: "hse-what",
  HAR: "har-about",
  CHL: "chl-who",
  FOL: "fol-forced",
  CON: "con-what",
  HRS: "hrs-what",
  SAN: "san-what",
  DIS: "dis-what",
  OTH: "oth-kind",
};
