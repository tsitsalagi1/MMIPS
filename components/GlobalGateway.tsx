import Image from "next/image";
import { countryPortals } from "../lib/country-portals";
import { GLOBAL_DATA_GAP, GLOBAL_MMIP_EVIDENCE } from "../lib/global-evidence";

export function GlobalGateway() {
  const portals = countryPortals();

  return (
    <main>
      <section className="hero calm-hero">
        <div className="container hero-grid calm-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Missing & Murdered Indigenous People Search</p>
            <h1>Find the MMIPS site for your country.</h1>
            <p className="lead">
              MMIPS helps families and communities share reviewed public information about missing and murdered Indigenous people. Choose a country below to use the site built for that country&apos;s communities, reporting systems, and safety needs.
            </p>
          </div>
          <aside className="card hero-logo-panel" aria-label="How MMIPS country sites work">
            <Image src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" width={1024} height={1024} priority />
            <h2>Your country, your MMIPS site.</h2>
            <p>
              Each country has its own MMIPS site and keeps its case information separate. This global page only helps you choose where to go.
            </p>
          </aside>
        </div>
      </section>

      <section className="container section" aria-labelledby="country-heading">
        <div className="section-heading">
          <p className="eyebrow">Choose a country</p>
          <h2 id="country-heading">Where would you like to go?</h2>
          <p className="muted text-measure">
            Select the country you need. You can come back here anytime to switch countries.
          </p>
        </div>

        <div className="feature-grid aligned-grid">
          {portals.map((portal) => (
            <article className="card calm-card" key={portal.code}>
              <p className="eyebrow">{portal.code}</p>
              <h3>{portal.name}</h3>
              <p><strong>{portal.indigenousContext}</strong></p>
              <p>{portal.description}</p>
              {portal.status === "active" && portal.url ? (
                <a className="button" href={portal.url}>Go to MMIPS {portal.name}</a>
              ) : (
                <p className="muted" role="status"><strong>{portal.developmentPriority === "next" ? "Next in development." : "Planned for later."}</strong> This country site is not accepting submissions.</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="container section" aria-labelledby="evidence-heading">
        <div className="section-heading">
          <p className="eyebrow">What official evidence shows</p>
          <h2 id="evidence-heading">The crisis is documented. The data are incomplete.</h2>
          <p className="muted text-measure">These dated figures come from official public sources. They use different definitions and time periods, so do not add them together or treat them as a worldwide total.</p>
        </div>
        <div className="feature-grid aligned-grid global-evidence-grid">
          {GLOBAL_MMIP_EVIDENCE.map((item) => (
            <article className="card calm-card" key={item.region}>
              <p className="eyebrow">{item.region}</p>
              <p className="evidence-figure" aria-label={`${item.figure}: ${item.heading}`}>{item.figure}</p>
              <h3>{item.heading}</h3>
              <p>{item.summary}</p>
              <p className="muted"><strong>Scope:</strong> {item.scope}</p>
              <a href={item.sourceUrl} target="_blank" rel="noreferrer">Read the official source: {item.sourceLabel}</a>
            </article>
          ))}
        </div>
        <div className="card calm-panel global-data-gap">
          <p className="eyebrow">The global data gap</p>
          <h3>{GLOBAL_DATA_GAP.figure}</h3>
          <p>{GLOBAL_DATA_GAP.summary}</p>
          <p>{GLOBAL_DATA_GAP.context}</p>
          <a href={GLOBAL_DATA_GAP.sourceUrl} target="_blank" rel="noreferrer">Read the official source: {GLOBAL_DATA_GAP.sourceLabel}</a>
        </div>
      </section>

      <section className="container section" aria-labelledby="roadmap-heading">
        <div className="card calm-panel">
          <p className="eyebrow">Development roadmap</p>
          <h2 id="roadmap-heading">Mexico next, then South America country by country.</h2>
          <p className="text-measure">MMIPS will not place South American countries into one shared case system. After Mexico, planning should proceed with Indigenous communities and local experts in each country, with separate reporting paths, language access, privacy rules, moderation, infrastructure, and data.</p>
          <p className="muted text-measure">No future country or South America planning page accepts submissions or case information.</p>
        </div>
      </section>

      <section className="container section">
        <div className="card calm-panel">
          <p className="eyebrow">Why separate country sites?</p>
          <h2>Built around local communities and systems.</h2>
          <p className="text-measure">
            Indigenous communities, reporting agencies, privacy rules, and support resources differ from country to country. Each MMIPS country site is built around those local needs while following the same core safety and privacy standards. When a case needs cross-border awareness, only approved public information is shared.
          </p>
        </div>
      </section>
    </main>
  );
}
