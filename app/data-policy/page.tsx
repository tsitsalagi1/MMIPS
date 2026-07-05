import Link from "next/link";
import { SafetyNotice } from "../../components/SafetyNotice";

export default function DataPolicyPage() {
  return (
    <main className="container section legal-body">
      <h1>Data & Privacy Policy</h1>
      <p className="muted">Starter public policy draft. This is not legal advice. Have an attorney review before a broad public launch.</p>
      <p className="lead">
        MMIPS separates private intake data from approved public case data. The purpose is to help public awareness while protecting families,
        submitters, sensitive locations, and investigations.
      </p>
      <SafetyNotice />

      <h2>Data MMIPS may collect</h2>
      <ul>
        <li>Case information submitted for review.</li>
        <li>Submitter name, email, phone, and relationship to the case.</li>
        <li>Correction/removal requests.</li>
        <li>Admin review notes and audit logs.</li>
        <li>Technical security data needed for spam prevention and site operation.</li>
      </ul>

      <h2>Public data</h2>
      <p>
        Public case pages should contain only approved information intended for public awareness. Public pages should not include private submitter contact data, unsafe exact locations, or unverified accusations.
      </p>

      <h2>Private data</h2>
      <p>
        Private submissions, submitter contact information, internal review notes, correction requests, and admin audit records are intended for review and safety operations, not public display.
      </p>

      <h2>Security controls</h2>
      <ul>
        <li>Public submissions are reviewed before publication.</li>
        <li>Admin access is limited to allowlisted admin accounts.</li>
        <li>Spam protection is used on public forms.</li>
        <li>Public database access is limited by database policies so private submissions do not become public through normal site access.</li>
      </ul>

      <h2>Retention and deletion</h2>
      <p>
        MMIPS may retain submissions and audit logs to document review decisions, safety actions, and abuse prevention. Families and authorized contacts may request correction, hiding, or removal of public information.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy/legal notices: <a href="mailto:legal@mmips.com">legal@mmips.com</a><br />
        Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />
        General questions: <a href="mailto:contact@mmips.com">contact@mmips.com</a>
      </p>

      <div className="button-row">
        <Link className="button" href="/corrections">Request correction/removal</Link>
        <Link className="button secondary" href="/safety-policy">Safety Policy</Link>
      </div>
    </main>
  );
}
