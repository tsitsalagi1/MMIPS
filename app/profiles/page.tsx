import CanadaProfilesSearch from "@/components/CanadaProfilesSearch";
import ProfilesSearch from "@/components/ProfilesSearch";
import { SafetyNotice } from "@/components/SafetyNotice";
import { CANADA_PUBLIC_REPORTING_GUIDANCE } from "@/lib/canada-config";
import { mmipsSiteMode } from "@/lib/site-mode";

export default function ProfilesPage() {
  if (mmipsSiteMode() === "ca") return <CanadaProfilesPage />;

  return (
    <main className="container section">
      <h1>Search public profiles</h1>
      <p className="lead">Search reviewed MMIPS public profiles by name, city, Tribe, agency, status, state, or distance from a ZIP code.</p>
      <SafetyNotice />
      <ProfilesSearch />
    </main>
  );
}

function CanadaProfilesPage() {
  return (
    <main className="container section">
      <p className="eyebrow">MMIPS Canada</p>
      <h1>Search public profiles</h1>
      <p className="lead">Search reviewed Canadian MMIPS public profiles by name, Nation or community, locality, police service, status, province or territory, or distance from a Canadian postal code.</p>
      <section className="notice safety-notice" aria-label="Canadian reporting information">
        <strong>If someone is missing or in immediate danger</strong>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.emergency}</p>
        <p>{CANADA_PUBLIC_REPORTING_GUIDANCE.missingPerson}</p>
        <p>MMIPS Canada supports public awareness. It does not replace an official missing-person report.</p>
      </section>
      <CanadaProfilesSearch />
    </main>
  );
}
