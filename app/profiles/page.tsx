import { SafetyNotice } from "../../components/SafetyNotice";
import ProfilesSearch from "../../components/ProfilesSearch";
import { getPublishedCases } from "../../lib/cases";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const profiles = await getPublishedCases();

  return (
    <main className="container section">
      <h1>Search public profiles</h1>
      <p className="lead">Search approved missing, murdered/unsolved, unidentified, and resolved Indigenous person public profiles by name, Tribe, agency, state, or distance from a ZIP code.</p>
      <SafetyNotice />
      <ProfilesSearch initialProfiles={profiles} />
    </main>
  );
}
