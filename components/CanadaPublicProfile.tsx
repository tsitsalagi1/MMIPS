import Link from "next/link";
import { CANADA_PROVINCES_AND_TERRITORIES, CANADA_PUBLIC_REPORTING_GUIDANCE } from "@/lib/canada-config";
import { canadaAffiliationLabel, canadaStatusLabel, type CanadaPublicProfile } from "@/lib/canada-public";

function provinceName(code: string | null) {
  return CANADA_PROVINCES_AND_TERRITORIES.find((region) => region.code === code)?.name || code || "Canada";
}

function publicLocation(profile: CanadaPublicProfile) {
  return profile.publicArea
    || [profile.lastSeenLocality, provinceName(profile.provinceTerritory)].filter(Boolean).join(", ")
    || "Location not publicly listed";
}

function safeHttpsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function CanadaPublicProfileView({ profile }: { profile: CanadaPublicProfile }) {
  const affiliations = profile.affiliations.map(canadaAffiliationLabel).filter((value): value is string => Boolean(value));

  return (
    <main className="container section public-profile-page">
      {profile.synthetic ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — This is a fictional Canadian rehearsal profile, not a real person or real case. Do not send real tips.</p> : null}

      <div className="profile-hero">
        <div>
          <p className="muted">MMIPS Canada public profile</p>
          <h1>{profile.fullName}</h1>
          <p className="reading-measure">{canadaStatusLabel(profile.status)}</p>
        </div>
      </div>

      <section className="notice safety-notice" aria-label="Canadian reporting information">
        <strong>Need immediate help?</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
        <p>MMIPS Canada does not collect investigative tips and does not replace a police report.</p>
      </section>

      <section className="feature-grid profile-primary-facts" aria-label="Key public information">
        <div className="card">
          <h3>{profile.status === "homicide_unsolved" ? "Public area" : "Last seen / public area"}</h3>
          <p>{publicLocation(profile)}</p>
          {profile.lastSeenDate ? <p><strong>Last seen date:</strong> {profile.lastSeenDate}</p> : null}
          <p className="muted">Location detail is limited to an approved public-awareness area. Exact or sensitive coordinates are not shown.</p>
        </div>
        <div className="card">
          <h3>Police / official contact</h3>
          <p><strong>Police service:</strong> {profile.leadPoliceService || "Not publicly listed yet"}</p>
          <p><strong>Public tip contact:</strong> {profile.officialTipContact || "Use the investigating police service or 911 for immediate danger."}</p>
        </div>
        <div className="card">
          <h3>First Nations, Inuit or Métis affiliation</h3>
          {affiliations.length ? <ul>{affiliations.map((label) => <li key={label}>{label}</li>)}</ul> : <p>Not publicly listed.</p>}
          <p className="muted">Affiliation is shown only when its publication has been approved.</p>
        </div>
      </section>

      <section className="card">
        <h2>What is publicly known</h2>
        <p className="reading-measure">{profile.publicSummary || "No public summary has been released."}</p>
        {profile.lastPublicUpdate ? <p className="muted"><strong>Last public update:</strong> {profile.lastPublicUpdate}</p> : null}
      </section>

      {profile.officialReferences.length ? (
        <section className="card official-source-card">
          <h2>Official references</h2>
          <p className="reading-measure">These references were approved for public display. The investigating police service remains the source for investigative updates and tips.</p>
          <ul>
            {profile.officialReferences.map((reference, index) => {
              const url = safeHttpsUrl(reference.source_url);
              const label = [reference.agency_or_registry_name, reference.reference_number].filter(Boolean).join(" — ") || "Official reference";
              return <li key={`${reference.reference_type || "reference"}-${index}`}>{url ? <a href={url} target="_blank" rel="noreferrer noopener">{label}</a> : label}</li>;
            })}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>Location privacy</h2>
        <p><strong>Public location detail:</strong> {profile.locationPrecision.replaceAll("_", " ")}</p>
        <p className="muted reading-measure">MMIPS Canada does not publish exact private addresses, shelters, domestic-violence locations, or other sensitive locations that could put a person, family, or investigation at risk.</p>
      </section>

      <section className="card correction-cta">
        <h2>Need to correct, suppress, or remove information?</h2>
        <p className="reading-measure">Families and authorized contacts can ask MMIPS Canada to review incorrect, unsafe, outdated, or no-longer-authorized public information.</p>
        <a className="button secondary" href="mailto:corrections@mmips.com?subject=MMIPS%20Canada%20profile%20review%20request">Contact MMIPS Canada for a review</a>
      </section>

      <div className="button-row">
        <Link className="button secondary" href="/profiles">Back to Canada profile search</Link>
      </div>
    </main>
  );
}
