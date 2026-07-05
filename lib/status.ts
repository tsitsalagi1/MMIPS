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

export function verificationLabel(status: VerificationStatus) {
  switch (status) {
    case "family_verified": return "Family verified";
    case "agency_case_number": return "Agency case number provided";
    case "namus_listed": return "NamUs listed";
    case "media_reported": return "Media reported";
    default: return "Pending review";
  }
}
