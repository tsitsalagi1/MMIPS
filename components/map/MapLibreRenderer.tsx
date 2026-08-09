"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, RequestParameters, StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicMapPoint } from "../../lib/public-map";
import styles from "./MapLibreRenderer.module.css";
import { addClusteredPublicPoints } from "./public-map-clusters";
import { hasUsableWebGL, isAllowedMapResource, readPublicMapConfig, toPublicGeoJson, type MapFailureCode, type PublicMapConfig, type PublicMapFeatureCollection } from "./public-map-renderer";

const BASEMAP_SOURCE_ID = "maptiler-streets-raster";
const BASEMAP_LAYER_ID = "maptiler-streets-raster-layer";
const MAPTILER_ORIGIN = "https://api.maptiler.com";
const MAP_SLOW_LOAD_NOTICE_MS = 15000;
const CLUSTER_THRESHOLD = 300;
const CONTINENTAL_BOUNDS: [[number, number], [number, number]] = [[-141, 24], [-52, 83]];

type ActiveMarker = {
  marker: maplibregl.Marker;
  element: HTMLButtonElement;
  clickHandler: () => void;
};

export type MapFocusTarget = {
  latitude: number;
  longitude: number;
  zoom?: number;
  requestId: number;
};

interface Props {
  points: PublicMapPoint[];
  onSelect: (publicId: string) => void;
  focusTarget?: MapFocusTarget | null;
}

function reportMapFailure(code: MapFailureCode) {
  console.error("Visual map unavailable", { code });
}

function usesMapTiler(styleUrl: string | undefined) {
  if (!styleUrl) return false;
  try { return new URL(styleUrl).origin === MAPTILER_ORIGIN; } catch { return false; }
}

function mapTilerRasterTileUrl(styleUrl: string) {
  try {
    const url = new URL(styleUrl);
    if (url.origin !== MAPTILER_ORIGIN) return null;
    const match = /^\/maps\/([^/]+)\/style\.json$/.exec(url.pathname);
    const key = url.searchParams.get("key");
    if (!match || !key) return null;
    const mapId = decodeURIComponent(match[1]);
    if (!/^[a-z0-9-]+$/i.test(mapId)) return null;
    return `${MAPTILER_ORIGIN}/maps/${mapId}/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`;
  } catch { return null; }
}

function rasterStyle(config: PublicMapConfig): StyleSpecification | null {
  const tileUrl = mapTilerRasterTileUrl(config.styleUrl);
  if (!tileUrl || !isAllowedMapResource(tileUrl.replace("{z}", "3").replace("{x}", "2").replace("{y}", "3"), config.allowedOrigins)) return null;
  return {
    version: 8,
    sources: { [BASEMAP_SOURCE_ID]: { type: "raster", tiles: [tileUrl], tileSize: 512 } },
    layers: [
      { id: "mmips-map-background", type: "background", paint: { "background-color": "#f3eee3" } },
      { id: BASEMAP_LAYER_ID, type: "raster", source: BASEMAP_SOURCE_ID }
    ]
  };
}

function clearMarkers(markers: ActiveMarker[]) {
  markers.forEach(({ marker, element, clickHandler }) => {
    element.removeEventListener("click", clickHandler);
    marker.remove();
  });
}

function createMarkers(map: MapLibreMap, geoJson: PublicMapFeatureCollection, onSelect: (publicId: string) => void): ActiveMarker[] {
  return geoJson.features.map((feature) => {
    const element = document.createElement("button");
    element.type = "button";
    element.className = styles.publicMarker;
    const name = feature.properties.publicName || "MMIPS public profile";
    const area = feature.properties.publicMapLabel || "approved approximate public-awareness area";
    element.setAttribute("aria-label", `${name}. ${area}. Show public profile summary.`);
    element.title = `${name} — ${area}`;
    const clickHandler = () => onSelect(feature.properties.publicId);
    element.addEventListener("click", clickHandler);
    const marker = new maplibregl.Marker({ element, anchor: "center" })
      .setLngLat(feature.geometry.coordinates as [number, number])
      .addTo(map);
    return { marker, element, clickHandler };
  });
}

export default function MapLibreRenderer({ points, onSelect, focusTarget }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<ActiveMarker[]>([]);
  const clusterCleanupRef = useRef<null | (() => void)>(null);
  const onSelectRef = useRef(onSelect);
  const [failure, setFailure] = useState<MapFailureCode | null>(null);
  const [loadingSlowly, setLoadingSlowly] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const geoJson = useMemo(() => toPublicGeoJson(points), [points]);
  const showMapTilerLogo = usesMapTiler(process.env.NEXT_PUBLIC_MAP_STYLE_URL);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    setFailure(null);
    setLoadingSlowly(false);
    const configResult = readPublicMapConfig({
      NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
      NEXT_PUBLIC_MAP_ATTRIBUTION: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION,
      NEXT_PUBLIC_MAP_ALLOWED_ORIGINS: process.env.NEXT_PUBLIC_MAP_ALLOWED_ORIGINS
    });
    if (!configResult.ok) {
      setFailure(configResult.code);
      reportMapFailure(configResult.code);
      return;
    }
    if (!hasUsableWebGL()) {
      setFailure("MAP_WEBGL_UNAVAILABLE");
      reportMapFailure("MAP_WEBGL_UNAVAILABLE");
      return;
    }
    if (!containerRef.current) return;

    const config = configResult.value;
    const preferredRasterStyle = rasterStyle(config);
    let map: MapLibreMap;
    let mapLoaded = false;
    let slowLoadTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: preferredRasterStyle ?? config.styleUrl,
        center: [-100, 45],
        zoom: 2.5,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        scrollZoom: false,
        touchPitch: false,
        maxPitch: 0,
        transformRequest: (url: string): RequestParameters => {
          if (!isAllowedMapResource(url, config.allowedOrigins)) {
            reportMapFailure("MAP_RESOURCE_REJECTED");
            throw new Error("MAP_RESOURCE_REJECTED");
          }
          return { url };
        }
      });
    } catch {
      setFailure("MAP_INITIALIZATION_FAILED");
      reportMapFailure("MAP_INITIALIZATION_FAILED");
      return;
    }

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ customAttribution: config.attribution, compact: true }));

    const markUsable = () => {
      mapLoaded = true;
      if (slowLoadTimer) clearTimeout(slowLoadTimer);
      setLoadingSlowly(false);
      map.resize();
    };
    const onLoad = () => markUsable();
    const onIdle = () => markUsable();
    const onError = () => { if (!mapLoaded) reportMapFailure("MAP_STYLE_LOAD_FAILED"); };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailure("MAP_CONTEXT_LOST");
      reportMapFailure("MAP_CONTEXT_LOST");
    };
    const canvas = map.getCanvas();
    map.once("load", onLoad);
    map.once("idle", onIdle);
    map.on("error", onError);
    canvas.addEventListener("webglcontextlost", onContextLost);
    slowLoadTimer = setTimeout(() => { if (!mapLoaded) setLoadingSlowly(true); }, MAP_SLOW_LOAD_NOTICE_MS);

    return () => {
      if (slowLoadTimer) clearTimeout(slowLoadTimer);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      map.off("error", onError);
      map.off("load", onLoad);
      map.off("idle", onIdle);
      clearMarkers(markersRef.current);
      markersRef.current = [];
      clusterCleanupRef.current?.();
      clusterCleanupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  // Map creation is intentionally independent of filtering updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clearMarkers(markersRef.current);
    markersRef.current = [];
    clusterCleanupRef.current?.();
    clusterCleanupRef.current = null;

    if (geoJson.features.length > CLUSTER_THRESHOLD) {
      clusterCleanupRef.current = addClusteredPublicPoints(map, geoJson, (publicId) => onSelectRef.current(publicId));
    } else {
      markersRef.current = createMarkers(map, geoJson, (publicId) => onSelectRef.current(publicId));
    }
    updateMapCamera(map, geoJson);

    return () => {
      clearMarkers(markersRef.current);
      markersRef.current = [];
      clusterCleanupRef.current?.();
      clusterCleanupRef.current = null;
    };
  }, [geoJson, attempt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    map.flyTo({
      center: [focusTarget.longitude, focusTarget.latitude],
      zoom: focusTarget.zoom ?? 9,
      duration: 0
    });
  }, [focusTarget, attempt]);

  return <div className={styles.frame} data-map-state={failure ? "fallback" : loadingSlowly ? "loading-slowly" : "interactive"} data-point-mode={points.length > CLUSTER_THRESHOLD ? "clustered" : "markers"}>
    <div ref={containerRef} className={failure ? styles.hiddenCanvas : styles.canvas} aria-label="Optional visual map of approved approximate public-awareness areas" />
    {!failure && showMapTilerLogo ? <a className={styles.providerLogo} href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer"><img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler" referrerPolicy="no-referrer" /></a> : null}
    {!failure && loadingSlowly ? <div className={styles.loadingNotice} role="status">
      <p><strong>Map is taking longer than expected to load.</strong> Public profiles remain available through Search Profiles while background map tiles continue loading.</p>
      <button type="button" className="button secondary" onClick={() => setAttempt((value) => value + 1)}>Retry visual map</button>
    </div> : null}
    {failure ? <div className={styles.fallback} role="status" data-map-failure-code={failure}>
      <p><strong>Visual map unavailable.</strong> Use Search Profiles to browse public profiles without the map.</p>
      <button type="button" className="button secondary" onClick={() => setAttempt((value) => value + 1)}>Retry visual map</button>
    </div> : null}
  </div>;
}

function updateMapCamera(map: MapLibreMap, geoJson: PublicMapFeatureCollection) {
  const bounds = new maplibregl.LngLatBounds(CONTINENTAL_BOUNDS[0], CONTINENTAL_BOUNDS[1]);
  geoJson.features.forEach((feature) => bounds.extend(feature.geometry.coordinates as [number, number]));
  map.fitBounds(bounds, { padding: 28, duration: 0, maxZoom: 4 });
}
