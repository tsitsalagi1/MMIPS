import Link from "next/link";
import { SafetyNotice } from "../../components/SafetyNotice";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "../../lib/canada-config";
import { mmipsSiteMode } from "../../lib/site-mode";

export default function HowItWorksPage() {
  if (mmipsSiteMode() === "ca") return <CanadaHowItWorks />;

  return (
    <main className="container section legal-body plain-language-page">
      <h1>How MMIPS works</h1>
      <p className="lead">MMIPS helps families, authorized advocates, Tribal representatives, and official contacts share reviewed public information safely. Nothing becomes public automatically.</p>
      <SafetyNotice />

      <section className="feature-grid">
        <div className="card"><h2>1. Send information for review</h2><p>Your submission goes into a private review queue. The public cannot see it.</p></div>
        <div className="card"><h2>2. Review for safety</h2><p>MMIPS checks permission to share, official or public sources, safe location wording, and the correct official contact for tips.</p></div>
        <div className="card"><h2>3. Publish only approved information</h2><p>Only reviewed public information appears on a profile. Submitter contact information, internal notes, and unsafe details stay private.</p></div>
        <div className="card"><h2>4. Correct or remove</h2><p>Families and authorized contacts can ask MMIPS to correct, hide, or remove public information.</p><Link href="/corrections">Request a correction or removal</Link></div>
      </section>

      <section className="card plain-language-section"><h2>What MMIPS does not do</h2><p>MMIPS is not law enforcement, an emergency service, or an official reporting system. It does not replace Tribal police, local law enforcement, NamUs, the BIA Missing and Murdered Unit, the FBI, or other official agencies.</p><p><strong>If someone is in immediate danger, call 911.</strong></p></section>
      <section className="card plain-language-section"><h2>What happens after you submit information?</h2><ol><li>MMIPS saves the submission privately.</li><li>A reviewer checks safety, permission to share, sources, and contact information.</li><li>The reviewer may approve it, reject it, ask for more information, or keep it private.</li><li>If approved, MMIPS creates a public profile using only the information cleared for public sharing.</li></ol></section>
      <section className="card plain-language-section"><h2>How community alerts work</h2><p>Community members can choose a ZIP code and distance for urgent MMIPS email alerts. A moderator must approve an alert before it is sent. Every alert links to the public profile and tells people where official tips should go.</p><p>MMIPS does not collect investigative tips by email.</p><div className="button-row"><Link className="button" href="/alerts">Sign up for alerts</Link><Link className="button secondary" href="/profiles">Search public profiles</Link></div></section>
      <section className="card plain-language-section"><h2>Help for families</h2><p>Family members and authorized contacts can use Family Resources, send information for review, or ask for a correction, safety change, status update, or removal review.</p><div className="button-row"><Link className="button" href="/resources">Family Resources</Link><Link className="button secondary" href="/submit">Submit information for review</Link><Link className="button secondary" href="/corrections">Request a correction or removal</Link></div></section>
      <section className="card plain-language-section"><h2>Contact MMIPS</h2><p>General questions: <a href="mailto:contact@mmips.com">contact@mmips.com</a></p><p>Corrections or removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a></p><p>Legal or privacy questions: <a href="mailto:legal@mmips.com">legal@mmips.com</a></p><p><strong>Case tips:</strong> use the official agency or tip contact on the public profile. Do not email case tips to MMIPS.</p></section>
    </main>
  );
}

function CanadaHowItWorks() {
  return (
    <main className="container section legal-body plain-language-page">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>How MMIPS Canada works</h1>
      <p className="lead">MMIPS helps people find reviewed public information while keeping sensitive family and case details out of public view.</p>

      <section className="notice safety-notice">
        <strong>Report a missing person first.</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
      </section>

      <section className="feature-grid">
        <div className="card"><h2>1. Report the person missing</h2><p>Contact the police service responsible for the area. Keep the police file number and the investigator or family-liaison contact.</p></div>
        <div className="card"><h2>2. Decide what is safe to share</h2><p>Public information may include an approved photo, a broad public area, the current status, and the official place where tips should go.</p></div>
        <div className="card"><h2>3. MMIPS reviews public information</h2><p>MMIPS checks safety, permission, wording, photos, and public location information before anything is shown on the site.</p></div>
        <div className="card"><h2>4. Update, correct, or remove</h2><p>Families and authorized contacts can ask for changes when information is wrong, unsafe, outdated, or should no longer be public.</p></div>
      </section>

      <section className="card plain-language-section">
        <h2>How the map works</h2>
        <p>The map uses approximate public-awareness areas instead of exact private locations. It does not show private homes, shelters, family locations, or sensitive exact coordinates.</p>
        <p>The Canada map can also show public MMIPS results from the United States. This helps people near the border see relevant public information without combining the countries&apos; private case records.</p>
      </section>

      <section className="card plain-language-section">
        <h2>First Nations, Inuit and Métis information</h2>
        <p>MMIPS Canada keeps these identities distinct. When affiliation information is shown, the goal is to use the Nation, community, Inuit region, or Métis government/community name that is appropriate for that person and approved for public display.</p>
      </section>

      <section className="card plain-language-section">
        <h2>What stays private</h2>
        <p>Raw submissions, family contact information, private notes, exact sensitive locations, internal review information, and other details not approved for public sharing stay private.</p>
        <p>Corrections or removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a></p>
        <p>Privacy questions: <a href="mailto:legal@mmips.com">legal@mmips.com</a></p>
      </section>

      <section className="card plain-language-section">
        <h2>What MMIPS Canada does not do</h2>
        <p>MMIPS is not police, an emergency service, or an investigative tip line. Send case tips to the police service or official tip contact listed on the public profile.</p>
        <div className="button-row"><Link className="button" href="/profiles">Search profiles and map</Link><Link className="button secondary" href="/resources">Family resources</Link></div>
      </section>
    </main>
  );
}
