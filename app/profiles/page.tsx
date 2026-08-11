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
      <p className="lead">See approved MMIPS public-awareness points across the United States, then search by name, Tribe, agency, status, state, or distance from a U.S. ZIP code.</p>
      <SafetyNotice />
      <ProfilesSearch />
    </main>
  );
}

function CanadaProfilesPage() {
  return (
    <main className="container section">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Search profiles and explore the map.</h1>
      <p className="lead">Search by name, public area, status, province or territory, or Canadian postal code. The map can also show public MMIPS results from the United States for cross-border awareness.</p>
      <section className="notice safety-notice" aria-label="Canadian reporting information">
        <strong>If someone is missing or in immediate danger</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
        <p>MMIPS helps with public awareness. It does not replace an official missing-person report.</p>
      </section>
      <CanadaProfilesSearch />
    </main>
  );
}