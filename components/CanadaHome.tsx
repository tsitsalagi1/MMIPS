import Link from "next/link";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "../lib/canada-config";
import { globalSiteUrl } from "../lib/site-mode";

export function CanadaHome() {
  return (
    <main>
      <section className="hero calm-hero">
        <div className="container hero-grid calm-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Missing & Murdered Indigenous People Search · Canada</p>
            <h1>Canadian public awareness built around First Nations, Inuit and Métis families and communities.</h1>
            <p className="lead">
              MMIPS Canada provides a separate Canadian place to search reviewed public profiles, see approved public-awareness map areas,
              find Canadian reporting resources, and understand how information is reviewed before publication.
            </p>
            <div className="button-row">
              <Link className="button" href="/profiles">Search Canadian profiles</Link>
              <Link className="button secondary" href="/resources">Family resources</Link>
              <a className="button secondary" href={globalSiteUrl()}>Change country</a>
            </div>
          </div>
          <aside className="card hero-logo-panel" aria-label="MMIPS Canada commitments">
            <img src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" />
            <h2>Canada-specific by design.</h2>
            <p>
              Canadian case, family, subscriber, moderation, and audit data use a separate Canadian database. Public map points are approved approximate awareness areas, never private exact locations.
            </p>
          </aside>
        </div>
      </section>

      <section className="container section home-guidance" aria-label="Canadian missing-person reporting guidance">
        <section className="notice safety-notice" aria-label="Important Canadian reporting information">
          <strong>Need immediate help?</strong>
          <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
          <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
          <p>MMIPS Canada is a public-awareness and family-support resource. It does not replace a police report or emergency service.</p>
        </section>

        <div className="guidance-grid">
          <div className="card calm-card">
            <h3>First Nations, Inuit and Métis are distinct</h3>
            <p>
              MMIPS Canada preserves those distinctions and can use the proper name of a Nation, community, Inuit region, or Métis government/community when publication is approved.
            </p>
          </div>
          <div className="card calm-card">
            <h3>Canadian geography and search</h3>
            <p>
              Search uses provinces and territories, Canadian postal codes, communities and localities, and kilometres. The Canadian system does not reuse U.S.-specific ZIP, state, NamUs, or Tribal-notification fields as Canadian defaults.
            </p>
          </div>
          <div className="card calm-card">
            <h3>Canadian reporting context</h3>
            <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.nationalCoordination}</p>
          </div>
        </div>
      </section>

      <section className="container section review-flow" aria-label="How MMIPS Canada works">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Public information is reviewed before it appears.</h2>
          <p className="muted text-measure">The Canadian system keeps private intake and public display separate. Approval of a case does not automatically put it on the public profile page or map.</p>
        </div>
        <div className="feature-grid aligned-grid">
          <div className="card flow-card"><span className="stat-number">1</span><h3>Start with official reporting</h3><p>Contact the police service of jurisdiction when someone is missing or there are concerns for their safety. Use 911 for immediate danger.</p></div>
          <div className="card flow-card"><span className="stat-number">2</span><h3>Review for safety and permission</h3><p>MMIPS Canada separates private review information from public facts, affiliation information, photos, and map areas.</p></div>
          <div className="card flow-card"><span className="stat-number">3</span><h3>Release only approved public information</h3><p>A profile and map point require separate release gates. Suppression or correction review can remove unsafe or no-longer-authorized information from public view.</p></div>
        </div>
      </section>

      <section className="container section public-empty-state">
        <div className="card calm-panel">
          <p className="eyebrow">Canadian public profiles</p>
          <h2>The Canada map uses the same MMIPS map experience with Canadian data.</h2>
          <p className="text-measure">Search and map results come only from the Canadian MMIPS database. The map displays approved approximate public-awareness areas and includes a complete text alternative when the visual map is unavailable.</p>
          <div className="button-row">
            <Link className="button" href="/profiles">Open Canada profile search and map</Link>
            <Link className="button secondary" href="/how-it-works">Read how review works</Link>
          </div>
        </div>
      </section>

      <section className="container feature-grid support-grid">
        <div className="card calm-card"><h3>Separate Canadian database</h3><p>Canadian case and family information stays isolated from the U.S. system and the data-less Global country gateway.</p></div>
        <div className="card calm-card"><h3>Privacy before publication</h3><p>Public profiles, Indigenous affiliation details, photos, sources, and map points each remain subject to explicit release and permission controls.</p></div>
        <div className="card calm-card"><h3>New case intake remains gated</h3><p>The public Canadian site can operate while real-person intake remains paused until Canadian privacy, governance, bilingual-language, moderation, and operational release checks are completed.</p></div>
      </section>
    </main>
  );
}
