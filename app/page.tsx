import Link from "next/link";
import { SafetyNotice } from "../components/SafetyNotice";

export default function HomePage() {
  return (
    <main>
      <section className="hero calm-hero">
        <div className="container hero-grid calm-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Missing & Murdered Indigenous People Search</p>
            <h1>A respectful place to search and share reviewed MMIP public profiles.</h1>
            <p className="lead">MMIPS helps families, authorized advocates, Tribes, and communities organize public awareness information without turning grief into rumors, unsafe details, or public accusations.</p>
            <div className="button-row">
              <Link className="button" href="/submit">Submit information for review</Link>
              <Link className="button secondary" href="/profiles">Search public profiles</Link>
            </div>
          </div>
          <aside className="card hero-logo-panel" aria-label="MMIPS safety commitments">
            <img src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" />
            <h2>Built for families first</h2>
            <p>Public information should be accurate, consent-based, and safe. Nothing submitted to MMIPS is published automatically.</p>
          </aside>
        </div>
      </section>

      <section className="container section home-guidance" aria-label="Important safety information">
        <SafetyNotice />
        <div className="guidance-grid">
          <div className="card calm-card"><h3>Start with emergency help</h3><p>MMIPS does not replace calling 911, filing a police report, contacting Tribal/local/federal law enforcement, BIA MMU, FBI, or submitting to NamUs.</p></div>
          <div className="card calm-card"><h3>Families keep control</h3><p>Submissions are reviewed before publication, and family members or authorized contacts can request corrections, safety edits, or removal review.</p></div>
          <div className="card calm-card"><h3>No rumor board</h3><p>MMIPS does not publish public suspect accusations, exact unsafe locations, graphic details, or information that could endanger a person, family, or investigation.</p></div>
        </div>
      </section>

      <section className="container section review-flow" aria-label="How MMIPS works">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Simple, reviewed, and careful.</h2>
          <p className="muted text-measure">The site is designed for people who may be under stress. Pages use plain language, clear next steps, and careful review before public sharing.</p>
        </div>
        <div className="feature-grid aligned-grid">
          <div className="card flow-card"><span className="stat-number">1</span><h3>Submit for review</h3><p>Families, advocates, Tribal representatives, or official contacts submit information for public awareness review.</p></div>
          <div className="card flow-card"><span className="stat-number">2</span><h3>Verify and protect</h3><p>MMIPS checks consent, safety risks, official contacts, and whether details should be hidden, softened, or clarified.</p></div>
          <div className="card flow-card"><span className="stat-number">3</span><h3>Publish carefully</h3><p>Only reviewed public profiles appear in search, with correction/removal review available afterward.</p></div>
        </div>
      </section>

      <section className="container section public-empty-state">
        <div className="card calm-panel">
          <p className="eyebrow">Public profiles</p>
          <h2>Approved profiles will appear after review.</h2>
          <p className="text-measure">Public profiles are not created from raw submissions. Approved profiles can include a safe location summary, official tip contact, verification badges, and an agency accountability checklist.</p>
          <div className="button-row">
            <Link className="button secondary" href="/profiles">View public profile search</Link>
            <Link className="button secondary" href="/safety-policy">Read the safety policy</Link>
          </div>
        </div>
      </section>

      <section className="container feature-grid support-grid">
        <div className="card calm-card"><h3>Shareable public profiles</h3><p>Clear links and public profiles make it easier to share verified facts without copying private or unsafe details across social media.</p></div>
        <div className="card calm-card"><h3>Correction/removal review</h3><p>Families and authorized contacts can request changes if information is wrong, unsafe, outdated, or should not be public.</p></div>
        <div className="card calm-card"><h3>Accountability checklist</h3><p>Public profiles can show missing pieces like agency report/case number, NamUs number, Tribal notice, and last public update.</p></div>
      </section>
    </main>
  );
}
