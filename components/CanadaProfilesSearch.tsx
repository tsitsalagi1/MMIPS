"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CANADA_PROVINCES_AND_TERRITORIES } from "@/lib/canada-config";
import type { PublicMapAvailability, PublicMapPoint } from "@/lib/public-map";
import type { MapFocusTarget } from "./map/MapLibreRenderer";

const MapLibreRenderer = dynamic(() => import("./map/MapLibreRenderer"), { ssr: false });
const TEXT_RESULTS_PAGE_SIZE = 50;
const PROFILE_CARD_PAGE_SIZE = 24;

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
  canadaCount?: number;
  unitedStatesCount?: number;
  crossBorder?: boolean;
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

function sourceLabel(point: PublicMapPoint) {
  return point.sourceCountry === "us" ? "United States" : "Canada";
}

function profileHref(point: PublicMapPoint) {
  return point.profileUrl || `/profiles/${encodeURIComponent(point.slug)}`;
}

function matchesStatus(point: PublicMapPoint, status: string) {
  if (status === "all") return true;
  if (status === "missing") return point.publicStatus === "missing" || point.profileType === "missing" || point.profileType === "urgent_missing";
  if (status === "homicide_unsolved") return point.publicStatus === "murdered_unsolved" || point.profileType === "murdered_info_needed";
  if (status === "unidentified") return point.publicStatus === "unidentified" || point.profileType === "unidentified";
  if (status === "resolved") return point.publicStatus === "resolved" || point.profileType === "located";
  return true;
}

function matchesPublicText(point: PublicMapPoint, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return `${point.publicName} ${point.publicMapLabel}`.toLowerCase().includes(normalized);
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
  const [message, setMessage] = useState("Loading profiles and map…");
  const [loading, setLoading] = useState(false);
  const [textViewOpen, setTextViewOpen] = useState(false);
  const [textPage, setTextPage] = useState(0);
  const [cardLimit, setCardLimit] = useState(PROFILE_CARD_PAGE_SIZE);
  const [canadaCount, setCanadaCount] = useState(0);
  const [unitedStatesCount, setUnitedStatesCount] = useState(0);

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
  const cardResults = useMemo(() => visiblePoints.slice(0, cardLimit), [visiblePoints, cardLimit]);

  useEffect(() => {
    setTextPage(0);
    setCardLimit(PROFILE_CARD_PAGE_SIZE);
  }, [visiblePoints]);

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
        const localCount = Number.isFinite(data.canadaCount) ? Number(data.canadaCount) : points.filter((point) => point.sourceCountry !== "us").length;
        const usCount = Number.isFinite(data.unitedStatesCount) ? Number(data.unitedStatesCount) : points.filter((point) => point.sourceCountry === "us").length;
        setMapAvailability(availability);
        setAllPoints(points);
        setVisiblePoints(points);
        setCanadaCount(localCount);
        setUnitedStatesCount(usCount);
        setMessage(
          availability === "available"
            ? points.length
              ? `${points.length.toLocaleString()} public map result${points.length === 1 ? "" : "s"} shown — ${localCount.toLocaleString()} from Canada and ${usCount.toLocaleString()} from the United States.`
              : "No public MMIPS profiles are available on the Canada map yet."
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
    setSelectedId(null);

    // Name/status search can include the public-safe cross-border results already loaded in the browser.
    if (!province && !postalCode.trim()) {
      const mapped = allPoints.filter((point) => matchesStatus(point, status) && matchesPublicText(point, q));
      setVisiblePoints(mapped);
      setMapFocus(null);
      setMessage(`${mapped.length.toLocaleString()} public profile${mapped.length === 1 ? "" : "s"} matched across the current Canada and U.S. public results.`);
      setLoading(false);
      return;
    }

    setMessage("Searching Canadian location results…");
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
      const mapped = allPoints.filter((point) => point.sourceCountry !== "us" && ids.has(point.caseId));
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
      setMessage(`${profileCount.toLocaleString()} Canadian public profile${profileCount === 1 ? "" : "s"} matched the location search. Clear the province/postal-code filters to see cross-border results again.`);
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
      ? `${allPoints.length.toLocaleString()} public map results shown — ${canadaCount.toLocaleString()} from Canada and ${unitedStatesCount.toLocaleString()} from the United States.`
      : "No public MMIPS profiles are available on the Canada map yet.");
  }

  return (
    <section aria-label="Search MMIPS public profiles from Canada and nearby United States results">
      <div className="card" style={{ margin: "20px 0" }}>
        <form className="form" onSubmit={search}>
          <label>Search by name or public area
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, community, city, or public area" />
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
            <p className="field-help">Optional. Enter a postal code to focus on nearby Canadian public profiles. The public map uses approximate areas, not private addresses or exact sensitive locations.</p>
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
            <button type="submit" disabled={loading || mapLoading}>{loading ? "Searching…" : "Search"}</button>
            <button type="button" className="secondary" onClick={reset} disabled={mapLoading}>Show all results</button>
          </div>
          <p className="status-message" role="status" aria-live="polite">{message}</p>
        </form>
      </div>

      <section className="card" aria-labelledby="canada-map-heading" style={{ marginTop: "22px" }}>
        <h2 id="canada-map-heading">Canada and border-area map</h2>
        <p className="text-measure">The map can show public MMIPS profiles from both Canada and the United States so an international border does not create a blind spot for families or nearby communities.</p>
        <p className="text-measure">Map locations are approximate public-awareness areas. Private case information, family contact information, exact locations, and review notes do not cross between the country systems.</p>
        {syntheticCount > 0 ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA IS PRESENT.</strong> {syntheticCount.toLocaleString()} of {allPoints.length.toLocaleString()} currently loaded map points are rehearsal records and must not be interpreted as real case prevalence.</p> : null}
        {mapAvailability === "unconfigured" ? <p className="status-message">The Canadian public map is being connected.</p> : null}
        {mapAvailability === "error" ? <p className="status-message">Public map information is temporarily unavailable.</p> : null}

        <div className="button-row" style={{ marginBottom: "14px" }}>
          <button type="button" className="secondary" aria-expanded={textViewOpen} aria-controls="canada-map-text-results" onClick={() => setTextViewOpen((value) => !value)}>
            {textViewOpen ? "Hide text results" : `View all ${visiblePoints.length.toLocaleString()} results as text`}
          </button>
        </div>

        <MapLibreRenderer points={visiblePoints} onSelect={setSelectedId} focusTarget={mapFocus} onFailure={() => setTextViewOpen(true)} />
        <div className="card calm-panel" style={{ marginTop: "16px" }} aria-live="polite" aria-atomic="true">
          {selected ? <>
            <h3>{selected.publicName}</h3>
            {isSyntheticPoint(selected) ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}
            <p><strong>{statusLabel(selected)}</strong> · {sourceLabel(selected)}</p>
            <p>{selected.publicMapLabel}. Approximate public-awareness area; not an exact location.</p>
            <a href={profileHref(selected)}>View public profile</a>
          </> : visiblePoints.length === 0 && !mapLoading ? <p>No public map points match the current search.</p> : <p>Select a map point to see the profile summary here.</p>}
        </div>

        {textViewOpen ? <section id="canada-map-text-results" className="card calm-panel stack" aria-labelledby="canada-map-text-heading" style={{ marginTop: "16px" }}>
          <h3 id="canada-map-text-heading">Current results as text</h3>
          <p>{visiblePoints.length.toLocaleString()} public map result{visiblePoints.length === 1 ? "" : "s"}. {visibleSyntheticCount > 0 ? `${visibleSyntheticCount.toLocaleString()} are clearly labelled synthetic rehearsal records.` : ""}</p>
          {textResults.length ? <ol start={textPage * TEXT_RESULTS_PAGE_SIZE + 1}>
            {textResults.map((point) => <li key={point.caseId} style={{ marginBottom: "12px" }}>
              <a href={profileHref(point)}><strong>{point.publicName}</strong></a>
              {isSyntheticPoint(point) ? <> — <strong>SYNTHETIC TEST DATA</strong></> : null}
              <br />
              {statusLabel(point)} · {sourceLabel(point)} · {point.publicMapLabel}. Approximate public-awareness area.
            </li>)}
          </ol> : <p>No public map points match the current search.</p>}
          {visiblePoints.length > TEXT_RESULTS_PAGE_SIZE ? <div className="button-row" aria-label="Text result pages">
            <button type="button" className="secondary" onClick={() => setTextPage((page) => Math.max(0, page - 1))} disabled={textPage === 0}>Previous results</button>
            <span>Page {textPage + 1} of {textPageCount}</span>
            <button type="button" className="secondary" onClick={() => setTextPage((page) => Math.min(textPageCount - 1, page + 1))} disabled={textPage >= textPageCount - 1}>Next results</button>
          </div> : null}
        </section> : null}
      </section>

      <section aria-labelledby="canada-profile-cards-heading" style={{ marginTop: "32px" }}>
        <p className="eyebrow">Profiles</p>
        <h2 id="canada-profile-cards-heading">Browse the current results</h2>
        <p className="muted">Profile cards match the results shown on the map. United States profiles open on the U.S. MMIPS site; Canadian profiles stay on MMIPS Canada.</p>
        {cardResults.length ? <div className="feature-grid" style={{ alignItems: "stretch" }}>
          {cardResults.map((point) => <article className="card calm-card" key={point.caseId}>
            <div className="badge-row">
              <span className="badge badge-neutral">{sourceLabel(point)}</span>
              <span className="badge badge-neutral">{statusLabel(point)}</span>
            </div>
            <h3>{point.publicName}</h3>
            {isSyntheticPoint(point) ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — Not a real person or real case.</p> : null}
            <p>{point.publicMapLabel}</p>
            <a className="button secondary" href={profileHref(point)}>View profile</a>
          </article>)}
        </div> : <div className="card calm-panel"><p>No public profiles match the current search.</p></div>}
        {cardLimit < visiblePoints.length ? <div className="button-row">
          <button type="button" className="secondary" onClick={() => setCardLimit((limit) => Math.min(visiblePoints.length, limit + PROFILE_CARD_PAGE_SIZE))}>
            Show more profiles
          </button>
          <span className="muted">Showing {cardResults.length.toLocaleString()} of {visiblePoints.length.toLocaleString()}</span>
        </div> : cardResults.length ? <p className="muted">Showing {cardResults.length.toLocaleString()} profile card{cardResults.length === 1 ? "" : "s"}.</p> : null}
      </section>
    </section>
  );
}
