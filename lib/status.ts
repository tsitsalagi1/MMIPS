import type { ProfileType, VerificationStatus } from "./types";

export type { VerificationStatus };

export function statusLabel(status: string) {
  switch (status) {
    case "missing": return "Missing";
    case "murdered_unsolved": return "Information needed";
    case "unidentified": return "Unidentified";
    case "resolved": return "Located / resolved";
    default: return "Unknown";
  }
}

export function profileTypeLabel(profileType: ProfileType | string) {
  switch (profileType) {
    case "urgent_missing": return "Urgent public awareness";
    case "missing": return "Missing public profile";
    case "murdered_info_needed": return "Remembering / information needed";
    case "unidentified": return "Unidentified public profile";
    case "located": return "Located / status update";
    case "removed": return "Removed from public view";
    default: return "Public profile";
  }
}

export function flyerTitleForProfile(profileType: ProfileType | string, status: string) {
  if (profileType === "urgent_missing") return "URGENT PUBLIC AWARENESS";
  if (profileType === "murdered_info_needed") return "REMEMBERING — INFORMATION NEEDED";
  if (status === "resolved" || profileType === "located") return "LOCATED / STATUS UPDATE";
  if (status === "missing") return "MISSING INDIGENOUS PERSON";
  if (status === "unidentified") return "UNIDENTIFIED PERSON";
  return "PUBLIC AWARENESS PROFILE";
}

export function profileIntroForType(profileType: ProfileType | string) {
  switch (profileType) {
    case "urgent_missing":
      return "This public-awareness profile was submitted for urgent visibility. Contact the listed official agency or call 911 in an emergency. MMIPS does not collect tips.";
    case "murdered_info_needed":
      return "This remembrance and information-needed profile is for renewed visibility. Send information to the listed official contact, not MMIPS.";
    case "missing":
      return "This public-awareness profile shares approved information and official contact details.";
    default:
      return "This public-awareness profile shares approved information and official contact details.";
  }
}

export function mapCategoryLabel(profileType: ProfileType | string, status: string) {
  if (profileType === "urgent_missing") return "Urgent missing";
  if (profileType === "murdered_info_needed" || status === "murdered_unsolved") return "Murdered / information needed";
  if (status === "resolved" || profileType === "located") return "Located / resolved";
  if (status === "missing") return "Missing";
  if (status === "unidentified") return "Unidentified";
  return "Public profile";
}

export function verificationLabel(status: VerificationStatus | string) {
  switch (status) {
    case "mmips_reviewed": return "Public profile";
    case "family_verified": return "Family verified";
    case "family_authorized": return "Family/authorized submitter";
    case "agency_case_number": return "Agency report/case number provided";
    case "namus_listed": return "NamUs listed";
    case "media_reported": return "Media reported";
    case "official_source": return "Official source";
    default: return String(status).replaceAll("_", " ");
  }
}
