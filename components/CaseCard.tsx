import Link from "next/link";
import { CaseStatusBadge, ProfileTypeBadge, VerificationBadge } from "./StatusBadge";
import type { MmipsCase } from "../lib/types";

export function CaseCard({ item }: { item: MmipsCase }) {
  const imageAlt = item.photoAltText || (item.photoUrl ? `${item.fullName} public profile image` : "");
  const locationLabel = item.profileType === "murdered_info_needed" ? "Public area" : "Last seen";
  const isSynthetic = item.slug.startsWith("mmips-test-");
  return (
    <article className={`card case-card profile-card-${item.profileType}`}>
      {isSynthetic ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — This is not a real person or real case.</p> : null}
      <div className="case-card-grid">
        <div className="case-image" aria-hidden={!item.photoUrl}>
          <img src={item.photoUrl || "/placeholder-person.svg"} alt={imageAlt} />
        </div>
        <div>
          <div className="case-header-line">
            <h2>{item.fullName}</h2>
            <div className="badge-stack"><ProfileTypeBadge profileType={item.profileType} /><CaseStatusBadge status={item.status} /></div>
          </div>
          <p><strong>{locationLabel}:</strong> {item.lastSeenLocation}</p>
          <p>{item.summary}</p>
          {item.profileType === "urgent_missing" && item.notificationAreaRequested ? <p className="muted"><strong>Public awareness area:</strong> {item.notificationAreaRequested}</p> : null}
          <div className="badge-row">
            {item.verification.map((status) => <VerificationBadge key={status} status={status} />)}
          </div>
          <Link className="button secondary" href={`/profiles/${item.slug}`}>View public profile</Link>
        </div>
      </div>
    </article>
  );
}
