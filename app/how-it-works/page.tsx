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
      <p className="lead">MMIPS Canada keeps private review information separate from approved public awareness. A reviewed case does not become public automatically, and a public profile does not automatically receive a map point.</p>

      <section className="notice safety-notice"><strong>Official reporting comes first.</strong><p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p><p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p></section>

      <section className="feature-grid">
        <div className="card"><h2>1. Information is received privately</h2><p>When Canadian intake is authorized to open, submissions will enter the separate Canadian review system. The public will not see raw submissions.</p></div>
        <div className="card"><h2>2. Review permission and safety</h2><p>Reviewers check what can be shared, the appropriate police or official contact, safe location wording, Indigenous affiliation publication permission, and whether photos are authorized.</p></div>
        <div className="card"><h2>3. Release the public profile separately</h2><p>A profile needs review approval, a publication date, and the explicit Canadian public-profile release gate. A suppression request can remove it from public view without erasing the audit history.</p></div>
        <div className="card"><h2>4. Release the map point separately</h2><p>A Canadian public map point requires its own map-release gate plus a moderator-approved approximate location. Exact private coordinates are not used for public map display.</p></div>
      </section>

      <section className="card plain-language-section">
        <h2>First Nations, Inuit and Métis information</h2>
        <p>MMIPS Canada does not treat First Nations, Inuit and Métis Peoples as one interchangeable category. Public affiliation details are shown only when the specific affiliation record is approved for publication, and community-preferred names are used when available.</p>
      </section>

      <section className="card plain-language-section">
        <h2>Corrections, consent and privacy</h2>
        <p>The Canadian data model supports correction, withdrawal-of-consent, suppression, access, and deletion or de-identification review workflows. Public release should always be reversible when safety, consent, accuracy, or privacy requires review.</p>
        <p>Corrections or removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a></p>
        <p>Privacy questions: <a href="mailto:legal@mmips.com">legal@mmips.com</a></p>
      </section>

      <section className="card plain-language-section">
        <h2>What MMIPS Canada does not do</h2>
        <p>MMIPS Canada is not police, an emergency service, an investigative tip line, or a replacement for an official missing-person report. The RCMP National Centre for Missing Persons and Unidentified Remains supports national coordination and investigations but does not replace the police service of jurisdiction.</p>
        <div className="button-row"><Link className="button" href="/profiles">Search Canadian profiles</Link><Link className="button secondary" href="/resources">Family resources</Link></div>
      </section>
    </main>
  );
}
