import type { CaseStatus, ProfileType, VerificationStatus } from "../lib/types";
import { profileTypeLabel, statusLabel, verificationLabel } from "../lib/status";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}

export function ProfileTypeBadge({ profileType }: { profileType: ProfileType | string }) {
  return <span className={`badge badge-profile-${profileType}`}>{profileTypeLabel(profileType)}</span>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "mmips_reviewed") return null;
  return <span className="badge badge-neutral">{verificationLabel(status)}</span>;
}
