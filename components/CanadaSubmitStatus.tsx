import Link from "next/link";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "@/lib/canada-config";

export function CanadaSubmitStatus() {
  return (
    <main className="container section plain-language-page">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Submit information for review</h1>
      <p className="lead">The Canadian public site is open for search and resources, but real-person Canadian case intake is still release-gated while the final privacy, governance, bilingual-language, moderation, storage, and operational checks are completed.</p>

      <section className="notice safety-notice">
        <strong>Do not wait for MMIPS Canada to report a missing person.</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
      </section>

      <section className="card notice warning" role="status" aria-live="polite">
        <h2>New Canadian case submissions are not open yet</h2>
        <p>Please do not send private case details, photographs, addresses, witness information, or investigative tips by email while intake is closed.</p>
        <p>MMIPS Canada will show a reviewed Canadian intake form here only after the Canadian release gates are completed and deliberately enabled.</p>
      </section>

      <section className="feature-grid">
        <div className="card"><h2>What is available now</h2><p>Search the Canadian public profile map, read Canadian family resources, and review how Canadian publication and privacy controls work.</p><Link className="button secondary" href="/profiles">Search Canadian profiles</Link></div>
        <div className="card"><h2>Corrections to public information</h2><p>If an already-public Canadian profile is wrong, unsafe, outdated, or should be suppressed, contact the correction channel without sending unrelated private case details.</p><a className="button secondary" href="mailto:corrections@mmips.com?subject=MMIPS%20Canada%20public%20profile%20review">Request public-profile review</a></div>
      </section>
    </main>
  );
}
