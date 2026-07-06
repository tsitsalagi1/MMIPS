import type { CaseStatus, VerificationStatus } from "../lib/types";
import { statusLabel, verificationLabel } from "../lib/status";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "mmips_reviewed") return null;
  return <span className="badge badge-neutral">{verificationLabel(status)}</span>;
}
