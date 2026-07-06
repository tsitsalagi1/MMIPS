import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStatusBadge, VerificationBadge } from "../../../components/StatusBadge";
import { ShareButtons } from "../../../components/ShareButtons";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { getCaseBySlug } from "../../../lib/cases";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) notFound();

  return (
    <main className="container section">
      <div className="case-header-line">
        <div>
          <p className="muted">MMIPS public profile</p>
          <h1>{item.fullName}</h1>
        </div>
        <CaseStatusBadge status={item.status} />
      </div>
      <SafetyNotice />

      <section className="card public-photo-card">
        <div className="public-photo-wrap">
          <img src={item.photoUrl || "/placeholder-person.svg"} alt={item.photoAltText || `${item.fullName} public profile image`} />
        </div>
        <p className="muted small-text">Images are shown only after approval for public display. Request removal if this image should not be public.</p>
      </section>

      <section className="feature-grid">
        <div className="card"><h3>Last seen / location</h3><p>{item.lastSeenLocation}</p><p className="muted">{item.publicLocationNote}</p></div>
        <div className="card"><h3>Lead agency</h3><p>{item.leadAgency ?? "Unknown"}</p><p className="muted">Agency report/case #: {item.agencyCaseNumber ?? "Unknown"}</p></div>
        <div className="card"><h3>Tips</h3><p>{item.tipPhone ?? "List official tip line only."}</p><p className="muted">Never post public rumors or accusations.</p></div>
      </section>

      <section className="card">
        <h2>Public summary</h2>
        <p>{item.summary}</p>
        <div className="badge-row">
          {item.verification.map((status) => <VerificationBadge key={status} status={status} />)}
        </div>
      </section>

      <section className="section check-grid">
        <div className="card">
          <h2>Official information checklist</h2>
          <table className="table"><tbody>
            <tr><th>Agency report/case number</th><td>{item.agencyCaseNumber ?? "Unknown"}</td></tr>
            <tr><th>NamUs number</th><td>{item.namusNumber ?? "Unknown"}</td></tr>
            <tr><th>NCIC status</th><td>{item.ncicStatus ?? "Unknown"}</td></tr>
            <tr><th>Tribe notified</th><td>{item.tribeNotified ?? "Unknown"}</td></tr>
            <tr><th>Family liaison</th><td>{item.familyLiaison ?? "Unknown"}</td></tr>
            <tr><th>Last public update</th><td>{item.lastPublicUpdate ?? "Unknown"}</td></tr>
          </tbody></table>
        </div>
        <div className="card">
          <h2>Map safety</h2>
          <p>Public location precision: <strong>{item.locationPrecision}</strong></p>
          <p className="muted">Exact private addresses, shelter locations, domestic violence locations, and sensitive minor locations should not be public.</p>
        </div>
      </section>

      <section className="card correction-cta">
        <h2>Need to correct or remove this public profile?</h2>
        <p>Family members, authorized advocates, tribal representatives, and official contacts can request corrections, safety edits, updated tip contacts, or removal review.</p>
        <Link className="button secondary" href={`/corrections?profile=${encodeURIComponent(item.slug)}`}>Request correction/removal review</Link>
      </section>

      <section className="card flyer-cta">
        <h2>Print a flyer</h2>
        <p>Use a printer-friendly version for community sharing. It includes only the approved public information and the official tip information shown on this page.</p>
        <Link className="button secondary" href={`/profiles/${item.slug}/flyer`}>Open printable flyer</Link>
      </section>

      <ShareButtons
        title={item.fullName}
        path={`/profiles/${item.slug}`}
        imageUrl={item.photoUrl}
        statusLabel={item.status === "missing" ? "Missing Indigenous Person" : "MMIPS Public Notice"}
        lastSeenLocation={item.lastSeenLocation}
        lastSeenDate={item.lastSeenDate}
        age={item.age}
        tribalAffiliation={item.tribalAffiliation}
        leadAgency={item.leadAgency}
        agencyCaseNumber={item.agencyCaseNumber}
        namusNumber={item.namusNumber}
        tipPhone={item.tipPhone}
        summary={item.summary}
      />
    </main>
  );
}
