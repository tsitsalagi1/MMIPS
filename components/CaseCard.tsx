import Link from "next/link";
import { CaseStatusBadge, VerificationBadge } from "./StatusBadge";
import type { MmipsCase } from "../lib/types";

export function CaseCard({ item }: { item: MmipsCase }) {
  const imageAlt = item.photoAltText || (item.photoUrl ? `${item.fullName} public profile image` : "");
  return (
    <article className="card case-card">
      <div className="case-card-grid">
        <div className="case-image" aria-hidden={!item.photoUrl}>
          <img src={item.photoUrl || "/placeholder-person.svg"} alt={imageAlt} />
        </div>
        <div>
          <div className="case-header-line">
            <h2>{item.fullName}</h2>
            <CaseStatusBadge status={item.status} />
          </div>
          <p><strong>Last seen:</strong> {item.lastSeenLocation}</p>
          <p>{item.summary}</p>
          <div className="badge-row">
            {item.verification.map((status) => <VerificationBadge key={status} status={status} />)}
          </div>
          <Link className="button secondary" href={`/profiles/${item.slug}`}>View public profile</Link>
        </div>
      </div>
    </article>
  );
}
