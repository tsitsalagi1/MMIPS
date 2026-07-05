import Link from "next/link";
import type { MmipsCase } from "../lib/types";
import { CaseStatusBadge, VerificationBadge } from "./StatusBadge";

export function CaseCard({ item }: { item: MmipsCase }) {
  const imageSrc = item.photoUrl || "/mmips-hand-white-bg.png";
  const imageAlt = item.photoAltText || (item.photoUrl ? `${item.fullName} case image` : "");

  return (
    <article className="card case-card">
      <div className="case-card-grid">
        <div className="case-image" aria-hidden={!item.photoUrl}>
          <img src={imageSrc} alt={imageAlt} />
        </div>
        <div>
          <div className="case-header-line">
            <h3>{item.fullName}</h3>
            <CaseStatusBadge status={item.status} />
          </div>
          <p className="muted">Last seen: {item.lastSeenLocation}{item.lastSeenDate ? ` — ${item.lastSeenDate}` : ""}</p>
          <p>{item.summary}</p>
          <div className="badge-row">
            {item.verification.map((status) => <VerificationBadge key={status} status={status} />)}
          </div>
          <Link className="button secondary" href={`/cases/${item.slug}`}>View public case page</Link>
        </div>
      </div>
    </article>
  );
}
