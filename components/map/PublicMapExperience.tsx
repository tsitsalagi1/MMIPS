"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { filterPublicMapPoints, type PublicMapAvailability, type PublicMapPoint } from "../../lib/public-map";
import { mapCategoryLabel } from "../../lib/status";
import type { MmipsCase } from "../../lib/types";
import styles from "./PublicMapExperience.module.css";

interface Props { profiles: MmipsCase[]; points: PublicMapPoint[]; availability: PublicMapAvailability; }
type Filters = { profileType: string; status: string; region: string };
const ALL = "all";
const MapLibreRenderer = dynamic(() => import("./MapLibreRenderer"), { ssr: false });

export default function PublicMapExperience({ profiles, points, availability }: Props) {
  const [filters, setFilters] = useState<Filters>({ profileType: ALL, status: ALL, region: ALL });
  const filtered = useMemo(() => filterPublicMapPoints(points, filters), [points, filters]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = filtered.find((point) => point.caseId === selectedId) ?? null;
  const profileTypes = [...new Set(points.map((point) => point.profileType))];
  const statuses = [...new Set(points.map((point) => point.publicStatus))];
  const regions = [...new Set(points.map((point) => point.publicMapLabel))];
  const hasMapPoints = points.length > 0;

  return <section className={styles.shell} aria-labelledby="map-results-heading">
    <div className="notice warning">
      <strong>Locations are approximate.</strong>
      <p>Approved public-awareness areas are not exact incident, home, shelter, recovery, witness, family, or investigative locations.</p>
    </div>
    <form className={styles.filters} aria-label="Filter public map results">
      <label>Profile type<select value={filters.profileType} onChange={(event) => setFilters({ ...filters, profileType: event.target.value })}><option value={ALL}>All profile types</option>{profileTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Public status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value={ALL}>All public statuses</option>{statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Approved area<select value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })}><option value={ALL}>All approved areas</option>{regions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <button type="button" className="button secondary" onClick={() => setFilters({ profileType: ALL, status: ALL, region: ALL })}>Reset filters</button>
    </form>
    <p className={styles.live} role="status" aria-live="polite">{filtered.length} public map result{filtered.length === 1 ? "" : "s"} shown.</p>
    <aside className={styles.mapRegion} aria-labelledby="visual-map-heading">
      <h2 id="visual-map-heading">Optional visual map</h2>
      <p>The map shows approved approximate public-awareness areas only. It does not show exact homes, shelters, incident or recovery sites, witness or family locations, or investigative locations. MMIPS does not verify or investigate cases through this map.</p>
      <p><a href="#accessible-map-list">Skip visual map and go to the complete accessible list</a></p>
      {availability === "unconfigured" ? <p className="muted">Public map data is not configured. No profiles are displayed on the visual map.</p> : null}
      {availability === "error" ? <p className="muted">Public map information is temporarily unavailable. Please try again later.</p> : null}
      {availability === "available" && !hasMapPoints ? <p className="card">No approved public map points are available yet.</p> : null}
      {availability === "available" && hasMapPoints ? <MapLibreRenderer points={filtered} onSelect={setSelectedId} /> : null}
      {availability === "available" && hasMapPoints ? <div className={styles.selection} aria-live="polite" aria-atomic="true">
        {selected ? <><h3>Selected public profile</h3>{selected.slug.startsWith("mmips-test-") ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}<p><strong>{selected.publicName}</strong> · {mapCategoryLabel(selected.profileType, selected.publicStatus)}</p><p>{selected.publicMapLabel}. Approximate public-awareness area; not an exact location.</p><Link href={`/profiles/${selected.slug}`}>Open selected public profile</Link></> : <p>Selecting an area on the optional map will show its public profile summary here.</p>}
      </div> : null}
    </aside>
    <section id="accessible-map-list" aria-labelledby="map-results-heading" tabIndex={-1}>
      <h2 id="map-results-heading">Accessible public profile list</h2>
      {profiles.length === 0 ? <p className="card">No public profiles are available in this list right now.</p> : <div className={styles.list}>{profiles.map((profile) => <article key={profile.id} className={styles.item}>{profile.slug.startsWith("mmips-test-") ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}<h3>{profile.fullName}</h3><p><strong>{mapCategoryLabel(profile.profileType, profile.status)}</strong> · {profile.lastSeenLocation}</p><p>{profile.publicLocationNote}</p>{profile.lastPublicUpdate ? <p className="muted">Last public update: {profile.lastPublicUpdate}</p> : null}<Link className="button" href={`/profiles/${profile.slug}`}>Open public profile</Link></article>)}</div>}
    </section>
  </section>;
}
