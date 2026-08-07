"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { toPublicGeoJson, type PublicMapPoint } from "../../lib/public-map";
import { isAllowedMapRequest, validateMapConfig } from "../../lib/public-map-config";
import styles from "./MapLibreRenderer.module.css";

type MapErrorCode = "MAP_WEBGL2_UNAVAILABLE" | "MAP_INITIALIZATION_FAILED" | "MAP_STYLE_LOAD_FAILED" | "MAP_RESOURCE_REJECTED" | "MAP_CONTEXT_LOST";
const SOURCE_ID = "approved-public-areas";
const LAYER_ID = "approved-public-area-points";

export default function MapLibreRenderer({ points, onSelect }: { points: PublicMapPoint[]; onSelect(id: string): void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap>(null);
  const [state, setState] = useState<"loading" | "ready" | MapErrorCode>("loading");
  const geojson = useMemo(() => toPublicGeoJson(points), [points]);
  const geoJsonRef = useRef(geojson);
  const selectRef = useRef(onSelect);
  const config = useMemo(() => validateMapConfig({ styleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL, attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION, allowedOrigins: process.env.NEXT_PUBLIC_MAP_ALLOWED_ORIGINS }), []);
  useEffect(() => { geoJsonRef.current = geojson; }, [geojson]);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!config.ok || !container.current) return;
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) { setState("MAP_WEBGL2_UNAVAILABLE"); return; }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: container.current, style: config.styleUrl, attributionControl: false,
        center: [0, 20], zoom: 1, maxZoom: 8, pitch: 0, bearing: 0,
        dragRotate: false, pitchWithRotate: false, scrollZoom: false,
        transformRequest: (url: string) => isAllowedMapRequest(url, config.allowedOrigins) ? { url } : (setState("MAP_RESOURCE_REJECTED"), { url: "about:blank" }),
      });
    } catch { setState("MAP_INITIALIZATION_FAILED"); return; }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    const onLoad = () => {
      const initialGeoJson = geoJsonRef.current;
      map.addSource(SOURCE_ID, { type: "geojson", data: initialGeoJson });
      map.addLayer({ id: LAYER_ID, type: "circle", source: SOURCE_ID, paint: { "circle-radius": 8, "circle-color": "#7c211a", "circle-stroke-width": 3, "circle-stroke-color": "#fff8ef" } });
      if (initialGeoJson.features.length > 1) {
        const bounds = new maplibregl.LngLatBounds(); initialGeoJson.features.forEach((feature) => bounds.extend(feature.geometry.coordinates));
        map.fitBounds(bounds, { padding: 64, duration: 0, maxZoom: 6 });
      } else if (initialGeoJson.features.length === 1) map.jumpTo({ center: initialGeoJson.features[0].geometry.coordinates, zoom: 5 });
      setState("ready");
    };
    const onError = () => setState("MAP_STYLE_LOAD_FAILED");
    const onClick = (event: MapMouseEvent) => { const id = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })[0]?.properties?.publicId; if (typeof id === "string") selectRef.current(id); };
    const onContextLost = (event: Event) => { event.preventDefault(); setState("MAP_CONTEXT_LOST"); map.remove(); mapRef.current = null; };
    map.once("load", onLoad); map.on("error", onError); map.on("click", LAYER_ID, onClick);
    map.getCanvas().addEventListener("webglcontextlost", onContextLost, { once: true });
    return () => { map.getCanvas().removeEventListener("webglcontextlost", onContextLost); map.remove(); mapRef.current = null; };
  // The instance remains stable; changing data updates its source below.
  }, [config]);

  useEffect(() => { (mapRef.current?.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(geojson); }, [geojson]);
  const unavailable = !config.ok || state !== "loading" && state !== "ready";
  return <section className={styles.region} aria-label="Optional visual map of approximate approved public-awareness areas">
    <p className={styles.message}>Keyboard: Tab to map controls or use the complete list below. The map does not use your location.</p>
    {unavailable ? <p className={styles.message} role="status">Visual map unavailable. The complete list remains available below.</p> : state === "loading" ? <p className={styles.message} role="status">Loading optional visual map…</p> : null}
    <div ref={container} className={styles.map} aria-hidden={unavailable} />
    {state === "ready" ? <p className={styles.message}>{config.ok ? config.attribution : ""}</p> : null}
  </section>;
}
