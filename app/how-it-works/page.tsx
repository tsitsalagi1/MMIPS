import Link from "next/link";
import { SafetyNotice } from "../../components/SafetyNotice";

export default function HowItWorksPage() {
  return (
    <main className="container section legal-body">
      <h1>How MMIPS works</h1>
      <p className="lead">
        MMIPS is a moderated public-awareness and accountability platform. It is built to help families,
        authorized advocates, Tribal representatives, and official contacts share reviewed submitted information
        without creating a rumor board or replacing official reporting systems.
      </p>
      <SafetyNotice />

      <section className="feature-grid">
        <div className="card">
          <h2>1. Submit for review</h2>
          <p>Submitted information go into a private review queue. They do not become public automatically.</p>
        </div>
        <div className="card">
          <h2>2. Safety check</h2>
          <p>MMIPS checks for family or authorized-submitter consent, public-source support, safe location wording, and official or family-approved tip contact information.</p>
        </div>
        <div className="card">
          <h2>3. Publish only approved facts</h2>
          <p>Only approved public fields appear on public profiles. Private submitter information, internal notes, and unsafe details stay private.</p>
        </div>
        <div className="card">
          <h2>4. Correct or remove</h2>
          <p>Families and authorized contacts can ask MMIPS to correct, hide, or remove public submitted information.</p>
        </div>
      </section>

      <h2>What MMIPS is not</h2>
      <p>
        MMIPS is not law enforcement, an emergency service, a police-reporting system, NamUs, NCIC, Tribal police,
        BIA MMU, FBI, or a substitute for any official authority. If someone is in immediate danger, call 911 first.
      </p>

      <h2>What happens after information is submitted?</h2>
      <ol>
        <li>The submission is saved privately for review.</li>
        <li>An admin reviews safety, consent, public-source support, and contact information.</li>
        <li>The admin may approve, reject, request more information, or keep the submission hidden.</li>
        <li>If approved, MMIPS creates a public profile with limited, reviewed public information.</li>
      </ol>

      <h2>Contact</h2>
      <p>
        General questions: <a href="mailto:contact@mmips.com">contact@mmips.com</a><br />
        Correction/removal requests: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />
        Legal/privacy notices: <a href="mailto:legal@mmips.com">legal@mmips.com</a><br />
        Public tip-related questions: <a href="mailto:tips@mmips.com">tips@mmips.com</a>
      </p>

      <div className="button-row">
        <Link className="button" href="/submit">Submit information for review</Link>
        <Link className="button secondary" href="/corrections">Request correction/removal</Link>
      </div>
    </main>
  );
}
