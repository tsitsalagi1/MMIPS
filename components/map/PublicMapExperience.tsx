"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { filterPublicMapPoints, type PublicMapAvailability, type PublicMapPoint } from "../../lib/public-map";
import { mapCategoryLabel } from "../../lib/status";
import styles from "./PublicMapExperience.module.css";

interface Props { points: PublicMapPoint[]; availability: PublicMapAvailability; }
type Filters = { profileType: string; status: string; region: string };
const ALL = "all";
const MapLibreRenderer = dynamic(() => import("./MapLibreRenderer"), { ssr: false });

export default function PublicMapExperience({ points, availability }: Props) {
  const [filters, setFilters] = useState<Filters>({ profileType: ALL, status: ALL, region: ALL });
  const filtered = useMemo(() => filterPublicMapPoints(points, filters), [points, filters]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = filtered.find((point) => point.caseId === selectedId) ?? null;
  const profileTypes = [...new Set(points.map((point) => point.profileType))];
  const statuses = [...new Set(points.map((point) => point.publicStatus))];
  const regions = [...new Set(points.map((point) => point.publicMapLabel))];

  return <section className={styles.shell} aria-labelledby="map-results-heading">
    <div className="notice warning">
      <strong>Locations are approximate.</strong>
      <p>Approved public-awareness areas are not exact incident, home, shelter, recovery, witness, family, or investigative locations.</p>
    </div>
    <form className={styles.filters} aria-label="Filter public map and list results">
      <label>Profile type<select value={filters.profileType} onChange={(event) => setFilters({ ...filters, profileType: event.target.value })}><option value={ALL}>All profile types</option>{profileTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Public status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value={ALL}>All public statuses</option>{statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Approved area<select value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })}><option value={ALL}>All approved areas</option>{regions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <button type="button" className="button secondary" onClick={() => setFilters({ profileType: ALL, status: ALL, region: ALL })}>Reset filters</button>
    </form>
    <p className={styles.live} role="status" aria-live="polite">{filtered.length} public list result{filtered.length === 1 ? "" : "s"} shown.</p>
    <aside className={styles.mapRegion} aria-labelledby="visual-map-heading">
      <h2 id="visual-map-heading">Optional visual map</h2>
      <p>The map shows approved approximate public-awareness areas only. It does not show exact homes, shelters, incident or recovery sites, witness or family locations, or investigative locations. MMIPS does not verify or investigate cases through this map.</p>
      <p><a href="#accessible-map-list">Skip visual map and go to the complete accessible list</a></p>
      {availability === "unconfigured" ? <p className="muted">Public map data is not configured. No profiles are displayed.</p> : null}
      {availability === "error" ? <p className="muted">Public map information is temporarily unavailable. Please try again later.</p> : null}
      {availability === "available" ? <MapLibreRenderer points={filtered} onSelect={setSelectedId} /> : null}
      <div className={styles.selection} aria-live="polite" aria-atomic="true">
        {selected ? <><h3>Selected public profile</h3><p><strong>{selected.publicName}</strong> · {mapCategoryLabel(selected.profileType, selected.publicStatus)}</p><p>{selected.publicMapLabel}. Approximate public-awareness area; not an exact location.</p><Link href={`/profiles/${selected.slug}`}>Open selected public profile</Link></> : <p>Selecting an area on the optional map will show its public profile summary here.</p>}
      </div>
    </aside>
    <section id="accessible-map-list" aria-labelledby="map-results-heading" tabIndex={-1}>
      <h2 id="map-results-heading">Accessible public profile list</h2>
      {filtered.length === 0 ? <p className="card">{availability === "available" ? "No approved public profiles match these filters." : "No public profiles are available in this list right now."}</p> : <div className={styles.list}>{filtered.map((point) => <article key={point.caseId} className={styles.item}><h3>{point.publicName}</h3><p><strong>{mapCategoryLabel(point.profileType, point.publicStatus)}</strong> · {point.publicMapLabel}</p><p>Approximate public-awareness area. Precision: {point.precision.replaceAll("_", " ")}.</p>{point.lastPublicUpdate ? <p className="muted">Last public update: {point.lastPublicUpdate}</p> : null}<Link className="button" href={`/profiles/${point.slug}`}>Open public profile</Link></article>)}</div>}
    </section>
  </section>;
}
