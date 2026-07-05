import { notFound } from "next/navigation";
import { CaseStatusBadge, VerificationBadge } from "../../../components/StatusBadge";
import { ShareButtons } from "../../../components/ShareButtons";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { getCaseBySlug } from "../../../lib/cases";

export const dynamic = "force-dynamic";

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) notFound();

  return (
    <main className="container section">
      <div className="case-header-line">
        <div>
          <p className="muted">MMIPS public case page</p>
          <h1>{item.fullName}</h1>
        </div>
        <CaseStatusBadge status={item.status} />
      </div>
      <SafetyNotice />

      <section className="feature-grid">
        <div className="card"><h3>Last seen / location</h3><p>{item.lastSeenLocation}</p><p className="muted">{item.publicLocationNote}</p></div>
        <div className="card"><h3>Lead agency</h3><p>{item.leadAgency ?? "Unknown"}</p><p className="muted">Case #: {item.agencyCaseNumber ?? "Unknown"}</p></div>
        <div className="card"><h3>Tips</h3><p>{item.tipPhone ?? "List official tip line only."}</p><p className="muted">Never post public rumors or accusations.</p></div>
      </section>

      <section className="card">
        <h2>Case summary</h2>
        <p>{item.summary}</p>
        <div className="badge-row">
          {item.verification.map((status) => <VerificationBadge key={status} status={status} />)}
        </div>
      </section>

      <section className="section check-grid">
        <div className="card">
          <h2>Agency accountability checklist</h2>
          <table className="table"><tbody>
            <tr><th>Agency case number</th><td>{item.agencyCaseNumber ?? "Unknown"}</td></tr>
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

      <ShareButtons title={item.fullName} path={`/cases/${item.slug}`} />
    </main>
  );
}
