import Link from "next/link";
import { SafetyNotice } from "../components/SafetyNotice";
import { CaseCard } from "../components/CaseCard";
import { sampleCases } from "../lib/cases";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="muted"><strong>Missing & Murdered Indigenous People Search</strong></p>
            <h1>Search. Share. Alert. Map.</h1>
            <p className="lead">MMIPS is designed to help families, Tribes, advocates, and communities share verified missing and murdered Indigenous person cases while tracking the government accountability gaps that too often leave families without answers.</p>
            <div className="button-row">
              <Link className="button" href="/submit">Submit a case for review</Link>
              <Link className="button secondary" href="/cases">Search cases</Link>
            </div>
          </div>
          <div className="card">
            <h2>Built for safety first</h2>
            <p>No open rumor board. No suspect accusations without official source. No exact private addresses. Every public case should be reviewed before publication.</p>
            <SafetyNotice />
          </div>
        </div>
      </section>

      <section className="container stats-grid">
        <div className="card"><span className="stat-number">1</span><strong>Public case page</strong><p className="muted">One clean, shareable page per verified case.</p></div>
        <div className="card"><span className="stat-number">2</span><strong>Map + patterns</strong><p className="muted">Track city/county-level locations without exposing private addresses.</p></div>
        <div className="card"><span className="stat-number">3</span><strong>Agency checklist</strong><p className="muted">NamUs, NCIC, agency number, Tribe notified, family liaison, and last update.</p></div>
      </section>

      <section className="container section">
        <h2>Featured demo case</h2>
        <p className="muted">This is placeholder content to test the design. Do not publish real cases until the review workflow and consent rules are active.</p>
        {sampleCases.map((item) => <CaseCard key={item.id} item={item} />)}
      </section>

      <section className="container feature-grid">
        <div className="card"><h3>Family-approved sharing</h3><p>Generate case links, flyers, QR codes, and social posts from verified facts.</p></div>
        <div className="card"><h3>Case verification badges</h3><p>Show whether a case is family-verified, agency-number supported, NamUs-listed, or pending review.</p></div>
        <div className="card"><h3>Accountability dashboard</h3><p>Expose the missing pieces without pretending MMIPS is law enforcement.</p></div>
      </section>
    </main>
  );
}
