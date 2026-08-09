import { SafetyNotice } from "../../components/SafetyNotice";
import ProfilesSearch from "../../components/ProfilesSearch";
import { getPublishedCases } from "../../lib/cases";

export const dynamic = "force-dynamic";
const INITIAL_PROFILE_LIMIT = 24;

export default async function ProfilesPage() {
  const profiles = (await getPublishedCases()).slice(0, INITIAL_PROFILE_LIMIT);

  return (
    <main className="container section">
      <h1>Search public profiles</h1>
      <p className="lead">Search approved missing, murdered/unsolved, unidentified, and resolved Indigenous person public profiles by name, Tribe, agency, state or province, or distance from a U.S. ZIP code.</p>
      <SafetyNotice />
      <ProfilesSearch initialProfiles={profiles} />
    </main>
  );
}
