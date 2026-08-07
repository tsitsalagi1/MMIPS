import { SafetyNotice } from "../../components/SafetyNotice";
import { PublicMapExperience } from "../../components/map/PublicMapExperience";
import { getPublishedCases } from "../../lib/cases";
import { getPublicMapPoints } from "../../lib/public-map";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [profiles, loadedPoints] = await Promise.all([getPublishedCases(), getPublicMapPoints()]);
  const listedProfileIds = new Set(profiles.map((profile) => profile.id));
  const points = loadedPoints.filter((point) => listedProfileIds.has(point.publicId));

  return (
    <main className="container section">
      <h1>MMIPS public map</h1>
      <p className="lead">Use the map view to see broad public-awareness areas and profile types. Public locations should stay approximate and safety-filtered.</p>
      <SafetyNotice />
      <PublicMapExperience points={points} profiles={profiles} />
    </main>
  );
}
