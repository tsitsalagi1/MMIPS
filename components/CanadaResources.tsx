import Link from "next/link";
import { CANADA_OFFICIAL_REFERENCE_URLS, CANADA_PUBLIC_REPORTING_GUIDANCE } from "@/lib/canada-config";

const immediateSteps = [
  "Call 911 if someone is in immediate danger.",
  "Contact the police service responsible for the area as soon as you are concerned. There is no 24-hour waiting period.",
  "Ask for the police file number and write down the investigator's or family liaison's contact information.",
  "Gather recent photos and basic identifying information the police service asks for.",
  "Ask what information is safe to share publicly and where the public should send tips.",
  "Keep private addresses, shelter locations, rumors, public accusations, and other unsafe details off public posts.",
  "Send investigative tips to police or the official tip contact, not to MMIPS."
];

export function CanadaResources() {
  return (
    <main className="container section resources-page plain-language-page">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Help for families</h1>
      <p className="lead">If someone you care about is missing, these steps can help you report it, keep important information organized, and share public information more safely.</p>

      <section className="notice safety-notice">
        <strong>If someone is missing or in danger</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
      </section>

      <section className="card resource-priority-card">
        <h2>What to do now</h2>
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
          <h3>Reporting a missing person</h3>
          <p>Read the RCMP&apos;s public guidance about reporting someone missing and why concerns should be reported promptly.</p>
          <a className="button secondary" href={CANADA_OFFICIAL_REFERENCE_URLS.rcmpMissingPersonGuidance} target="_blank" rel="noreferrer">Open RCMP guidance</a>
        </div>
        <div className="card">
          <h3>National missing-person resources</h3>
          <p>The National Centre for Missing Persons and Unidentified Remains supports police investigations and national information sharing. It does not replace a report to police.</p>
          <a className="button secondary" href={CANADA_OFFICIAL_REFERENCE_URLS.rcmpNationalCentre} target="_blank" rel="noreferrer">Open national centre information</a>
        </div>
      </section>

      <section className="card plain-language-section">
        <h2>Keep a simple family record</h2>
        <p>Use the MMIPS family record to keep names, numbers, calls, and approved public information together. You can type into it on this device, print a blank copy to fill out by hand, or download the fillable PDF.</p>
        <p><strong>The record stays with you.</strong> The web page does not send or save what you type. Keep a completed copy private and share it only with people or services you trust.</p>
        <div className="button-row">
          <Link className="button" href="/resources/family-record">Open printable family record</Link>
          <a className="button secondary" href="/forms/mmips-canada-family-record.pdf" download>Download fillable PDF</a>
        </div>
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
          <div><h3>Helpful to share</h3><p>Approved photos, an official police contact, a broad public area, a police file number when approved, and a current public profile or flyer.</p></div>
          <div><h3>Keep private</h3><p>Private addresses, shelters, domestic-violence locations, exact sensitive locations, rumors, public suspect accusations, and graphic or unsafe details.</p></div>
          <div><h3>Where tips go</h3><p>Use the police service or official tip contact shown on the public profile. Use 911 for immediate danger. Do not send investigative tips to MMIPS.</p></div>
        </div>
      </section>

      <section className="card plain-language-section">
        <h2>Use the MMIPS map and profiles</h2>
        <p>MMIPS can help people find public information without showing exact private locations. The Canada map can also show public U.S. results near the border.</p>
        <div className="button-row"><Link className="button" href="/profiles">Search profiles and map</Link><Link className="button secondary" href="/how-it-works">How MMIPS works</Link></div>
      </section>

      <section className="card plain-language-section">
        <h2>Contact MMIPS Canada</h2>
        <p>General: <a href="mailto:contact@mmips.com">contact@mmips.com</a><br />Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a></p>
        <p><strong>Do not email emergency or investigative tips to MMIPS.</strong></p>
      </section>
    </main>
  );
}
