import { countryPortals } from "../lib/country-portals";

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
            <img src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" />
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
                <p className="muted" role="status"><strong>Coming soon.</strong> This country site is still being built and is not accepting submissions yet.</p>
              )}
            </article>
          ))}
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
