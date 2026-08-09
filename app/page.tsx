import Link from "next/link";
import { GlobalGateway } from "../components/GlobalGateway";
import { SafetyNotice } from "../components/SafetyNotice";
import { mmipsSiteMode } from "../lib/site-mode";

export default function HomePage() {
  if (mmipsSiteMode() === "global") return <GlobalGateway />;
  return <UnitedStatesHomePage />;
}

function UnitedStatesHomePage() {
  return (
    <main>
      <section className="hero calm-hero">
        <div className="container hero-grid calm-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Missing & Murdered Indigenous People Search</p>
            <h1>A respectful place to find and share reviewed MMIP profiles.</h1>
            <p className="lead">MMIPS helps families, Tribes, advocates, and communities share reviewed public information safely. We do not publish rumors, private locations, or unverified public accusations.</p>
            <div className="button-row">
              <Link className="button" href="/submit">Submit information for review</Link>
              <Link className="button secondary" href="/profiles">Search public profiles</Link>
            </div>
          </div>
          <aside className="card hero-logo-panel" aria-label="MMIPS safety commitments">
            <img src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" />
            <h2>Built for families first</h2>
            <p>Nothing submitted to MMIPS is published automatically. Public information is reviewed for safety, consent, and accuracy first.</p>
          </aside>
        </div>
      </section>

      <section className="container section home-guidance" aria-label="Important safety information">
        <SafetyNotice />
        <div className="guidance-grid">
          <div className="card calm-card"><h3>Start with official reporting</h3><p>If someone is missing or in danger, contact 911 and the appropriate Tribal or local law-enforcement agency first. MMIPS does not replace an official report.</p></div>
          <div className="card calm-card"><h3>Families keep control</h3><p>MMIPS reviews information before it becomes public. Families and authorized contacts can ask for corrections, safety changes, or removal review.</p></div>
          <div className="card calm-card"><h3>Share facts, not rumors</h3><p>MMIPS does not publish public suspect accusations, exact unsafe locations, graphic details, or information that could put someone at risk.</p></div>
        </div>
      </section>

      <section className="container section review-flow" aria-label="How MMIPS works">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Simple, reviewed, and careful.</h2>
          <p className="muted text-measure">MMIPS is designed for people who may be under stress. Pages use clear next steps, plain language, and review before public sharing.</p>
        </div>
        <div className="feature-grid aligned-grid">
          <div className="card flow-card"><span className="stat-number">1</span><h3>Send information for review</h3><p>A family member, authorized advocate, Tribal representative, or official contact can send information for public-awareness review.</p></div>
          <div className="card flow-card"><span className="stat-number">2</span><h3>Review for safety</h3><p>MMIPS checks permission, official contacts, safety risks, and which details should stay private.</p></div>
          <div className="card flow-card"><span className="stat-number">3</span><h3>Publish approved information</h3><p>Only reviewed public profiles appear in search. Families and authorized contacts can request changes or removal later.</p></div>
        </div>
      </section>

      <section className="container section public-empty-state">
        <div className="card calm-panel">
          <p className="eyebrow">Public profiles</p>
          <h2>Only reviewed profiles appear publicly.</h2>
          <p className="text-measure">A public profile can include a safe location summary, official contact information, source notes, and key case numbers. Raw submissions are never published automatically.</p>
          <div className="button-row">
            <Link className="button secondary" href="/profiles">View public profile search</Link>
            <Link className="button secondary" href="/safety-policy">Read the safety policy</Link>
          </div>
        </div>
      </section>

      <section className="container feature-grid support-grid">
        <div className="card calm-card"><h3>Easy to share</h3><p>Use the approved MMIPS profile or flyer so people see the same reviewed facts and official contact information.</p></div>
        <div className="card calm-card"><h3>Easy to correct or remove</h3><p>Families and authorized contacts can request changes when information is wrong, unsafe, outdated, or should no longer be public.</p></div>
        <div className="card calm-card"><h3>Important details in one place</h3><p>Profiles can show the agency case number, NamUs number, Tribal notice, official tip contact, and last public update when those details are available.</p></div>
      </section>
    </main>
  );
}
