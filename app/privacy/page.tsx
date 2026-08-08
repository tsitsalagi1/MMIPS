export default function PrivacyPage() {
  return (
    <main className="container section legal-body">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated August 8, 2026. This policy describes MMIPS&apos;s current site practices. It does not replace legal advice from your own attorney.</p>

      <h2>What MMIPS is</h2>
      <p>MMIPS is a moderated public-awareness and family-support resource. It is not law enforcement, an emergency service, a tip line, or an official missing-person reporting system.</p>

      <h2>Information MMIPS may collect</h2>
      <p>MMIPS may collect information submitted for review, submitter contact information and relationship, family-approved photographs, correction/removal requests, community alert email/ZIP/distance preferences and consent records, moderator review records, and limited technical security data needed to protect the service.</p>

      <h2>Public and private information</h2>
      <p>Submitting information does not make it public. Public profiles contain only information approved for public awareness after moderation. Submitter contact information, subscriber information, private notes, sensitive or exact locations, internal safety review, correction requests, and administrative records are not intended for public display.</p>

      <h2>Locations and the public map</h2>
      <p>MMIPS does not publish exact private map coordinates through the public map. Any map point must be separately reviewed as a deliberately approximate public-awareness area. Homes, shelters, incident or recovery sites, witness or family locations, and investigative locations should not be placed on the public map.</p>

      <h2>Photos and metadata</h2>
      <p>Uploaded photos remain private during review. MMIPS accepts only limited image types and rejects images containing embedded EXIF/XMP/text metadata that could expose location or device information. Images selected for public use remain subject to moderator safety and permission review.</p>

      <h2>Urgent community email alerts</h2>
      <p>Urgent community alerts use double opt-in. A subscription is not active until the confirmation step is completed. Subscribers may choose a five-digit ZIP code and a distance preference. MMIPS uses that ZIP code to obtain a generalized U.S. Census Bureau ZIP Code Tabulation Area reference point; it does not request a street address or browser/device GPS location for alert matching. The server sends the ZIP code, not the subscriber&apos;s email address, to the Census TIGERweb geography service.</p>
      <p>Subscriber email addresses, ZIP codes, generalized ZIP-area coordinates, distance preferences, consent history, and delivery records are private service data. They are not placed on public profiles or the public map. Community alert subscribers are maintained separately from family/profile-administration correspondence. Every urgent alert includes an unsubscribe process. MMIPS does not currently offer SMS alerts through this Version 1 site.</p>

      <h2>Security and abuse prevention</h2>
      <p>Public forms use anti-abuse verification and rate limiting. MMIPS&apos;s application-level rate-limit counters use keyed hashes rather than storing raw requester IP or email values in the counter table. Raw source IP is not stored with new public submissions by the current application workflow.</p>

      <h2>Service providers</h2>
      <p>MMIPS uses third-party infrastructure to operate the site. Current providers include Vercel for web hosting, Supabase for database/storage/authentication services, Resend for transactional email, Cloudflare Turnstile for anti-abuse verification, MapTiler for public basemap resources rendered through MapLibre, and the U.S. Census Bureau TIGERweb service for generalized ZIP-area geography. When your browser or the MMIPS server communicates with these providers, they may process ordinary technical request information under their own privacy and security terms.</p>

      <h2>Retention, corrections, and removal</h2>
      <p>MMIPS retains records as needed for moderation, safety, consent, correction/removal handling, auditability, alert delivery, and abuse prevention. Short-lived abuse counters are designed for limited retention. Families and authorized representatives may request correction, hiding, or removal of public information through the correction/removal process. Alert subscribers may unsubscribe without an account or explanation.</p>

      <h2>Children</h2>
      <p>Only adults should submit information or subscribe to alerts. MMIPS should not knowingly collect personal information directly from children under 13 through these forms.</p>

      <h2>Contact</h2>
      <p>Privacy/legal notices: <a href="mailto:legal@mmips.com">legal@mmips.com</a><br />Correction/removal requests: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />General contact: <a href="mailto:contact@mmips.com">contact@mmips.com</a></p>
    </main>
  );
}
