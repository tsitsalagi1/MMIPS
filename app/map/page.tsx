import { SafetyNotice } from "../../components/SafetyNotice";
import PublicMapExperience from "../../components/map/PublicMapExperience";

export default function MapPage() {
  return (
    <main className="container section">
      <h1>MMIPS public map</h1>
      <p className="lead">Explore moderator-approved, approximate public-awareness areas without exposing exact or sensitive locations.</p>
      <SafetyNotice />
      <PublicMapExperience points={[]} availability="available" />
    </main>
  );
}
