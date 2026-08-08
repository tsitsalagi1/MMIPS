"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent, RequestParameters } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicMapPoint } from "../../lib/public-map";
import styles from "./MapLibreRenderer.module.css";
import { hasUsableWebGL2, isAllowedMapResource, readPublicMapConfig, toPublicGeoJson, type MapFailureCode } from "./public-map-renderer";

const SOURCE_ID = "approved-public-areas";
const LAYER_ID = "approved-public-areas-circles";
const MAX_FIT_ZOOM = 7;
const SINGLE_POINT_ZOOM = 5;
const MAPTILER_ORIGIN = "https://api.maptiler.com";

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
  const geoJson = useMemo(() => toPublicGeoJson(points), [points]);
  const showMapTilerLogo = usesMapTiler(process.env.NEXT_PUBLIC_MAP_STYLE_URL);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const configResult = readPublicMapConfig({
      NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
      NEXT_PUBLIC_MAP_ATTRIBUTION: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION,
      NEXT_PUBLIC_MAP_ALLOWED_ORIGINS: process.env.NEXT_PUBLIC_MAP_ALLOWED_ORIGINS
    });
    if (!configResult.ok) {
      setFailure(configResult.code);
      return;
    }
    if (!hasUsableWebGL2()) {
      setFailure("MAP_WEBGL2_UNAVAILABLE");
      return;
    }
    if (!containerRef.current) return;

    const config = configResult.value;
    let map: MapLibreMap;
    let initialStyleLoaded = false;
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

    const onStyleLoad = () => {
      initialStyleLoaded = true;
      map.addSource(SOURCE_ID, { type: "geojson", data: geoJson });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 8,
          "circle-color": "#8b1e2d",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3
        }
      });
      updateMapDataAndCamera(map, geoJson);
    };
    const onError = () => {
      if (!initialStyleLoaded) {
        setFailure("MAP_STYLE_LOAD_FAILED");
        reportMapFailure("MAP_STYLE_LOAD_FAILED");
      }
    };
    const onPointClick = (event: MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })[0];
      const publicId = feature?.properties?.publicId;
      if (typeof publicId === "string") onSelectRef.current(publicId);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailure("MAP_CONTEXT_LOST");
      reportMapFailure("MAP_CONTEXT_LOST");
    };
    const canvas = map.getCanvas();
    map.once("style.load", onStyleLoad);
    map.on("error", onError);
    map.on("click", LAYER_ID, onPointClick);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      map.off("error", onError);
      map.off("click", LAYER_ID, onPointClick);
      map.remove();
      mapRef.current = null;
    };
  // Map creation is intentionally independent of filtering updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateMapDataAndCamera(map, geoJson);
  }, [geoJson]);

  return <div className={styles.frame}>
    <div ref={containerRef} className={failure ? styles.hiddenCanvas : styles.canvas} aria-label="Optional visual map of approved approximate public-awareness areas" />
    {!failure && showMapTilerLogo ? <a className={styles.providerLogo} href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer"><img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler" referrerPolicy="no-referrer" /></a> : null}
    {failure ? <p className={styles.fallback} role="status">Visual map unavailable. The complete accessible list remains available below.</p> : null}
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
