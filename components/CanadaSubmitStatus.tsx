import Link from "next/link";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "@/lib/canada-config";

export function CanadaSubmitStatus() {
  return (
    <main className="container section plain-language-page">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Submit information</h1>
      <p className="lead">New Canadian case submissions are not open yet. You can still search profiles, use the map, find family resources, and ask us to review information that is already public.</p>

      <section className="notice safety-notice">
        <strong>Do not wait for MMIPS to report someone missing.</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
      </section>

      <section className="card notice warning" role="status" aria-live="polite">
        <h2>Canadian case submissions are currently closed</h2>
        <p>Please do not email private case details, photographs, addresses, witness information, or investigative tips while the submission form is closed.</p>
        <p>When Canadian submissions open, the form will appear on this page.</p>
      </section>

      <section className="feature-grid">
        <div className="card"><h2>What you can do now</h2><p>Search public profiles and the map, including public cross-border results, and use the family-resource page for reporting and safety guidance.</p><div className="button-row"><Link className="button secondary" href="/profiles">Search profiles and map</Link><Link className="button secondary" href="/resources">Family resources</Link></div></div>
        <div className="card"><h2>Is a public profile wrong or unsafe?</h2><p>Ask MMIPS to review public information that needs to be corrected, hidden, updated, or removed.</p><a className="button secondary" href="mailto:corrections@mmips.com?subject=MMIPS%20Canada%20public%20profile%20review">Request a profile review</a></div>
      </section>
    </main>
  );
}
