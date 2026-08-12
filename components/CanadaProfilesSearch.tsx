"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CANADA_PROVINCES_AND_TERRITORIES } from "@/lib/canada-config";
import type { PublicMapAvailability, PublicMapPoint } from "@/lib/public-map";
import type { MapFocusTarget } from "./map/MapLibreRenderer";

const MapLibreRenderer = dynamic(() => import("./map/MapLibreRenderer"), { ssr: false });
const TEXT_RESULTS_PAGE_SIZE = 50;

type SearchResponse = {
  ok?: boolean;
  count?: number;
  profiles?: Array<{ id: string }>;
  message?: string;
  mapFocus?: { latitude: number; longitude: number; zoom?: number } | null;
};

type MapDataResponse = {
  ok?: boolean;
  availability?: PublicMapAvailability;
  points?: PublicMapPoint[];
};

function isSyntheticPoint(point: PublicMapPoint) {
  return point.slug.startsWith("mmips-ca-test-") || point.slug.startsWith("mmips-test-");
}

function statusLabel(point: PublicMapPoint) {
  if (point.profileType === "murdered_info_needed") return "Homicide / information needed";
  if (point.profileType === "unidentified") return "Unidentified person";
  if (point.profileType === "located") return "Resolved / located";
  if (point.profileType === "missing" || point.profileType === "urgent_missing") return "Missing";
  return "Public profile";
}

export default function CanadaProfilesSearch() {
  const [allPoints, setAllPoints] = useState<PublicMapPoint[]>([]);
  const [visiblePoints, setVisiblePoints] = useState<PublicMapPoint[]>([]);
  const [mapAvailability, setMapAvailability] = useState<PublicMapAvailability>("available");
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<MapFocusTarget | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [radiusKm, setRadiusKm] = useState("100");
  const [message, setMessage] = useState("Loading the Canada public map…");
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
    async function loadCanadaMap() {
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
            ? points.length
              ? `${points.length} approved Canadian public-awareness map point${points.length === 1 ? "" : "s"} shown.`
              : "No Canadian public profiles have been released to the map yet."
            : "Canadian public map information is temporarily unavailable."
        );
      } catch {
        if (cancelled) return;
        setMapAvailability("error");
        setTextViewOpen(true);
        setMessage("Canadian public map information is temporarily unavailable. Please try again later.");
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    }
    loadCanadaMap();
    return () => { cancelled = true; };
  }, []);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasFilters = Boolean(q.trim() || province || postalCode.trim() || status !== "all");
    if (!hasFilters) {
      reset();
      return;
    }

    setLoading(true);
    setMessage("Searching approved Canadian public profiles…");
    setSelectedId(null);
    try {
      const response = await fetch("/api/profiles/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          q: q.trim(),
          status,
          province,
          postalCode: postalCode.trim() || undefined,
          radiusKm: postalCode.trim() ? Number(radiusKm) : undefined
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
          zoom: data.mapFocus.zoom ?? 6,
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
    setProvince("");
    setPostalCode("");
    setRadiusKm("100");
    setVisiblePoints(allPoints);
    setSelectedId(null);
    setMapFocus(null);
    setMessage(allPoints.length
      ? `${allPoints.length} approved Canadian public-awareness map point${allPoints.length === 1 ? "" : "s"} shown.`
      : "No Canadian public profiles have been released to the map yet.");
  }

  return (
    <section aria-label="Search and map approved MMIPS Canada public profiles">
      <div className="card" style={{ margin: "20px 0" }}>
        <form className="form" onSubmit={search}>
          <label>Search by name, Nation or community, locality, or police service
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search MMIPS Canada public profiles" />
          </label>
          <div className="check-grid">
            <label>Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="missing">Missing</option>
                <option value="homicide_unsolved">Homicide / information needed</option>
                <option value="unidentified">Unidentified person</option>
                <option value="resolved">Resolved / located</option>
              </select>
            </label>
            <label>Province or territory
              <select value={province} onChange={(event) => setProvince(event.target.value)}>
                <option value="">All provinces and territories</option>
                {CANADA_PROVINCES_AND_TERRITORIES.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}
              </select>
            </label>
          </div>
          <fieldset className="field-group">
            <legend>Search near a Canadian postal code</legend>
            <p className="field-help">Optional. This search uses the postal code only to focus on approved public-awareness areas nearby. MMIPS Canada does not use a private home, shelter, family, or incident address for the public map.</p>
            <div className="check-grid">
              <label>Postal code
                <input
                  autoComplete="postal-code"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 7))}
                  placeholder="K1A 0B1"
                  maxLength={7}
                />
              </label>
              <label>Distance
                <select value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)} disabled={!postalCode.trim()}>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="100">Within 100 km</option>
                  <option value="250">Within 250 km</option>
                  <option value="500">Within 500 km</option>
                  <option value="1000">Within 1,000 km</option>
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

      <section className="card" aria-labelledby="canada-map-heading" style={{ marginTop: "22px" }}>
        <h2 id="canada-map-heading">MMIPS Canada public profile map</h2>
        <p className="text-measure">The map shows every Canadian MMIPS profile that has passed both the public-profile and public-map review gates. Locations are approved public-awareness areas, not private or exact locations.</p>
        <p className="text-measure"><strong>Map context:</strong> MMIPS Canada is a public-awareness resource, not a complete statistical census. Cluster totals count approved MMIPS Canada public profiles in that area and are not population-adjusted rates.</p>
        {syntheticCount > 0 ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA IS PRESENT.</strong> {syntheticCount.toLocaleString()} of {allPoints.length.toLocaleString()} currently loaded map points are rehearsal records and must not be interpreted as real case prevalence.</p> : null}
        {mapAvailability === "unconfigured" ? <p className="status-message">The Canadian public map is being connected to the Canada database.</p> : null}
        {mapAvailability === "error" ? <p className="status-message">Canadian public map information is temporarily unavailable.</p> : null}

        <div className="button-row" style={{ marginBottom: "14px" }}>
          <button type="button" className="secondary" aria-expanded={textViewOpen} aria-controls="canada-map-text-results" onClick={() => setTextViewOpen((value) => !value)}>
            {textViewOpen ? "Hide text results" : `View all ${visiblePoints.length.toLocaleString()} current results as text`}
          </button>
        </div>

        <MapLibreRenderer points={visiblePoints} onSelect={setSelectedId} focusTarget={mapFocus} onFailure={() => setTextViewOpen(true)} />
        <div className="card calm-panel" style={{ marginTop: "16px" }} aria-live="polite" aria-atomic="true">
          {selected ? <>
            <h3>Selected public profile</h3>
            {isSyntheticPoint(selected) ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}
            <p><strong>{selected.publicName}</strong> · {statusLabel(selected)}</p>
            <p>{selected.publicMapLabel}. Approved approximate public-awareness area; not an exact location.</p>
            <Link href={`/profiles/${selected.slug}`}>Open selected public profile</Link>
          </> : visiblePoints.length === 0 && !mapLoading ? <p>No approved Canadian map points match the current search.</p> : <p>Select a map point to see its public profile summary here.</p>}
        </div>

        {textViewOpen ? <section id="canada-map-text-results" className="card calm-panel stack" aria-labelledby="canada-map-text-heading" style={{ marginTop: "16px" }}>
          <h3 id="canada-map-text-heading">Current Canada map results as text</h3>
          <p>{visiblePoints.length.toLocaleString()} approved public map point{visiblePoints.length === 1 ? "" : "s"}. {visibleSyntheticCount > 0 ? `${visibleSyntheticCount.toLocaleString()} are clearly labelled synthetic rehearsal records.` : ""}</p>
          {textResults.length ? <ol start={textPage * TEXT_RESULTS_PAGE_SIZE + 1}>
            {textResults.map((point) => <li key={point.caseId} style={{ marginBottom: "12px" }}>
              <Link href={`/profiles/${point.slug}`}><strong>{point.publicName}</strong></Link>
              {isSyntheticPoint(point) ? <> — <strong>SYNTHETIC TEST DATA</strong></> : null}
              <br />
              {statusLabel(point)} · {point.publicMapLabel}. Approved approximate public-awareness area; not an exact location.
            </li>)}
          </ol> : <p>No approved Canadian public map points match the current search.</p>}
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
