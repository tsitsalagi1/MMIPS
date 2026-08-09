"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { filterPublicMapPoints, type PublicMapAvailability, type PublicMapPoint } from "../../lib/public-map";
import { mapCategoryLabel } from "../../lib/status";
import type { MapFocusTarget } from "./MapLibreRenderer";
import styles from "./PublicMapExperience.module.css";

interface Props { points: PublicMapPoint[]; availability: PublicMapAvailability; }
type Filters = { profileType: string; status: string; region: string };
type ZipLookupState = { kind: "idle" | "loading" | "success" | "error"; message: string };
type ZipResponse = {
  zip?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  availability?: PublicMapAvailability;
  points?: PublicMapPoint[];
  error?: string;
};

const ALL = "all";
const MapLibreRenderer = dynamic(() => import("./MapLibreRenderer"), { ssr: false });

export default function PublicMapExperience({ points, availability }: Props) {
  const [mapPoints, setMapPoints] = useState<PublicMapPoint[]>(points);
  const [mapAvailability, setMapAvailability] = useState<PublicMapAvailability>(availability);
  const [filters, setFilters] = useState<Filters>({ profileType: ALL, status: ALL, region: ALL });
  const filtered = useMemo(() => filterPublicMapPoints(mapPoints, filters), [mapPoints, filters]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zipInput, setZipInput] = useState("");
  const [zipLookup, setZipLookup] = useState<ZipLookupState>({ kind: "idle", message: "" });
  const [mapFocus, setMapFocus] = useState<MapFocusTarget | null>(null);
  const selected = filtered.find((point) => point.caseId === selectedId) ?? null;
  const profileTypes = [...new Set(mapPoints.map((point) => point.profileType))];
  const statuses = [...new Set(mapPoints.map((point) => point.publicStatus))];
  const regions = [...new Set(mapPoints.map((point) => point.publicMapLabel))];

  useEffect(() => {
    setSelectedId(null);
  }, [filters.profileType, filters.status, filters.region]);

  async function focusZip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const zip = zipInput.trim();
    if (!/^[0-9]{5}$/.test(zip)) {
      setZipLookup({ kind: "error", message: "Enter a valid 5-digit U.S. ZIP code." });
      return;
    }

    setZipLookup({ kind: "loading", message: `Loading public map results near ZIP code ${zip}…` });
    try {
      const response = await fetch("/api/map/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
        cache: "no-store"
      });
      const body = await response.json() as ZipResponse;
      if (!response.ok || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
        setZipLookup({ kind: "error", message: body.error || "That ZIP code could not be located." });
        return;
      }

      const nearbyPoints = Array.isArray(body.points) ? body.points : [];
      const nextAvailability = body.availability || "available";
      const radiusMiles = typeof body.radiusMiles === "number" ? body.radiusMiles : 100;
      setMapPoints(nearbyPoints);
      setMapAvailability(nextAvailability);
      setFilters({ profileType: ALL, status: ALL, region: ALL });
      setMapFocus({ latitude: body.latitude, longitude: body.longitude, zoom: 9, requestId: Date.now() });
      setSelectedId(null);

      if (nextAvailability === "unconfigured") {
        setZipLookup({ kind: "error", message: "The map moved to that ZIP, but public map data is not configured." });
      } else {
        setZipLookup({
          kind: "success",
          message: `Map centered near ZIP code ${body.zip || zip}. ${nearbyPoints.length} public map result${nearbyPoints.length === 1 ? "" : "s"} loaded within about ${radiusMiles} miles.`
        });
      }
    } catch {
      setZipLookup({ kind: "error", message: "ZIP search is temporarily unavailable. You can still move and zoom the map manually." });
    }
  }

  return <section className={styles.shell} aria-label="Public map explorer">
    <div className="notice warning">
      <strong>Locations are approximate.</strong>
      <p>Approved public-awareness areas are not exact incident, home, shelter, recovery, witness, family, or investigative locations.</p>
    </div>

    <form className={styles.zipSearch} onSubmit={focusZip} aria-label="Zoom public map to a ZIP code">
      <label htmlFor="map-zip-code">Enter a ZIP code</label>
      <div className={styles.zipRow}>
        <input
          id="map-zip-code"
          name="zip"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[0-9]{5}"
          maxLength={5}
          value={zipInput}
          onChange={(event) => setZipInput(event.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
          aria-describedby="map-zip-help"
          placeholder="74464"
        />
        <button type="submit" className="button" disabled={zipLookup.kind === "loading"}>{zipLookup.kind === "loading" ? "Loading…" : "Show nearby profiles"}</button>
      </div>
      <p id="map-zip-help" className="muted">The map starts without downloading the national profile collection. Enter a U.S. ZIP code to load approved approximate public-awareness points nearby. MMIPS does not save this ZIP search as a case location.</p>
      {zipLookup.message ? <p className={zipLookup.kind === "error" ? styles.zipError : styles.zipStatus} role="status" aria-live="polite">{zipLookup.message}</p> : null}
    </form>

    {mapPoints.length > 0 ? <form className={styles.filters} aria-label="Filter nearby public map results">
      <label>Profile type<select value={filters.profileType} onChange={(event) => setFilters({ ...filters, profileType: event.target.value })}><option value={ALL}>All profile types</option>{profileTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Public status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value={ALL}>All public statuses</option>{statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Approved area<select value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })}><option value={ALL}>All approved areas</option>{regions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <button type="button" className="button secondary" onClick={() => setFilters({ profileType: ALL, status: ALL, region: ALL })}>Reset filters</button>
    </form> : null}

    {mapPoints.length > 0 ? <p className={styles.live} role="status" aria-live="polite">{filtered.length} nearby public map result{filtered.length === 1 ? "" : "s"} available for these filters.</p> : null}

    <aside className={styles.mapRegion} aria-labelledby="visual-map-heading">
      <h2 id="visual-map-heading">Public map</h2>
      <p>The map shows approved approximate public-awareness areas only. It does not show exact homes, shelters, incident or recovery sites, witness or family locations, or investigative locations. MMIPS does not verify or investigate cases through this map.</p>
      <p><Link href="/profiles">Prefer a list or need a non-map view? Search public profiles.</Link></p>
      {mapAvailability === "unconfigured" ? <p className="muted">Public map data is not configured. The basemap can still be used.</p> : null}
      {mapAvailability === "error" ? <p className="muted">Public map information is temporarily unavailable. Please try again later.</p> : null}
      <MapLibreRenderer points={filtered} onSelect={setSelectedId} focusTarget={mapFocus} />
      <div className={styles.selection} aria-live="polite" aria-atomic="true">
        {selected ? <><h3>Selected public profile</h3>{selected.slug.startsWith("mmips-test-") ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}<p><strong>{selected.publicName}</strong> · {mapCategoryLabel(selected.profileType, selected.publicStatus)}</p><p>{selected.publicMapLabel}. Approximate public-awareness area; not an exact location.</p><Link href={`/profiles/${selected.slug}`}>Open selected public profile</Link></> : mapPoints.length > 0 ? <p>Select a map marker to show its public profile summary here.</p> : <p>Enter a ZIP code above to load nearby public profiles onto the map.</p>}
      </div>
    </aside>
  </section>;
}
