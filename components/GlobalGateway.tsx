import { countryPortals } from "../lib/country-portals";

export function GlobalGateway() {
  const portals = countryPortals();

  return (
    <main>
      <section className="hero calm-hero">
        <div className="container hero-grid calm-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Missing & Murdered Indigenous People Search</p>
            <h1>Choose your country or region.</h1>
            <p className="lead">
              MMIPS is one worldwide Indigenous public-awareness network made up of separate country systems. Each country site is designed around its own Indigenous peoples, communities, reporting systems, laws, terminology, and safety needs.
            </p>
          </div>
          <aside className="card hero-logo-panel" aria-label="MMIPS federation commitment">
            <img src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" />
            <h2>One network. Separate country systems.</h2>
            <p>
              MMIPS Global does not hold a worldwide family or case database. Country systems keep their case information, administration, maps, alerts, and private data separated.
            </p>
          </aside>
        </div>
      </section>

      <section className="container section" aria-labelledby="country-heading">
        <div className="section-heading">
          <p className="eyebrow">Country & region portals</p>
          <h2 id="country-heading">Enter the MMIPS system designed for your country.</h2>
          <p className="muted text-measure">
            You can return here at any time to choose a different country. MMIPS does not automatically redirect visitors based on IP address or device location.
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
                <a className="button" href={portal.url}>Enter {portal.name} MMIPS</a>
              ) : (
                <p className="muted" role="status"><strong>Preparing.</strong> This country system is not accepting MMIPS submissions yet.</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="card calm-panel">
          <p className="eyebrow">Federated by design</p>
          <h2>Country-specific does not mean disconnected.</h2>
          <p className="text-measure">
            Every MMIPS country system follows shared minimum safety, privacy, accessibility, moderation, and accountability standards. Country systems may adopt stronger protections and country-specific requirements. Cross-border public-awareness sharing must use approved public information only; private family, subscriber, moderator, or investigative data is not copied into a global warehouse.
          </p>
        </div>
      </section>
    </main>
  );
}
