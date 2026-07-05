import type { CaseStatus, VerificationStatus } from "./types";

export function statusLabel(status: CaseStatus) {
  switch (status) {
    case "missing": return "Missing";
    case "murdered_unsolved": return "Murdered / Unsolved";
    case "unidentified": return "Unidentified";
    case "resolved": return "Resolved";
    default: return "Unknown";
  }
}

export function verificationLabel(status: VerificationStatus | string) {
  switch (status) {
    case "mmips_reviewed": return "MMIPS reviewed for publication";
    case "family_verified": return "Family verified";
    case "family_authorized": return "Family/authorized submitter";
    case "agency_case_number": return "Agency case number provided";
    case "namus_listed": return "NamUs listed";
    case "media_reported": return "Media reported";
    case "official_source": return "Official source";
    default: return "MMIPS reviewed";
  }
}
