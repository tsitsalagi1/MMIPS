import { CaseCard } from "../../components/CaseCard";
import { SafetyNotice } from "../../components/SafetyNotice";
import { getPublishedCases } from "../../lib/cases";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const cases = await getPublishedCases();

  return (
    <main className="container section">
      <h1>Search cases</h1>
      <p className="lead">Search verified missing, murdered/unsolved, unidentified, and resolved Indigenous person cases. Only reviewed and approved public cases should appear here.</p>
      <SafetyNotice />
      <div className="card" style={{ margin: "20px 0" }}>
        <form className="form">
          <label>Search by name, city, Tribe, agency, or NamUs number
            <input placeholder="Search MMIPS cases" />
          </label>
          <div className="check-grid">
            <label>Status
              <select><option>All statuses</option><option>Missing</option><option>Murdered / Unsolved</option><option>Unidentified</option><option>Resolved</option></select>
            </label>
            <label>State
              <input placeholder="Oklahoma, Arizona, Montana..." />
            </label>
          </div>
        </form>
      </div>
      {cases.length ? (
        cases.map((item) => <CaseCard key={item.id} item={item} />)
      ) : (
        <div className="card calm-panel" style={{ marginTop: "22px" }}>
          <h2>No public cases are listed yet.</h2>
          <p className="text-measure">Cases will appear here only after review and publication. MMIPS does not show private submissions, unreviewed reports, or information that has not been approved for public awareness.</p>
          <p className="muted">Families and authorized contacts can submit a case for review or request corrections/removal at any time.</p>
        </div>
      )}
    </main>
  );
}
