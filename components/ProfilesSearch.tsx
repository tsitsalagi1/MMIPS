"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { PublicMapAvailability, PublicMapPoint } from "@/lib/public-map";
import { mapCategoryLabel } from "@/lib/status";
import type { MapFocusTarget } from "./map/MapLibreRenderer";

const MapLibreRenderer = dynamic(() => import("./map/MapLibreRenderer"), { ssr: false });

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

  const selected = useMemo(
    () => visiblePoints.find((point) => point.caseId === selectedId) ?? null,
    [visiblePoints, selectedId]
  );
  const hasSyntheticScaleData = useMemo(
    () => allPoints.some((point) => point.slug.startsWith("mmips-test-scale-") || point.slug.startsWith("mmips-test-")),
    [allPoints]
  );

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
            <p className="field-help">Optional. Enter a U.S. ZIP code to focus the map on approved public-awareness areas nearby. MMIPS does not use private home, family, shelter, or incident locations for this search.</p>
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
        <p className="text-measure">The map begins with every approved public-awareness point available to MMIPS so people can see how widely cases affect Indigenous communities. Nearby points are grouped into numbered clusters; select a cluster to zoom in.</p>
        <p className="text-measure"><strong>Map context:</strong> MMIPS is a public-awareness resource, not a complete statistical census. Cluster totals are counts of approved MMIPS public profiles in that area, not population-adjusted rates.</p>
        {hasSyntheticScaleData ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA IS PRESENT.</strong> Test clusters are for load testing and must not be interpreted as real case prevalence.</p> : null}
        {mapAvailability === "unconfigured" ? <p className="status-message">Public map data is not configured.</p> : null}
        {mapAvailability === "error" ? <p className="status-message">Public map information is temporarily unavailable.</p> : null}
        <MapLibreRenderer points={visiblePoints} onSelect={setSelectedId} focusTarget={mapFocus} />
        <div className="card calm-panel" style={{ marginTop: "16px" }} aria-live="polite" aria-atomic="true">
          {selected ? <>
            <h3>Selected public profile</h3>
            {selected.slug.startsWith("mmips-test-") ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}
            <p><strong>{selected.publicName}</strong> · {mapCategoryLabel(selected.profileType, selected.publicStatus)}</p>
            <p>{selected.publicMapLabel}. Approximate public-awareness area; not an exact location.</p>
            <Link href={`/profiles/${selected.slug}`}>Open selected public profile</Link>
          </> : <p>Select a map point to see its public profile summary here.</p>}
        </div>
      </section>
    </section>
  );
}
