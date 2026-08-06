import { SafetyNotice } from "../../components/SafetyNotice";
import PublicMapExperience from "../../components/map/PublicMapExperience";
import { getPublicMapPoints } from "../../lib/public-map";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const points = await getPublicMapPoints();
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  const attribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION;
  return (
    <main className="container section">
      <h1>MMIPS public map and accessible list</h1>
      <p className="lead">Explore moderator-approved, approximate public-awareness areas without exposing exact or sensitive locations.</p>
      <SafetyNotice />
      <PublicMapExperience points={points} styleUrl={styleUrl} attribution={attribution} />
    </main>
  );
}
