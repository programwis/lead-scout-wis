export type ContactStatus = "contactable" | "partial" | "no_contact";

export type LocationStatus = "verified" | "outside_location" | "unknown";

export type ReferenceType = "official_website" | "directory" | "social" | "government";

export interface LeadReference {
  type: ReferenceType;
  url: string;
  name?: string;
}

export interface ContactSource {
  type: ReferenceType;
  url: string;
  name?: string;
}

/** ผลลัพธ์จาก /generate ยังไม่บันทึกลง DB จึงไม่มี _id */
export interface LeadCandidate {
  companyName: string;
  sourceType: "google_maps";
  industry: string;
  industryDetail: string | null;
  website: string | null;
  domain: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactStatus: ContactStatus;
  locationStatus: LocationStatus;
  references: LeadReference[];
  contactSources: Partial<Record<"phone" | "email" | "address", ContactSource>>;
}

/** lead ที่บันทึกแล้ว มาจาก GET /api/leads */
export interface Lead extends LeadCandidate {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface NeedsReviewLead {
  reason: "unknown_location";
  lead: LeadCandidate;
}

export interface RejectedLead {
  reason: "outside_location" | "duplicate_domain";
  companyName: string;
  address?: string | null;
}

export interface SkippedLead {
  _id: string;
  companyName: string;
  domain: string | null;
}

export interface FailedLead {
  url: string;
  message: string;
}

export interface GenerateSummary {
  companiesFound: number;
  contactable: number;
  partial: number;
  noContact: number;
  withPhone: number;
  withEmail: number;
  withBoth: number;
  needsReview: number;
  rejected: number;
}

export type GenerateSuggestion = "search_again" | "expand_scope" | "try_other_keyword" | null;

export interface GenerateRequest {
  keyword: string;
  location?: string;
  limit?: number;
  refresh?: boolean;
  model?: string;
}

export interface GenerateResponse {
  success: true;
  model: string;
  requested: number;
  searchedPages: number;
  canContinue: boolean;
  suggestion: GenerateSuggestion;
  summary: GenerateSummary;
  leads: LeadCandidate[];
  noContact: LeadCandidate[];
  needsReview: NeedsReviewLead[];
  rejected: RejectedLead[];
  skipped: SkippedLead[];
  failed: FailedLead[];
}

export interface ConfirmRequest {
  leads: LeadCandidate[];
}

export interface ConfirmSavedLead {
  _id: string;
  companyName: string;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmFailedLead {
  domain?: string | null;
  companyName?: string;
  message: string;
}

export interface ConfirmResponse {
  success: true;
  saved: ConfirmSavedLead[];
  failed: ConfirmFailedLead[];
}

export interface AIModel {
  name: string;
  label: string;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  note: string;
}

export interface ModelsResponse {
  success: true;
  defaultModel: string;
  models: AIModel[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

/** แถวในตาราง = LeadCandidate + key สำหรับ antd Table/selection ที่ยังไม่บันทึก */
export interface EditableLeadRow extends LeadCandidate {
  rowKey: string;
}
