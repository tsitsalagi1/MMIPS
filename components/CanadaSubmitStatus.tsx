import Link from "next/link";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "@/lib/canada-config";
import { canadaSubmissionIntakeModeFromEnv } from "@/lib/release-controls";
import { CanadaSubmissionForm } from "@/components/CanadaSubmissionForm";

export function CanadaSubmitStatus({ error }: { error?: string }) {
  const mode = canadaSubmissionIntakeModeFromEnv();
  return (
    <main className="container section plain-language-page">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Submit information for review</h1>
      <p className="lead">MMIPS Canada accepts information into a private review queue. Nothing becomes public automatically.</p>

      <section className="notice safety-notice">
        <strong>Do not wait for MMIPS to report someone missing.</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
      </section>

      {error ? <div className="notice warning"><strong>We could not process the submission.</strong><p>{error}</p></div> : null}

      {mode === "locked" ? (
        <section className="card notice warning" role="status" aria-live="polite">
          <h2>Canadian case submissions are currently closed</h2>
          <p>MMIPS Canada has temporarily paused its private intake system. Nothing has been lost and nothing becomes public automatically.</p>
          <p>Please do not email private case details, photographs, addresses, witness information, or investigative tips while intake is closed.</p>
        </section>
      ) : <CanadaSubmissionForm mode={mode} />}

      <section className="feature-grid" style={{ marginTop: 22 }}>
        <div className="card"><h2>Other ways to help</h2><p>Search approved public profiles, use Family Resources for reporting and safety guidance, or subscribe to urgent community alerts.</p><div className="button-row"><Link className="button secondary" href="/profiles">Search profiles and map</Link><Link className="button secondary" href="/alerts">Urgent alerts</Link><Link className="button secondary" href="/resources">Family resources</Link></div></div>
        <div className="card"><h2>Is a public profile wrong or unsafe?</h2><p>Ask MMIPS to review public information that needs to be corrected, hidden, updated, or removed.</p><a className="button secondary" href="mailto:corrections@mmips.com?subject=MMIPS%20Canada%20public%20profile%20review">Request a profile review</a></div>
      </section>
    </main>
  );
}
