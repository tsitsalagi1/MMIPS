import Link from "next/link";
import { SafetyNotice } from "../../components/SafetyNotice";
import { getPublishedCases } from "../../lib/cases";
import { mapCategoryLabel } from "../../lib/status";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const profiles = await getPublishedCases();
  const grouped = profiles.reduce<Record<string, typeof profiles>>((acc, item) => {
    const key = mapCategoryLabel(item.profileType, item.status);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <main className="container section">
      <h1>MMIPS public map</h1>
      <p className="lead">Use the map view to see broad public-awareness areas and profile types. Public locations should stay approximate and safety-filtered.</p>
      <SafetyNotice />
      <section className="map-filter-summary">
        {Object.entries(grouped).length ? Object.entries(grouped).map(([label, items]) => (
          <div className="card map-filter-card" key={label}>
            <h2>{label}</h2>
            <p>{items.length} public profile{items.length === 1 ? "" : "s"}</p>
          </div>
        )) : <div className="card"><p>No public profiles are currently mapped.</p></div>}
      </section>
      <section className="map-placeholder live-map-list">
        <div>
          <h2>Safety-filtered public map list</h2>
          <p className="muted">Phase 2 can replace this list with a Leaflet/MapLibre map. For now, this keeps trend/map categories visible without exposing exact sensitive locations.</p>
          <div className="profile-map-list">
            {profiles.map((item) => (
              <article key={item.id} className={`map-list-item profile-card-${item.profileType}`}>
                <div>
                  <strong>{item.fullName}</strong>
                  <p>{mapCategoryLabel(item.profileType, item.status)} · {item.lastSeenLocation}</p>
                  {item.notificationAreaRequested ? <p className="muted">Awareness/map area: {item.notificationAreaRequested}</p> : null}
                </div>
                <Link className="button secondary" href={`/profiles/${item.slug}`}>Open profile</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
