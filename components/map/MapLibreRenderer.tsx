"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent, RequestParameters } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicMapPoint } from "../../lib/public-map";
import styles from "./MapLibreRenderer.module.css";
import { hasUsableWebGL, isAllowedMapResource, readPublicMapConfig, toPublicGeoJson, type MapFailureCode } from "./public-map-renderer";

const SOURCE_ID = "approved-public-areas";
const LAYER_ID = "approved-public-areas-circles";
const MAX_FIT_ZOOM = 7;
const SINGLE_POINT_ZOOM = 5;
const MAPTILER_ORIGIN = "https://api.maptiler.com";
const MAP_LOAD_TIMEOUT_MS = 12000;

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

export default function MapLibreRenderer({ points, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const [failure, setFailure] = useState<MapFailureCode | null>(null);
  const [attempt, setAttempt] = useState(0);
  const geoJson = useMemo(() => toPublicGeoJson(points), [points]);
  const showMapTilerLogo = usesMapTiler(process.env.NEXT_PUBLIC_MAP_STYLE_URL);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    setFailure(null);
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
    let map: MapLibreMap;
    let mapLoaded = false;
    let pointListenersBound = false;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;

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
        style: config.styleUrl,
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
      if (loadTimer) clearTimeout(loadTimer);
      if (!map.getSource(SOURCE_ID)) map.addSource(SOURCE_ID, { type: "geojson", data: geoJson });
      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({
          id: LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-radius": 9,
            "circle-color": "#b3263b",
            "circle-stroke-color": "#fff5e8",
            "circle-stroke-width": 3
          }
        });
      }
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
    loadTimer = setTimeout(() => {
      if (!mapLoaded) {
        setFailure("MAP_STYLE_LOAD_FAILED");
        reportMapFailure("MAP_STYLE_LOAD_FAILED");
      }
    }, MAP_LOAD_TIMEOUT_MS);

    return () => {
      if (loadTimer) clearTimeout(loadTimer);
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

  return <div className={styles.frame} data-map-state={failure ? "fallback" : "interactive"}>
    <div ref={containerRef} className={failure ? styles.hiddenCanvas : styles.canvas} aria-label="Optional visual map of approved approximate public-awareness areas" />
    {!failure && showMapTilerLogo ? <a className={styles.providerLogo} href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer"><img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler" referrerPolicy="no-referrer" /></a> : null}
    {failure ? <div className={styles.fallback} role="status" data-map-failure-code={failure}>
      <p><strong>Visual map unavailable.</strong> The complete accessible list remains available below.</p>
      <button type="button" className="button secondary" onClick={() => setAttempt((value) => value + 1)}>Retry visual map</button>
    </div> : null}
  </div>;
}

function updateMapDataAndCamera(map: MapLibreMap, geoJson: ReturnType<typeof toPublicGeoJson>) {
  const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  source?.setData(geoJson);
  if (geoJson.features.length === 0) return;
  if (geoJson.features.length === 1) {
    map.jumpTo({ center: geoJson.features[0].geometry.coordinates as [number, number], zoom: SINGLE_POINT_ZOOM });
    return;
  }
  const bounds = new maplibregl.LngLatBounds();
  geoJson.features.forEach((feature) => bounds.extend(feature.geometry.coordinates as [number, number]));
  map.fitBounds(bounds, { padding: 56, duration: 0, maxZoom: MAX_FIT_ZOOM });
}
