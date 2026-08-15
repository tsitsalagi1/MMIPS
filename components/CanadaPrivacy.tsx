export function CanadaPrivacy() {
  return (
    <main className="container section legal-body plain-language-page">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Privacy in Canada</h1>
      <p className="lead">This page explains what MMIPS Canada may show publicly, what stays private, and how to ask for a correction or removal.</p>
      <p className="muted">Last updated August 15, 2026. Privacy requirements can vary by organization, activity, province or territory, and the facts of a situation.</p>

      <h2>What can appear publicly</h2>
      <p>Only information cleared for public awareness should appear on a profile or map. That may include a person&apos;s public name, an approved photo, status, a broad public area, approved First Nations, Inuit or Métis affiliation information, and an official contact for tips.</p>

      <h2>What stays private</h2>
      <p>Raw submissions, family or submitter contact information, private notes, exact sensitive locations, internal review records, privacy requests, and other information not approved for public sharing are not intended for public display.</p>

      <h2>Map locations are approximate</h2>
      <p>The public map does not need a private home address or exact sensitive coordinate. Homes, shelters, domestic-violence locations, witness or family locations, and other unsafe exact places should not be shown publicly.</p>

      <h2>First Nations, Inuit and Métis information</h2>
      <p>Affiliation information can be sensitive. MMIPS Canada should show it only when it is appropriate and approved for public display, using the Nation, community, Inuit region, or Métis government/community name that is appropriate for the person.</p>

      <h2>Photos</h2>
      <p>A photo does not become public simply because MMIPS has a copy. Public use should require permission and review for safety.</p>

      <h2>Corrections, access, and removal</h2>
      <p>People can ask MMIPS Canada to review information for access, correction, withdrawal of consent, hiding/suppression, or deletion or de-identification when appropriate. Public information can be taken out of view while a request is reviewed.</p>

      <h2>Collect and keep only what is needed</h2>
      <p>MMIPS Canada is designed to limit collection and retention to information needed for public awareness, safety, consent, moderation, corrections, and operating the service. Information should not be kept simply because it was technically possible to collect it.</p>

      <h2>Security</h2>
      <p>Personal information should receive protection appropriate to how sensitive it is. MMIPS separates private review information from the public-facing data used by the website and limits public access to information intended for public display.</p>

      <h2>Test data during development</h2>
      <p>MMIPS Canada may show clearly labelled synthetic test profiles while the Canadian site is being tested. Synthetic profiles are fictional and are not real people, real cases, or case statistics.</p>

      <h2>Service providers</h2>
      <p>MMIPS Canada currently uses Vercel for web hosting, a Canada-region Supabase project for private database and file-storage services, Resend for transactional email, Cloudflare Turnstile for anti-abuse checks, and MapTiler/MapLibre for the public map. These providers may process information needed to provide those services under their own terms.</p>

      <h2>Urgent email alerts</h2>
      <p>Alert subscribers provide an email address, a Canadian postal code, a distance choice, and an English or French language choice. MMIPS immediately reduces the postal code to its broad three-character Forward Sortation Area for matching. The subscriber list and matching area stay private. A confirmation email is required before alerts begin, and every alert includes an unsubscribe link.</p>
      <p>Postal-area matching is performed by MMIPS Canada using representative points adapted from Statistics Canada&apos;s 2021 Census Forward Sortation Area Boundary File. MMIPS does not send a Canadian postal code or subscriber email address to a geocoding service.</p>

      <h2>Canadian case submissions</h2>
      <p>Canadian submissions enter a private review queue. A submission is not a police report, does not become public automatically, and cannot create a public profile, photo, affiliation, or map point without a separate moderator decision. Submitters receive a reference number and may request correction, suppression, withdrawal, deletion, or de-identification review when appropriate.</p>

      <h2>Geography source notice</h2>
      <p>Adapted from Statistics Canada, 2021 Census Forward Sortation Area Boundary File. This does not constitute an endorsement by Statistics Canada of this product.</p>

      <h2>Contact</h2>
      <p>Privacy/legal: <a href="mailto:legal@mmips.com">legal@mmips.com</a><br />Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />General contact: <a href="mailto:contact@mmips.com">contact@mmips.com</a></p>
    </main>
  );
}
