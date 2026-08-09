"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent, RequestParameters, StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicMapPoint } from "../../lib/public-map";
import styles from "./MapLibreRenderer.module.css";
import { hasUsableWebGL, isAllowedMapResource, readPublicMapConfig, toPublicGeoJson, type MapFailureCode, type PublicMapConfig, type PublicMapFeatureCollection } from "./public-map-renderer";

const SOURCE_ID = "approved-public-areas";
const LAYER_ID = "approved-public-areas-circles";
const BASEMAP_SOURCE_ID = "maptiler-streets-raster";
const BASEMAP_LAYER_ID = "maptiler-streets-raster-layer";
const MAPTILER_ORIGIN = "https://api.maptiler.com";
const MAP_SLOW_LOAD_NOTICE_MS = 15000;
const CONTIGUOUS_US_BOUNDS: [[number, number], [number, number]] = [[-125, 24], [-66.5, 49.5]];

interface Props {
  points: PublicMapPoint[];
  onSelect: (publicId: string) => void;
}

function reportMapFailure(code: MapFailureCode) {
  console.error("Visual map unavailable", { code });
}

function usesMapTiler(styleUrl: string | undefined) {
  if (!styleUrl) return false;
  try {
    return new URL(styleUrl).origin === MAPTILER_ORIGIN;
  } catch {
    return false;
  }
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
  } catch {
    return null;
  }
}

function pointLayer(): maplibregl.CircleLayerSpecification {
  return {
    id: LAYER_ID,
    type: "circle",
    source: SOURCE_ID,
    paint: {
      "circle-radius": 10,
      "circle-color": "#b3263b",
      "circle-stroke-color": "#fff5e8",
      "circle-stroke-width": 3,
      "circle-opacity": 0.92
    }
  };
}

function rasterStyle(config: PublicMapConfig, geoJson: PublicMapFeatureCollection): StyleSpecification | null {
  const tileUrl = mapTilerRasterTileUrl(config.styleUrl);
  if (!tileUrl || !isAllowedMapResource(tileUrl.replace("{z}", "3").replace("{x}", "2").replace("{y}", "3"), config.allowedOrigins)) return null;
  return {
    version: 8,
    sources: {
      [BASEMAP_SOURCE_ID]: {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 512
      },
      [SOURCE_ID]: {
        type: "geojson",
        data: geoJson
      }
    },
    layers: [
      {
        id: "mmips-map-background",
        type: "background",
        paint: { "background-color": "#f3eee3" }
      },
      {
        id: BASEMAP_LAYER_ID,
        type: "raster",
        source: BASEMAP_SOURCE_ID
      },
      pointLayer()
    ]
  };
}

export default function MapLibreRenderer({ points, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const [failure, setFailure] = useState<MapFailureCode | null>(null);
  const [loadingSlowly, setLoadingSlowly] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const geoJson = useMemo(() => toPublicGeoJson(points), [points]);
  const showMapTilerLogo = usesMapTiler(process.env.NEXT_PUBLIC_MAP_STYLE_URL);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

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
    const preferredRasterStyle = rasterStyle(config, geoJson);
    let map: MapLibreMap;
    let mapLoaded = false;
    let pointListenersBound = false;
    let slowLoadTimer: ReturnType<typeof setTimeout> | null = null;

    const onPointClick = (event: MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })[0];
      const publicId = feature?.properties?.publicId;
      if (typeof publicId === "string") onSelectRef.current(publicId);
    };
    const onPointEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onPointLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: preferredRasterStyle ?? config.styleUrl,
        center: [-98.5, 38.5],
        zoom: 3,
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

    const onLoad = () => {
      mapLoaded = true;
      if (slowLoadTimer) clearTimeout(slowLoadTimer);
      setLoadingSlowly(false);
      if (!map.getSource(SOURCE_ID)) map.addSource(SOURCE_ID, { type: "geojson", data: geoJson });
      if (!map.getLayer(LAYER_ID)) map.addLayer(pointLayer());
      if (!pointListenersBound) {
        map.on("click", LAYER_ID, onPointClick);
        map.on("mouseenter", LAYER_ID, onPointEnter);
        map.on("mouseleave", LAYER_ID, onPointLeave);
        pointListenersBound = true;
      }
      updateMapDataAndCamera(map, geoJson);
      map.resize();
    };
    const onError = () => {
      if (!mapLoaded) reportMapFailure("MAP_STYLE_LOAD_FAILED");
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailure("MAP_CONTEXT_LOST");
      reportMapFailure("MAP_CONTEXT_LOST");
    };
    const canvas = map.getCanvas();
    map.once("load", onLoad);
    map.on("error", onError);
    canvas.addEventListener("webglcontextlost", onContextLost);
    slowLoadTimer = setTimeout(() => {
      if (!mapLoaded) setLoadingSlowly(true);
    }, MAP_SLOW_LOAD_NOTICE_MS);

    return () => {
      if (slowLoadTimer) clearTimeout(slowLoadTimer);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      map.off("error", onError);
      if (pointListenersBound) {
        map.off("click", LAYER_ID, onPointClick);
        map.off("mouseenter", LAYER_ID, onPointEnter);
        map.off("mouseleave", LAYER_ID, onPointLeave);
      }
      map.remove();
      mapRef.current = null;
    };
  // Map creation is intentionally independent of filtering updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateMapDataAndCamera(map, geoJson);
  }, [geoJson]);

  return <div className={styles.frame} data-map-state={failure ? "fallback" : loadingSlowly ? "loading-slowly" : "interactive"}>
    <div ref={containerRef} className={failure ? styles.hiddenCanvas : styles.canvas} aria-label="Optional visual map of approved approximate public-awareness areas" />
    {!failure && showMapTilerLogo ? <a className={styles.providerLogo} href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer"><img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler" referrerPolicy="no-referrer" /></a> : null}
    {!failure && loadingSlowly ? <div className={styles.loadingNotice} role="status">
      <p><strong>Map is taking longer than expected to load.</strong> You can keep waiting; the map will continue loading, or you can retry it.</p>
      <button type="button" className="button secondary" onClick={() => setAttempt((value) => value + 1)}>Retry visual map</button>
    </div> : null}
    {failure ? <div className={styles.fallback} role="status" data-map-failure-code={failure}>
      <p><strong>Visual map unavailable.</strong> The complete accessible list remains available below.</p>
      <button type="button" className="button secondary" onClick={() => setAttempt((value) => value + 1)}>Retry visual map</button>
    </div> : null}
  </div>;
}

function updateMapDataAndCamera(map: MapLibreMap, geoJson: PublicMapFeatureCollection) {
  const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  source?.setData(geoJson);
  const bounds = new maplibregl.LngLatBounds(CONTIGUOUS_US_BOUNDS[0], CONTIGUOUS_US_BOUNDS[1]);
  geoJson.features.forEach((feature) => bounds.extend(feature.geometry.coordinates as [number, number]));
  map.fitBounds(bounds, { padding: 28, duration: 0, maxZoom: 4 });
}
