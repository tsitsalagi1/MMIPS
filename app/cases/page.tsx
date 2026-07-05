import { CaseCard } from "../../components/CaseCard";
import { SafetyNotice } from "../../components/SafetyNotice";
import { sampleCases } from "../../lib/cases";

export default function CasesPage() {
  return (
    <main className="container section">
      <h1>Search cases</h1>
      <p className="lead">Search verified missing, murdered/unsolved, unidentified, and resolved Indigenous person cases. This starter uses sample data; connect Supabase for live case records.</p>
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
      {sampleCases.map((item) => <CaseCard key={item.id} item={item} />)}
    </main>
  );
}
