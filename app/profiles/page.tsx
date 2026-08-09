import { SafetyNotice } from "../../components/SafetyNotice";
import ProfilesSearch from "../../components/ProfilesSearch";

export default function ProfilesPage() {
  return (
    <main className="container section">
      <h1>Search public profiles</h1>
      <p className="lead">See approved MMIPS public-awareness points across the United States and Canada, then search by name, Tribe, agency, status, state or province, or distance from a U.S. ZIP code.</p>
      <SafetyNotice />
      <ProfilesSearch />
    </main>
  );
}
