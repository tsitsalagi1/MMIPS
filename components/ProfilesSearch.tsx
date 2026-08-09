"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { PublicMapAvailability, PublicMapPoint } from "@/lib/public-map";
import { mapCategoryLabel } from "@/lib/status";
import type { MapFocusTarget } from "./map/MapLibreRenderer";

const MapLibreRenderer = dynamic(() => import("./map/MapLibreRenderer"), { ssr: false });
const TEXT_RESULTS_PAGE_SIZE = 50;

type SearchProfile = { id: string };
type SearchResponse = {
  ok?: boolean;
  count?: number;
  profiles?: SearchProfile[];
  message?: string;
  mapFocus?: { latitude: number; longitude: number; zoom?: number } | null;
};
type MapDataResponse = {
  ok?: boolean;
  availability?: PublicMapAvailability;
  points?: PublicMapPoint[];
};

function isSyntheticPoint(point: PublicMapPoint) {
  return point.slug.startsWith("mmips-test-scale-") || point.slug.startsWith("mmips-test-");
}

export default function ProfilesSearch() {
  const [allPoints, setAllPoints] = useState<PublicMapPoint[]>([]);
  const [visiblePoints, setVisiblePoints] = useState<PublicMapPoint[]>([]);
  const [mapAvailability, setMapAvailability] = useState<PublicMapAvailability>("available");
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<MapFocusTarget | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("50");
  const [message, setMessage] = useState("Loading the national public map…");
  const [loading, setLoading] = useState(false);
  const [textViewOpen, setTextViewOpen] = useState(false);
  const [textPage, setTextPage] = useState(0);

  const selected = useMemo(
    () => visiblePoints.find((point) => point.caseId === selectedId) ?? null,
    [visiblePoints, selectedId]
  );
  const syntheticCount = useMemo(() => allPoints.filter(isSyntheticPoint).length, [allPoints]);
  const visibleSyntheticCount = useMemo(() => visiblePoints.filter(isSyntheticPoint).length, [visiblePoints]);
  const textPageCount = Math.max(1, Math.ceil(visiblePoints.length / TEXT_RESULTS_PAGE_SIZE));
  const textResults = useMemo(
    () => visiblePoints.slice(textPage * TEXT_RESULTS_PAGE_SIZE, (textPage + 1) * TEXT_RESULTS_PAGE_SIZE),
    [visiblePoints, textPage]
  );

  useEffect(() => { setTextPage(0); }, [visiblePoints]);

  useEffect(() => {
    let cancelled = false;
    async function loadNationalMap() {
      setMapLoading(true);
      try {
        const response = await fetch("/api/profiles/map", { headers: { Accept: "application/json" } });
        const data = await response.json().catch(() => ({})) as MapDataResponse;
        if (cancelled) return;
        const points = Array.isArray(data.points) ? data.points : [];
        const availability = data.availability || (response.ok ? "available" : "error");
        setMapAvailability(availability);
        setAllPoints(points);
        setVisiblePoints(points);
        setMessage(
          availability === "available"
            ? `${points.length} approved public map point${points.length === 1 ? "" : "s"} shown across the national map.`
            : "Public map information is temporarily unavailable."
        );
      } catch {
        if (cancelled) return;
        setMapAvailability("error");
        setTextViewOpen(true);
        setMessage("Public map information is temporarily unavailable. Please try again later.");
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    }
    loadNationalMap();
    return () => { cancelled = true; };
  }, []);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasFilters = Boolean(q.trim() || state.trim() || zip.trim() || status !== "all");
    if (!hasFilters) {
      reset();
      return;
    }

    setLoading(true);
    setMessage("Searching approved public profiles…");
    setSelectedId(null);
    try {
      const response = await fetch("/api/profiles/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          q: q.trim(),
          status,
          state: state.trim(),
          zip: zip.trim() || undefined,
          radiusMiles: zip.trim() ? Number(radiusMiles) : undefined
        }),
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({})) as SearchResponse;
      if (!response.ok) {
        setMessage(typeof data.message === "string" ? data.message : "Search is temporarily unavailable.");
        return;
      }

      const ids = new Set((Array.isArray(data.profiles) ? data.profiles : []).map((profile) => profile.id));
      const mapped = allPoints.filter((point) => ids.has(point.caseId));
      setVisiblePoints(mapped);
      if (data.mapFocus && Number.isFinite(data.mapFocus.latitude) && Number.isFinite(data.mapFocus.longitude)) {
        setMapFocus({
          latitude: data.mapFocus.latitude,
          longitude: data.mapFocus.longitude,
          zoom: data.mapFocus.zoom ?? 7,
          requestId: Date.now()
        });
      } else {
        setMapFocus(null);
      }
      const profileCount = Number(data.count || 0);
      setMessage(`${profileCount} public profile${profileCount === 1 ? "" : "s"} matched. ${mapped.length} approved map point${mapped.length === 1 ? "" : "s"} shown.`);
    } catch {
      setMessage("Search is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQ("");
    setStatus("all");
    setState("");
    setZip("");
    setRadiusMiles("50");
    setVisiblePoints(allPoints);
    setSelectedId(null);
    setMapFocus(null);
    setMessage(`${allPoints.length} approved public map point${allPoints.length === 1 ? "" : "s"} shown across the national map.`);
  }

  return (
    <section aria-label="Search and map approved MMIPS public profiles">
      <div className="card" style={{ margin: "20px 0" }}>
        <form className="form" onSubmit={search}>
          <label>Search by name, city, Tribe, agency, or NamUs number
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search MMIPS public profiles" />
          </label>
          <div className="check-grid">
            <label>Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="missing">Missing</option>
                <option value="murdered_unsolved">Murdered / Unsolved</option>
                <option value="unidentified">Unidentified</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label>State or province
              <input value={state} onChange={(event) => setState(event.target.value)} placeholder="Oklahoma, Arizona, Alberta..." />
            </label>
          </div>
          <fieldset className="field-group">
            <legend>Search near a U.S. ZIP code</legend>
            <p className="field-help">Optional. Enter a U.S. ZIP code to focus the map on an approved awareness area nearby. MMIPS does not use private home, family, shelter, or incident locations for this search.</p>
            <div className="check-grid">
              <label>ZIP code
                <input inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} value={zip} onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="74464" />
              </label>
              <label>Distance
                <select value={radiusMiles} onChange={(event) => setRadiusMiles(event.target.value)} disabled={!zip}>
                  <option value="10">Within 10 miles</option>
                  <option value="25">Within 25 miles</option>
                  <option value="50">Within 50 miles</option>
                  <option value="100">Within 100 miles</option>
                  <option value="250">Within 250 miles</option>
                </select>
              </label>
            </div>
          </fieldset>
          <div className="button-row">
            <button type="submit" disabled={loading || mapLoading}>{loading ? "Searching…" : "Search map"}</button>
            <button type="button" className="secondary" onClick={reset} disabled={mapLoading}>Show all map points</button>
          </div>
          <p className="status-message" role="status" aria-live="polite">{message}</p>
        </form>
      </div>

      <section className="card" aria-labelledby="national-map-heading" style={{ marginTop: "22px" }}>
        <h2 id="national-map-heading">National MMIPS public profile map</h2>
        <p className="text-measure">The map begins with every approved public-awareness point available to MMIPS so people can see the full public dataset. Nearby points are grouped into numbered clusters; select a cluster to zoom in.</p>
        <p className="text-measure"><strong>Map context:</strong> MMIPS is a public-awareness resource, not a complete statistical census. Cluster totals are counts of approved MMIPS public profiles in that area, not population-adjusted rates.</p>
        {syntheticCount > 0 ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA IS PRESENT.</strong> {syntheticCount.toLocaleString()} of {allPoints.length.toLocaleString()} currently loaded map points are synthetic test records. They remain visible for full-scale testing and must not be interpreted as real case prevalence.</p> : null}
        {mapAvailability === "unconfigured" ? <p className="status-message">Public map data is not configured.</p> : null}
        {mapAvailability === "error" ? <p className="status-message">Public map information is temporarily unavailable.</p> : null}

        <div className="button-row" style={{ marginBottom: "14px" }}>
          <button
            type="button"
            className="secondary"
            aria-expanded={textViewOpen}
            aria-controls="public-map-text-results"
            onClick={() => setTextViewOpen((value) => !value)}
          >
            {textViewOpen ? "Hide text results" : `View all ${visiblePoints.length.toLocaleString()} current results as text`}
          </button>
        </div>

        <MapLibreRenderer points={visiblePoints} onSelect={setSelectedId} focusTarget={mapFocus} onFailure={() => setTextViewOpen(true)} />
        <div className="card calm-panel" style={{ marginTop: "16px" }} aria-live="polite" aria-atomic="true">
          {selected ? <>
            <h3>Selected public profile</h3>
            {isSyntheticPoint(selected) ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}
            <p><strong>{selected.publicName}</strong> · {mapCategoryLabel(selected.profileType, selected.publicStatus)}</p>
            <p>{selected.publicMapLabel}. Approximate public-awareness area; not an exact location.</p>
            <Link href={`/profiles/${selected.slug}`}>Open selected public profile</Link>
          </> : visiblePoints.length === 0 && !mapLoading ? <p>No approved map points match the current search. Change or reset the search to see other areas.</p> : <p>Select a map point to see its public profile summary here.</p>}
        </div>

        {textViewOpen ? <section id="public-map-text-results" className="card calm-panel stack" aria-labelledby="public-map-text-heading" style={{ marginTop: "16px" }}>
          <h3 id="public-map-text-heading">Current map results as text</h3>
          <p>{visiblePoints.length.toLocaleString()} approved public map point{visiblePoints.length === 1 ? "" : "s"}. {visibleSyntheticCount > 0 ? `${visibleSyntheticCount.toLocaleString()} are clearly labeled synthetic test records.` : ""}</p>
          {textResults.length ? <ol start={textPage * TEXT_RESULTS_PAGE_SIZE + 1}>
            {textResults.map((point) => <li key={point.caseId} style={{ marginBottom: "12px" }}>
              <Link href={`/profiles/${point.slug}`}><strong>{point.publicName}</strong></Link>
              {isSyntheticPoint(point) ? <> — <strong>SYNTHETIC TEST DATA</strong></> : null}
              <br />
              {mapCategoryLabel(point.profileType, point.publicStatus)} · {point.publicMapLabel}. Approximate public-awareness area; not an exact location.
            </li>)}
          </ol> : <p>No approved public map points match the current search.</p>}
          {visiblePoints.length > TEXT_RESULTS_PAGE_SIZE ? <div className="button-row" aria-label="Text result pages">
            <button type="button" className="secondary" onClick={() => setTextPage((page) => Math.max(0, page - 1))} disabled={textPage === 0}>Previous results</button>
            <span>Page {textPage + 1} of {textPageCount}</span>
            <button type="button" className="secondary" onClick={() => setTextPage((page) => Math.min(textPageCount - 1, page + 1))} disabled={textPage >= textPageCount - 1}>Next results</button>
          </div> : null}
        </section> : null}
      </section>
    </section>
  );
}
