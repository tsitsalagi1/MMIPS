export type CaseStatus = "missing" | "murdered_unsolved" | "unidentified" | "resolved" | "unknown";
export type ProfileType = "urgent_missing" | "missing" | "murdered_info_needed" | "unidentified" | "located" | "removed" | "unknown";
export type UrgencyLevel = "standard" | "urgent_public_awareness" | "renewed_visibility" | "status_update";
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
  age?: number | null;
  tribalAffiliation?: string | null;
  status: CaseStatus;
  profileType: ProfileType;
  urgencyLevel?: UrgencyLevel | string | null;
  verification: VerificationStatus[];
  lastSeenDate?: string | null;
  lastKnownDatetime?: string | null;
  lastKnownTimeZone?: string | null;
  lastSeenLocation: string;
  publicLocationNote: string;
  notificationAreaRequested?: string | null;
  likelyTravelMode?: string | null;
  possibleDirection?: string | null;
  vehicleDescription?: string | null;
  officialInfoPending?: boolean | null;
  leadAgency?: string | null;
  agencyCaseNumber?: string | null;
  namusNumber?: string | null;
  ncicStatus?: "unknown" | "requested" | "confirmed" | string | null;
  tribeNotified?: "unknown" | "yes" | "no" | string | null;
  familyLiaison?: "unknown" | "yes" | "no" | string | null;
  lastPublicUpdate?: string | null;
  summary: string;
  photoUrl?: string | null;
  photoAltText?: string | null;
  flyerUrl?: string | null;
  tipPhone?: string | null;
  tipUrl?: string | null;
  latitude?: number;
  longitude?: number;
  locationPrecision: LocationPrecision;
  riskFlags?: string[];
}
