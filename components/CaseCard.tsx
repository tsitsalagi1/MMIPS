import Link from "next/link";
import type { MmipsCase } from "../lib/types";
import { CaseStatusBadge, VerificationBadge } from "./StatusBadge";

export function CaseCard({ item }: { item: MmipsCase }) {
  return (
    <article className="card case-card">
      <div className="case-card-grid">
        <div className="case-image" aria-hidden="true">
          <span>MMIPS</span>
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
