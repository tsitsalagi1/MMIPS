export type VerificationStatus = "mmips_reviewed" | "family_verified" | "family_authorized" | "agency_case_number" | "namus_listed" | "media_reported" | "official_source";

export function statusLabel(status: string) {
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
    case "agency_case_number": return "Agency report/case number provided";
    case "namus_listed": return "NamUs listed";
    case "media_reported": return "Media reported";
    case "official_source": return "Official source";
    default: return String(status).replaceAll("_", " ");
  }
}
