import { SafetyNotice } from "../../components/SafetyNotice";
import PublicMapExperience from "../../components/map/PublicMapExperience";
import { getPublicMapPoints } from "../../lib/public-map";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const mapResult = await getPublicMapPoints();
  return (
    <main className="container section">
      <h1>MMIPS public map</h1>
      <p className="lead">Explore moderator-approved, approximate public-awareness areas without exposing exact or sensitive locations.</p>
      <SafetyNotice />
      <PublicMapExperience points={mapResult.points} availability={mapResult.availability} />
    </main>
  );
}
