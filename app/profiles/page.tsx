import { SafetyNotice } from "../../components/SafetyNotice";
import ProfilesSearch from "../../components/ProfilesSearch";
import CanadaProfilesSearch from "../../components/CanadaProfilesSearch";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "../../lib/canada-config";
import { mmipsSiteMode } from "../../lib/site-mode";

export default function ProfilesPage() {
  if (mmipsSiteMode() === "ca") return <CanadaProfilesPage />;

  return (
    <main className="container section">
      <h1>Search public profiles</h1>
      <p className="lead">See approved MMIPS public-awareness points across the United States and Canada, then search by name, Tribe, agency, status, state or province, or distance from a U.S. ZIP code.</p>
      <SafetyNotice />
      <ProfilesSearch />
    </main>
  );
}

function CanadaProfilesPage() {
  return (
    <main className="container section">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Search Canadian public profiles</h1>
      <p className="lead">Search reviewed Canadian MMIPS public-awareness profiles by name, Nation or community, locality, police service, status, province or territory, or distance from a Canadian postal code.</p>
      <section className="notice safety-notice" aria-label="Canadian reporting information">
        <strong>Need immediate help?</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
        <p>MMIPS Canada is not law enforcement and does not replace an official missing-person report.</p>
      </section>
      <CanadaProfilesSearch />
    </main>
  );
}
