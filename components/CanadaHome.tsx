import Link from "next/link";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "@/lib/canada-config";

export function CanadaHome() {
  return (
    <main>
      <section className="hero calm-hero">
        <div className="container hero-grid calm-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Missing & Murdered Indigenous People Search · Canada</p>
            <h1>A respectful place to find and share reviewed MMIP profiles in Canada.</h1>
            <p className="lead">MMIPS Canada helps First Nations, Inuit and Métis families, communities, advocates, and official contacts share reviewed public information safely. We do not publish rumors, private locations, or unverified public accusations.</p>
            <div className="button-row">
              <Link className="button" href="/submit">Submit information for review</Link>
              <Link className="button secondary" href="/profiles">Search public profiles</Link>
            </div>
          </div>
          <aside className="card hero-logo-panel" aria-label="MMIPS Canada safety commitments">
            <img src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" />
            <h2>Built for families first</h2>
            <p>Nothing submitted to MMIPS Canada is published automatically. Public information is reviewed for safety, permission, and accuracy first.</p>
          </aside>
        </div>
      </section>

      <section className="container section home-guidance" aria-label="Important Canadian reporting information">
        <section className="notice safety-notice">
          <strong>If someone is missing or in immediate danger</strong>
          <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
          <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
          <p>MMIPS Canada supports public awareness. It does not replace an official missing-person report or emergency service.</p>
        </section>
        <div className="guidance-grid">
          <div className="card calm-card"><h3>Start with official reporting</h3><p>Contact the police service responsible for the area first. Keep the police file number and the investigator or family-liaison contact when available.</p></div>
          <div className="card calm-card"><h3>Families keep control</h3><p>MMIPS reviews information before it becomes public. Families and authorized contacts can ask for corrections, safety changes, or removal review.</p></div>
          <div className="card calm-card"><h3>Share facts, not rumors</h3><p>MMIPS does not publish public suspect accusations, exact unsafe locations, graphic details, or information that could put someone at risk.</p></div>
        </div>
      </section>

      <section className="container section review-flow" aria-label="How MMIPS Canada works">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Simple, reviewed, and careful.</h2>
          <p className="muted text-measure">MMIPS Canada uses clear next steps, Canadian reporting information, and review before public sharing.</p>
        </div>
        <div className="feature-grid aligned-grid">
          <div className="card flow-card"><span className="stat-number">1</span><h3>Send information for review</h3><p>A family member, authorized advocate, Indigenous community representative, or official contact can send information for public-awareness review when Canadian intake is open.</p></div>
          <div className="card flow-card"><span className="stat-number">2</span><h3>Review for safety</h3><p>MMIPS checks permission, police or official contacts, public location wording, and which details should stay private.</p></div>
          <div className="card flow-card"><span className="stat-number">3</span><h3>Publish approved information</h3><p>Only reviewed public profiles appear in search and on the map. Families and authorized contacts can request changes or removal later.</p></div>
        </div>
      </section>

      <section className="container section public-empty-state">
        <div className="card calm-panel">
          <p className="eyebrow">Public profiles</p>
          <h2>Only reviewed profiles appear publicly.</h2>
          <p className="text-measure">A public profile can include a safe location summary, a police or official contact, approved First Nations, Inuit or Métis affiliation information, and public case references when available. Raw submissions are never published automatically.</p>
          <div className="button-row">
            <Link className="button secondary" href="/profiles">View public profile search</Link>
            <Link className="button secondary" href="/privacy">Read the privacy information</Link>
          </div>
        </div>
      </section>

      <section className="container feature-grid support-grid">
        <div className="card calm-card"><h3>Canada-specific search</h3><p>Search uses provinces and territories, Canadian postal codes, and distances in kilometres.</p></div>
        <div className="card calm-card"><h3>Easy to correct or remove</h3><p>Families and authorized contacts can request changes when information is wrong, unsafe, outdated, or should no longer be public.</p></div>
        <div className="card calm-card"><h3>First Nations, Inuit and Métis</h3><p>MMIPS Canada keeps these identities distinct and shows affiliation information only when it is appropriate and approved for public display.</p></div>
      </section>
    </main>
  );
}
