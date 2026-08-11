import Link from "next/link";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "../lib/canada-config";
import { globalSiteUrl } from "../lib/site-mode";

export function CanadaHome() {
  return (
    <main>
      <section className="hero calm-hero">
        <div className="container hero-grid calm-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">MMIPS Canada</p>
            <h1>Find missing and murdered Indigenous people in Canada.</h1>
            <p className="lead">
              Search public profiles, explore the map, find family resources, and see public information from nearby U.S. cases when it may help across the border.
            </p>
            <div className="button-row">
              <Link className="button" href="/profiles">Search profiles and map</Link>
              <Link className="button secondary" href="/resources">Family resources</Link>
              <a className="button secondary" href={globalSiteUrl()}>Change country</a>
            </div>
          </div>
          <aside className="card hero-logo-panel" aria-label="MMIPS Canada public map information">
            <img src="/mmips-hand-transparent.png" alt="MMIPS red handprint logo" className="hero-logo" />
            <h2>Public awareness should not stop at the border.</h2>
            <p>
              The Canada map can show public MMIPS information from both Canada and the United States while private family and case information stays protected.
            </p>
          </aside>
        </div>
      </section>

      <section className="container section home-guidance" aria-label="Canadian missing-person reporting guidance">
        <section className="notice safety-notice" aria-label="Important Canadian reporting information">
          <strong>If someone is missing or in danger</strong>
          <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
          <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
          <p>MMIPS helps with public awareness. It does not replace police or emergency services.</p>
        </section>

        <div className="guidance-grid">
          <div className="card calm-card">
            <h3>Search profiles</h3>
            <p>Look by name, public area, status, province or territory, or distance from a Canadian postal code.</p>
            <div className="button-row"><Link className="button secondary" href="/profiles">Search now</Link></div>
          </div>
          <div className="card calm-card">
            <h3>Find help for families</h3>
            <p>See practical steps for reporting someone missing, keeping records, and deciding what is safe to share publicly.</p>
            <div className="button-row"><Link className="button secondary" href="/resources">Open family resources</Link></div>
          </div>
          <div className="card calm-card">
            <h3>Protect private information</h3>
            <p>Public map locations are approximate. MMIPS does not show private homes, shelters, family locations, or exact sensitive coordinates.</p>
            <div className="button-row"><Link className="button secondary" href="/privacy">Read about privacy</Link></div>
          </div>
        </div>
      </section>

      <section className="container section review-flow" aria-label="How MMIPS Canada works">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Simple public information, with safety checks behind it.</h2>
        </div>
        <div className="feature-grid aligned-grid">
          <div className="card flow-card"><span className="stat-number">1</span><h3>Report the person missing</h3><p>Contact the police service responsible for the area. You do not need to wait 24 hours.</p></div>
          <div className="card flow-card"><span className="stat-number">2</span><h3>Share only safe public details</h3><p>Use approved photos, a broad public area, and the official contact where tips should go. Keep sensitive details private.</p></div>
          <div className="card flow-card"><span className="stat-number">3</span><h3>Keep the profile current</h3><p>Families and authorized contacts can ask MMIPS to correct, hide, or remove public information when something changes.</p></div>
        </div>
        <div className="button-row"><Link className="button secondary" href="/how-it-works">Read how MMIPS Canada works</Link></div>
      </section>

      <section className="container section public-empty-state">
        <div className="card calm-panel">
          <p className="eyebrow">Canada + United States</p>
          <h2>See public information on one map near the border.</h2>
          <p className="text-measure">
            A person may travel across the border or be found close to it. The Canada map can include public MMIPS results from the United States so nearby communities are not hidden by a country line.
          </p>
          <p className="text-measure">Only information already cleared for public display is shared between the country sites.</p>
          <div className="button-row">
            <Link className="button" href="/profiles">Open the map and profiles</Link>
          </div>
        </div>
      </section>

      <section className="container feature-grid support-grid" aria-label="Canadian Indigenous communities and public information">
        <div className="card calm-card"><h3>First Nations</h3><p>Use the Nation or community name chosen for public display when that information is available and approved.</p></div>
        <div className="card calm-card"><h3>Inuit</h3><p>Use community and Inuit-region names accurately rather than forcing U.S. Tribal language onto Canadian profiles.</p></div>
        <div className="card calm-card"><h3>Métis</h3><p>Use the appropriate Métis government or community name when it is provided and approved for public display.</p></div>
      </section>
    </main>
  );
}
