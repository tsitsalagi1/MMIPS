"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterPublicMapPoints, type PublicMapPoint } from "../../lib/public-map";
import { mapCategoryLabel } from "../../lib/status";
import styles from "./PublicMapExperience.module.css";

interface Props { points: PublicMapPoint[]; styleUrl?: string; attribution?: string; }
type Filters = { profileType: string; status: string; region: string };
const ALL = "all";

export default function PublicMapExperience({ points, styleUrl, attribution }: Props) {
  const [filters, setFilters] = useState<Filters>({ profileType: ALL, status: ALL, region: ALL });
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = useMemo(() => filterPublicMapPoints(points, filters), [points, filters]);
  const profileTypes = [...new Set(points.map((point) => point.profileType))];
  const statuses = [...new Set(points.map((point) => point.publicStatus))];
  const regions = [...new Set(points.map((point) => point.publicMapLabel))];
  const mapUnavailable = !styleUrl;

  return <section className={styles.shell} aria-labelledby="map-results-heading">
    <div className="notice warning">
      <strong>Locations are approximate.</strong>
      <p>Map points are approved public-awareness areas only. They are not exact incident, home, shelter, recovery, witness, family, or investigative locations.</p>
    </div>
    <form className={styles.filters} aria-label="Filter public map and list results">
      <label>Profile type<select value={filters.profileType} onChange={(event) => setFilters({ ...filters, profileType: event.target.value })}><option value={ALL}>All profile types</option>{profileTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Public status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value={ALL}>All public statuses</option>{statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Approved area<select value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })}><option value={ALL}>All approved areas</option>{regions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <button type="button" className="button secondary" onClick={() => setFilters({ profileType: ALL, status: ALL, region: ALL })}>Reset filters</button>
    </form>
    <p className={styles.live} role="status" aria-live="polite">{filtered.length} public map/list result{filtered.length === 1 ? "" : "s"} shown.</p>
    <div className={styles.grid}>
      <div className={styles.mapPanel} aria-label="Approximate public-awareness visual map">
        {mapUnavailable ? <div className={styles.unavailable}><h2>Visual map background unavailable</h2><p>The accessible list remains complete. Configure NEXT_PUBLIC_MAP_STYLE_URL only after provider privacy, attribution, retention, and CSP review.</p></div> : <div className={styles.visual}><p>Reviewed style configured. Interactive MapLibre layer loads in browser environments after provider/CSP approval.</p>{attribution ? <p className="muted">Attribution: {attribution}</p> : null}</div>}
        <div className={styles.markerLayer} aria-hidden="true">{filtered.map((point, index) => <button key={point.caseId} type="button" className={styles.marker} style={{ left: `${18 + (index % 5) * 16}%`, top: `${22 + (index % 4) * 15}%` }} onClick={() => setSelected(point.caseId)} tabIndex={-1}>●</button>)}</div>
        <div className={styles.zoomControls} aria-label="Visual map zoom controls"><button type="button">+</button><button type="button">−</button></div>
      </div>
      <section aria-labelledby="map-results-heading">
        <h2 id="map-results-heading">Equivalent accessible list</h2>
        {filtered.length === 0 ? <p className="card">No approved public map profiles match these filters.</p> : <div className={styles.list}>{filtered.map((point) => <article id={`map-list-${point.caseId}`} key={point.caseId} className={`${styles.item} ${selected === point.caseId ? styles.selected : ""}`}><h3>{point.publicName}</h3><p><strong>{mapCategoryLabel(point.profileType, point.publicStatus)}</strong> · {point.publicMapLabel}</p><p>Approximate public-awareness area. Precision: {point.precision.replaceAll("_", " ")}.</p>{point.lastPublicUpdate ? <p className="muted">Last public update: {point.lastPublicUpdate}</p> : null}<button type="button" className="button secondary" onClick={() => setSelected(point.caseId)}>Highlight matching marker</button> <Link className="button" href={`/profiles/${point.slug}`}>Open public profile</Link></article>)}</div>}
      </section>
    </div>
  </section>;
}
