"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { filterPublicMapPoints, type PublicMapAvailability, type PublicMapPoint } from "../../lib/public-map";
import { mapCategoryLabel } from "../../lib/status";
import styles from "./PublicMapExperience.module.css";

interface Props { points: PublicMapPoint[]; availability: PublicMapAvailability; }
type Filters = { profileType: string; status: string; region: string };
const ALL = "all";
const ACCESSIBLE_PAGE_SIZE = 20;
const MapLibreRenderer = dynamic(() => import("./MapLibreRenderer"), { ssr: false });

export default function PublicMapExperience({ points, availability }: Props) {
  const [filters, setFilters] = useState<Filters>({ profileType: ALL, status: ALL, region: ALL });
  const filtered = useMemo(() => filterPublicMapPoints(points, filters), [points, filters]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const selected = filtered.find((point) => point.caseId === selectedId) ?? null;
  const profileTypes = [...new Set(points.map((point) => point.profileType))];
  const statuses = [...new Set(points.map((point) => point.publicStatus))];
  const regions = [...new Set(points.map((point) => point.publicMapLabel))];
  const hasMapPoints = points.length > 0;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ACCESSIBLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * ACCESSIBLE_PAGE_SIZE;
  const accessiblePoints = filtered.slice(pageStart, pageStart + ACCESSIBLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    setSelectedId(null);
  }, [filters.profileType, filters.status, filters.region]);

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
      <p><a href="#accessible-map-list">Skip visual map and go to the accessible results</a></p>
      {availability === "unconfigured" ? <p className="muted">Public map data is not configured. No profiles are displayed on the visual map.</p> : null}
      {availability === "error" ? <p className="muted">Public map information is temporarily unavailable. Please try again later.</p> : null}
      {availability === "available" && !hasMapPoints ? <p className="card">No approved public map points are available yet.</p> : null}
      {availability === "available" && hasMapPoints ? <MapLibreRenderer points={filtered} onSelect={setSelectedId} /> : null}
      {availability === "available" && hasMapPoints ? <div className={styles.selection} aria-live="polite" aria-atomic="true">
        {selected ? <><h3>Selected public profile</h3>{selected.slug.startsWith("mmips-test-") ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}<p><strong>{selected.publicName}</strong> · {mapCategoryLabel(selected.profileType, selected.publicStatus)}</p><p>{selected.publicMapLabel}. Approximate public-awareness area; not an exact location.</p><Link href={`/profiles/${selected.slug}`}>Open selected public profile</Link></> : <p>Select a map marker to show its public profile summary here.</p>}
      </div> : null}
    </aside>
    <section id="accessible-map-list" aria-labelledby="map-results-heading" tabIndex={-1}>
      <div className={styles.listHeading}>
        <div>
          <h2 id="map-results-heading">Accessible public profile results</h2>
          <p className="muted">Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + ACCESSIBLE_PAGE_SIZE, filtered.length)} of {filtered.length}. Use the filters above or move through 20 results at a time.</p>
        </div>
        {totalPages > 1 ? <p className={styles.pageCount}>Page {safePage} of {totalPages}</p> : null}
      </div>
      {accessiblePoints.length === 0 ? <p className="card">No public profiles match these map filters.</p> : <div className={styles.list}>{accessiblePoints.map((point) => <article key={point.caseId} className={styles.item}>{point.slug.startsWith("mmips-test-") ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}<h3>{point.publicName}</h3><p><strong>{mapCategoryLabel(point.profileType, point.publicStatus)}</strong> · {point.publicMapLabel}</p><p>Public location precision: {point.precision.replaceAll("_", " ")}.</p>{point.lastPublicUpdate ? <p className="muted">Last public update: {point.lastPublicUpdate}</p> : null}<Link className="button" href={`/profiles/${point.slug}`}>Open public profile</Link></article>)}</div>}
      {totalPages > 1 ? <nav className={styles.pagination} aria-label="Accessible public profile result pages">
        <button type="button" className="button secondary" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous 20</button>
        <span>Page {safePage} of {totalPages}</span>
        <button type="button" className="button secondary" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next 20</button>
      </nav> : null}
    </section>
  </section>;
}
