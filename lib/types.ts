export type CaseStatus = "missing" | "murdered_unsolved" | "unidentified" | "resolved" | "unknown";
export type VerificationStatus =
  | "mmips_reviewed"
  | "family_verified"
  | "agency_case_number"
  | "namus_listed"
  | "media_reported"
  | "official_source"
  | "family_authorized";
export type LocationPrecision = "exact_private" | "approximate" | "city" | "county" | "hidden";

export interface MmipsCase {
  id: string;
  slug: string;
  fullName: string;
  age?: number;
  tribalAffiliation?: string;
  status: CaseStatus;
  verification: VerificationStatus[];
  lastSeenDate?: string;
  lastSeenLocation: string;
  publicLocationNote: string;
  leadAgency?: string;
  agencyCaseNumber?: string;
  namusNumber?: string;
  ncicStatus?: "unknown" | "requested" | "confirmed";
  tribeNotified?: "unknown" | "yes" | "no";
  familyLiaison?: "unknown" | "yes" | "no";
  lastPublicUpdate?: string;
  summary: string;
  photoUrl?: string;
  flyerUrl?: string;
  tipPhone?: string;
  tipUrl?: string;
  latitude?: number;
  longitude?: number;
  locationPrecision: LocationPrecision;
  riskFlags?: string[];
}
