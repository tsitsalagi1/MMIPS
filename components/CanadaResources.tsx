import Link from "next/link";
import { CANADA_OFFICIAL_REFERENCE_URLS, CANADA_PUBLIC_REPORTING_GUIDANCE } from "@/lib/canada-config";

const immediateSteps = [
  "Call 911 if someone is in immediate danger.",
  "Contact the police service of jurisdiction as soon as you are concerned for the person's safety. There is no 24-hour waiting period.",
  "Ask for the police file number and write down the investigator's or family liaison's contact information.",
  "Ask what recent photo and identifying information the investigating service wants from the family.",
  "Ask which facts, locations, photos, or official notices are safe to share publicly.",
  "Keep private addresses, shelter locations, rumors, public accusations, and other unsafe details off public posts.",
  "Send investigative tips to the police service or official tip contact, not to MMIPS Canada."
];

export function CanadaResources() {
  return (
    <main className="container section resources-page plain-language-page">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Family resources</h1>
      <p className="lead">If someone you care about is missing in Canada, start with official reporting. These steps help families organize information and share approved public awareness safely.</p>

      <section className="notice safety-notice">
        <strong>Need immediate help?</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
      </section>

      <section className="card resource-priority-card">
        <h2>If someone is missing now</h2>
        <ol className="resource-checklist">
          {immediateSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>

      <section className="feature-grid resource-link-grid" aria-label="Canadian official resources">
        <div className="card">
          <h3>Emergency</h3>
          <p>If someone is in immediate danger or needs urgent emergency help, call 911.</p>
          <a className="button secondary" href="tel:911">Call 911</a>
        </div>
        <div className="card">
          <h3>RCMP missing-person reporting guidance</h3>
          <p>Read the RCMP's public guidance on reporting a missing person and why families should report concerns promptly.</p>
          <a className="button secondary" href={CANADA_OFFICIAL_REFERENCE_URLS.rcmpMissingPersonGuidance} target="_blank" rel="noreferrer">Open RCMP guidance</a>
        </div>
        <div className="card">
          <h3>National Centre for Missing Persons and Unidentified Remains</h3>
          <p>NCMPUR supports missing-person and unidentified-remains investigations through national coordination, data sharing, analysis, and investigative services. It does not replace a local police report.</p>
          <a className="button secondary" href={CANADA_OFFICIAL_REFERENCE_URLS.rcmpNationalCentre} target="_blank" rel="noreferrer">Open NCMPUR information</a>
        </div>
      </section>

      <section className="card plain-language-section">
        <h2>What to keep in your family record</h2>
        <div className="resource-chip-list">
          <span className="resource-chip">Police service</span>
          <span className="resource-chip">Police file number</span>
          <span className="resource-chip">Investigator or liaison</span>
          <span className="resource-chip">Dates and times of calls</span>
          <span className="resource-chip">Recent approved photos</span>
          <span className="resource-chip">Last known public area</span>
          <span className="resource-chip">Official public tip contact</span>
          <span className="resource-chip">What is safe to publish</span>
        </div>
      </section>

      <section className="card plain-language-section">
        <h2>Before you share online</h2>
        <div className="feature-grid compact-grid">
          <div><h3>Helpful to share</h3><p>Approved recent photos, official police contact information, a broad public area, a police file number when approved, and a reviewed MMIPS Canada profile.</p></div>
          <div><h3>Keep private</h3><p>Private addresses, shelters, domestic-violence locations, exact sensitive coordinates, rumors, public suspect accusations, and graphic or unsafe details.</p></div>
          <div><h3>Where tips go</h3><p>Use the investigating police service or official tip contact shown on the public profile. Use 911 for immediate danger. Do not send investigative tips to MMIPS Canada.</p></div>
        </div>
      </section>

      <section className="card plain-language-section">
        <h2>MMIPS Canada public awareness</h2>
        <p>When a Canadian profile has passed its public release gates, the public search and map can help people find the reviewed information without exposing exact private locations.</p>
        <div className="button-row"><Link className="button" href="/profiles">Search Canadian profiles</Link><Link className="button secondary" href="/how-it-works">How review works</Link></div>
      </section>

      <section className="card plain-language-section">
        <h2>Contact MMIPS Canada</h2>
        <p>General: <a href="mailto:contact@mmips.com">contact@mmips.com</a><br />Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a></p>
        <p><strong>Do not email emergency or investigative tips to MMIPS Canada.</strong></p>
      </section>
    </main>
  );
}
