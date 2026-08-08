import Link from "next/link";
import { SafetyNotice } from "../../components/SafetyNotice";

export default function DataPolicyPage() {
  return (
    <main className="container section legal-body">
      <h1>Data & Privacy Policy</h1>
      <p className="muted">Last updated August 8, 2026. This page summarizes MMIPS&apos;s current public/private data boundaries and safety controls.</p>
      <p className="lead">
        MMIPS separates private intake, subscriber, and moderation data from approved public profile data so public awareness does not require exposing contact details, unsafe exact locations, or internal review records.
      </p>
      <SafetyNotice />

      <h2>Private intake and review data</h2>
      <ul>
        <li>Submitted information awaiting review, submitter contact information, relationship/authorization details, and private safety notes.</li>
        <li>Family-approved photographs while they are being reviewed for permission and safety.</li>
        <li>Correction/removal requests, moderator review notes, and audit records.</li>
        <li>Urgent-alert subscriber email addresses, ZIP/radius preferences, generalized Census ZIP-area reference coordinates, consent records, and delivery history.</li>
        <li>Limited anti-abuse counters stored as keyed hashes rather than raw requester identifiers.</li>
      </ul>

      <h2>Approved public profile data</h2>
      <p>Public profiles contain only reviewed fields intended for public awareness. Public pages do not intentionally expose private submitter or subscriber contact data, moderator-only notes, exact private locations, or unverified accusations.</p>

      <h2>Public map and ZIP-distance data are separate</h2>
      <p>The visual map and ZIP-distance search do not derive coordinates from private case-location fields. Moderator-approved public map points are stored in a separate relation and are deliberately approximate. A published profile may exist without any map point and therefore may not appear in ZIP-distance results.</p>
      <p>For subscriber and profile ZIP-distance functions, MMIPS sends only a five-digit ZIP code from the server to the U.S. Census Bureau TIGERweb service to obtain a generalized ZIP Code Tabulation Area reference point. MMIPS does not request a street address or browser/device GPS location for this function.</p>

      <h2>Urgent community alert separation</h2>
      <p>The community alert list is separate from family/profile-management correspondence. A raw submission cannot automatically send an urgent public alert. A moderator must first approve and publish the profile, approve a deliberately approximate public map point, mark the case for urgent public awareness, review the matched audience, and explicitly confirm the send.</p>

      <h2>Photo protections</h2>
      <p>Private photo intake is limited by file count, size, image type, signature, image dimensions, and metadata checks. Images with embedded EXIF/XMP/text metadata that could expose location or device information are rejected before storage. Public use still requires moderator approval.</p>

      <h2>Access and database controls</h2>
      <ul>
        <li>Public submissions and correction/removal requests are reviewed before public information changes.</li>
        <li>Administrative actions require authenticated, allowlisted admin access and enrolled admin MFA is enforced at AAL2.</li>
        <li>Private tables have public database grants removed and are protected by database row-level-security boundaries.</li>
        <li>Public map reads are restricted to the approved public projection; map writes use the server-side moderator workflow.</li>
        <li>Urgent alert subscriber preferences and dispatch records are service-role-only database data.</li>
        <li>Public forms use anti-abuse verification and distributed rate limits.</li>
      </ul>

      <h2>Third-party infrastructure</h2>
      <p>Current infrastructure includes Vercel, Supabase, Resend, Cloudflare Turnstile, MapTiler/MapLibre, and the U.S. Census Bureau TIGERweb geography service. These providers receive only the information required for their role in hosting, storage/authentication, email delivery, anti-abuse verification, public map rendering, or generalized ZIP-area lookup.</p>

      <h2>Retention, correction, and removal</h2>
      <p>MMIPS retains records as needed to document moderation, consent, safety decisions, alert delivery, correction/removal handling, and service security. Short-lived abuse counters are designed for limited retention. Families and authorized contacts may request correction, hiding, or removal of public information. Alert subscribers may unsubscribe without an account or explanation.</p>

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
