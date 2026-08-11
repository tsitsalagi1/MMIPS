export function CanadaPrivacy() {
  return (
    <main className="container section legal-body">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Canada Privacy Policy</h1>
      <p className="muted">Last updated August 10, 2026. This page describes the Canadian MMIPS engineering and privacy baseline. Which Canadian privacy law applies can depend on the organization, activity, province or territory, and facts.</p>

      <h2>Separate Canadian system</h2>
      <p>MMIPS Canada uses a separate Canadian database for Canadian case, family, subscriber, moderation, privacy-request, and audit information. Canadian private data is not placed in the United States MMIPS database or the data-less Global country gateway.</p>

      <h2>Collect only what is needed</h2>
      <p>MMIPS Canada is designed around data minimization. Information collected for review should be limited to what is needed for the identified public-awareness, moderation, safety, consent, correction, or service purpose. Operational metadata is not intended to become permanent case history merely because it was technically available.</p>

      <h2>Public and private information</h2>
      <p>A private submission is not a public profile. Approval alone is not enough to publish. Canadian cases require an explicit public-profile release gate, and public map display requires a separate map-release gate plus a moderator-approved approximate map point.</p>

      <h2>Indigenous affiliation</h2>
      <p>First Nations, Inuit and Métis affiliation information is sensitive and is not automatically public. A specific affiliation record must have publication permission before the public system can display it. MMIPS Canada should use a family- or community-approved Nation, community, Inuit region, or Métis government/community name when available.</p>

      <h2>Locations</h2>
      <p>Exact or sensitive coordinates can be retained only for an authorized private purpose and are excluded from the public map. Public map points are separate approximate awareness locations. Homes, shelters, domestic-violence locations, witness or family locations, and other unsafe exact places are not intended for public display.</p>

      <h2>Photos</h2>
      <p>A photo is not publicly readable merely because it exists. Public profile photos require confirmed permission and a separate public-use flag, in addition to the case itself passing the Canadian public-profile release gate.</p>

      <h2>Corrections, access, consent and suppression</h2>
      <p>The Canadian data model supports requests for access, correction, withdrawal of consent, suppression of publication, and deletion or de-identification review. A suppression action can remove a profile and map point from public display while preserving an appropriate audit record.</p>

      <h2>Retention and safeguards</h2>
      <p>Personal information should be kept only as long as needed for its identified purpose and protected according to its sensitivity. The Canadian schema gives source IP information a short operational deletion deadline by default and separates private review data from public projections.</p>

      <h2>Service providers</h2>
      <p>MMIPS Canada uses third-party infrastructure to operate the site. Current architecture includes Vercel for web hosting, a Canada-region Supabase project for database services, MapTiler for public basemap resources rendered through MapLibre, and other providers only when the corresponding Canadian feature is deliberately enabled. Providers may process ordinary technical request information under their own terms.</p>

      <h2>Real-person intake</h2>
      <p>Real Canadian case intake remains separately release-gated. The public search and information site can operate without opening real-person submissions. MMIPS Canada will not represent intake as open until privacy, governance, bilingual-language, moderation, storage, security, and operational checks are complete.</p>

      <h2>Contact</h2>
      <p>Privacy/legal: <a href="mailto:legal@mmips.com">legal@mmips.com</a><br />Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />General contact: <a href="mailto:contact@mmips.com">contact@mmips.com</a></p>
    </main>
  );
}
