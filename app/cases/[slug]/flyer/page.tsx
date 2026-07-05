import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStatusBadge, VerificationBadge } from "../../../../components/StatusBadge";
import { FlyerActions } from "../../../../components/FlyerActions";
import { getCaseBySlug } from "../../../../lib/cases";

export const dynamic = "force-dynamic";

export default async function CaseFlyerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mmips.com";
  const caseUrl = `${siteUrl}/cases/${item.slug}`;
  const flyerTitle = item.status === "missing" ? "Missing Indigenous Person" : "MMIPS Case Notice";

  return (
    <main className="flyer-page">
      <div className="flyer-shell">
        <div className="flyer-top no-print">
          <Link className="button secondary" href={`/cases/${item.slug}`}>Back to case page</Link>
          <FlyerActions />
        </div>

        <article className="flyer-sheet" aria-label={`${item.fullName} printable flyer`}>
          <header className="flyer-header">
            <img src="/mmips-hand-transparent.png" alt="" aria-hidden="true" />
            <div>
              <p className="flyer-eyebrow">MMIPS reviewed public case flyer</p>
              <h1>{flyerTitle}</h1>
            </div>
          </header>

          <section className="flyer-main-grid">
            <div className="flyer-photo-box">
              <img src={item.photoUrl || "/mmips-hand-white-bg.png"} alt={item.photoAltText || `${item.fullName} case image`} />
            </div>
            <div className="flyer-case-summary">
              <div className="case-header-line">
                <h2>{item.fullName}</h2>
                <CaseStatusBadge status={item.status} />
              </div>
              <p><strong>Last seen / location:</strong> {item.lastSeenLocation}</p>
              {item.lastSeenDate ? <p><strong>Date:</strong> {item.lastSeenDate}</p> : null}
              <p><strong>Age:</strong> {item.age ?? "Unknown"}</p>
              <p><strong>Tribal affiliation:</strong> {item.tribalAffiliation || "Not publicly listed"}</p>
              <p><strong>Lead agency:</strong> {item.leadAgency || "Unknown"}</p>
              <p><strong>Agency case #:</strong> {item.agencyCaseNumber || "Unknown"}</p>
              <p><strong>NamUs #:</strong> {item.namusNumber || "Unknown"}</p>
            </div>
          </section>

          <section className="flyer-notice-box">
            <h3>Tips / emergency information</h3>
            <p>{item.tipPhone || "Call 911 for emergencies. Use only the official tip line listed by the investigating agency."}</p>
            <p className="muted">Do not post rumors, suspect accusations, or unsafe private-location details publicly.</p>
          </section>

          <section className="flyer-notice-box">
            <h3>Case summary</h3>
            <p>{item.summary}</p>
          </section>

          <section className="flyer-verification-row">
            {item.verification.map((status) => <VerificationBadge key={status} status={status} />)}
          </section>

          <section className="flyer-case-link-box" aria-label="Online case link">
            <p className="flyer-link-label">View the live case page</p>
            <a className="flyer-case-link" href={caseUrl}>
              {caseUrl}
            </a>
            <p className="muted small-text">This web address is clickable in most saved PDFs and can also be typed manually from a printed flyer.</p>
          </section>

          <footer className="flyer-footer">
            <p><strong>MMIPS is not law enforcement.</strong> This flyer does not replace 911, a police report, NamUs, Tribal law enforcement, BIA MMU, FBI, or local authorities.</p>
            <p>Correction/removal requests: corrections@mmips.com · General contact: contact@mmips.com</p>
          </footer>
        </article>
      </div>
    </main>
  );
}
