import { SafetyNotice } from "../../components/SafetyNotice";

export default function MapPage() {
  return (
    <main className="container section">
      <h1>MMIPS map</h1>
      <p className="lead">The public map should use approximate, safety-filtered locations. Do not expose exact home addresses, shelter locations, trafficking-risk locations, or sensitive minor locations.</p>
      <SafetyNotice />
      <section className="map-placeholder">
        <div>
          <h2>Map placeholder</h2>
          <p>Phase 2 will connect this page to Supabase/PostGIS or a safe public case feed and display city/county-level points with filters.</p>
          <p className="muted">Recommended first map stack: Leaflet + OpenStreetMap tiles for light use, then MapLibre/Mapbox or self-hosted tiles if traffic grows.</p>
        </div>
      </section>
    </main>
  );
}
