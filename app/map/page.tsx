import { SafetyNotice } from "../../components/SafetyNotice";
import PublicMapExperience from "../../components/map/PublicMapExperience";
import { getPublishedCases } from "../../lib/cases";
import { getPublicMapPoints } from "../../lib/public-map";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [profiles, mapResult] = await Promise.all([
    getPublishedCases(),
    getPublicMapPoints()
  ]);
  return (
    <main className="container section">
      <h1>MMIPS public map and accessible list</h1>
      <p className="lead">Explore moderator-approved, approximate public-awareness areas without exposing exact or sensitive locations.</p>
      <SafetyNotice />
      <PublicMapExperience profiles={profiles} points={mapResult.points} availability={mapResult.availability} />
    </main>
  );
}
