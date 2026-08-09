import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "../lib/canada-config";
import { globalSiteUrl } from "../lib/site-mode";

export function CanadaHome() {
  return (
    <main>
      <section className="hero calm-hero">
        <div className="container hero-grid calm-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">MMIPS Canada · Preparing</p>
            <h1>A Canadian MMIPS system built around First Nations, Inuit and Métis communities.</h1>
            <p className="lead">
              MMIPS Canada is being built as a separate Canadian public-awareness system with its own database, map,
              reporting workflow, privacy controls, moderation, and country-specific terminology. It will not share the
              United States MMIPS case database.
            </p>
            <div className="button-row">
              <a className="button secondary" href={globalSiteUrl()}>Choose another country</a>
            </div>
          </div>
          <aside className="card hero-logo-panel" aria-label="MMIPS Canada data separation commitment">
            <img src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" />
            <h2>Canada-specific by design.</h2>
            <p>
              Canadian family, subscriber, moderation, and case data will stay in the Canadian MMIPS system rather than
              a worldwide or United States case database.
            </p>
          </aside>
        </div>
      </section>

      <section className="container section home-guidance" aria-label="Canadian missing-person reporting guidance">
        <section className="notice safety-notice" aria-label="Important Canadian reporting information">
          <strong>Need immediate help?</strong>
          <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
          <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
          <p>MMIPS Canada will be a public-awareness and family-support resource. It will not replace a police report or emergency service.</p>
        </section>

        <div className="guidance-grid">
          <div className="card calm-card">
            <h3>First Nations, Inuit and Métis are not one category</h3>
            <p>
              The Canadian system will preserve the distinctions among First Nations, Inuit and Métis Peoples and will
              prefer the proper name of a Nation, community, Inuit region, or Métis government/community when a family
              chooses to provide it.
            </p>
          </div>
          <div className="card calm-card">
            <h3>Canadian geography and search</h3>
            <p>
              Canada will use provinces and territories, Canadian postal codes, communities and localities, and kilometres.
              It will use Canadian case-reference and reporting fields rather than reusing United States-specific identifiers or geography fields.
            </p>
          </div>
          <div className="card calm-card">
            <h3>Canadian reporting context</h3>
            <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.nationalCoordination}</p>
          </div>
        </div>
      </section>

      <section className="container section" aria-label="MMIPS Canada prelaunch safeguards">
        <div className="card calm-panel">
          <p className="eyebrow">Prelaunch safeguards</p>
          <h2>Canadian intake stays closed until the Canadian system is independently ready.</h2>
          <p className="text-measure">
            This prelaunch portal does not accept case submissions, expose U.S. profiles, or connect to the U.S. MMIPS
            database. Before Canadian intake opens, MMIPS Canada must have its own database, Canadian privacy review,
            Canadian moderation process, bilingual launch plan, synthetic-data rehearsal, and security review.
          </p>
        </div>
      </section>

      <section className="container feature-grid support-grid" aria-label="Canada-specific launch design">
        <div className="card calm-card">
          <h3>Separate Canadian database</h3>
          <p>Case, family, subscriber, administrator, audit, and storage data will be isolated from every other country system.</p>
        </div>
        <div className="card calm-card">
          <h3>English and French launch readiness</h3>
          <p>Public instructions, safety language, consent, corrections, and privacy information must be reviewed for both official-language experiences before real intake opens.</p>
        </div>
        <div className="card calm-card">
          <h3>Community-preferred naming</h3>
          <p>The data model is being designed to preserve community- and Nation-preferred names rather than forcing U.S. Tribal terminology onto Canadian Indigenous Peoples.</p>
        </div>
      </section>
    </main>
  );
}
