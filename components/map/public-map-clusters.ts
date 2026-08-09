import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { PublicMapFeatureCollection } from "./public-map-renderer";

const CELL_SIZE_PX = 56;
const MAX_ZOOM = 13;

type ActiveMarker = {
  marker: maplibregl.Marker;
  element: HTMLButtonElement;
  clickHandler: () => void;
};

type Bucket = {
  features: PublicMapFeatureCollection["features"];
  longitudeTotal: number;
  latitudeTotal: number;
};

function inViewport(map: MapLibreMap, coordinates: [number, number]) {
  const bounds = map.getBounds();
  const [longitude, latitude] = coordinates;
  if (latitude < bounds.getSouth() || latitude > bounds.getNorth()) return false;
  const west = bounds.getWest();
  const east = bounds.getEast();
  return west <= east ? longitude >= west && longitude <= east : longitude >= west || longitude <= east;
}

function clearMarkers(markers: ActiveMarker[]) {
  markers.forEach(({ marker, element, clickHandler }) => {
    element.removeEventListener("click", clickHandler);
    marker.remove();
  });
  markers.length = 0;
}

function shortCount(count: number) {
  if (count < 1000) return String(count);
  return `${Math.round(count / 100) / 10}k`;
}

function publicPointMarker(
  feature: PublicMapFeatureCollection["features"][number],
  onSelect: (publicId: string) => void
): { element: HTMLButtonElement; clickHandler: () => void } {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "mmipsClusterPointMarker";
  const name = feature.properties.publicName || "MMIPS public profile";
  const area = feature.properties.publicMapLabel || "approved approximate public-awareness area";
  element.setAttribute("aria-label", `${name}. ${area}. Show public profile summary.`);
  element.title = `${name} — ${area}`;
  const clickHandler = () => onSelect(feature.properties.publicId);
  element.addEventListener("click", clickHandler);
  return { element, clickHandler };
}

function clusterMarker(map: MapLibreMap, bucket: Bucket) {
  const count = bucket.features.length;
  const longitude = bucket.longitudeTotal / count;
  const latitude = bucket.latitudeTotal / count;
  const element = document.createElement("button");
  element.type = "button";
  element.className = "mmipsClusterMarker";
  element.textContent = shortCount(count);
  element.setAttribute("aria-label", `${count} MMIPS public profiles in this map area. Zoom in to separate them.`);
  element.title = `${count} MMIPS public profiles — zoom in`;
  const clickHandler = () => {
    map.easeTo({ center: [longitude, latitude], zoom: Math.min(Math.max(map.getZoom() + 2, 4), MAX_ZOOM), duration: 350 });
  };
  element.addEventListener("click", clickHandler);
  return { element, clickHandler, coordinates: [longitude, latitude] as [number, number] };
}

export function addClusteredPublicPoints(
  map: MapLibreMap,
  geoJson: PublicMapFeatureCollection,
  onSelect: (publicId: string) => void
) {
  const activeMarkers: ActiveMarker[] = [];
  let frame: number | null = null;

  const render = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      clearMarkers(activeMarkers);
      const buckets = new Map<string, Bucket>();

      for (const feature of geoJson.features) {
        const coordinates = feature.geometry.coordinates as [number, number];
        if (!inViewport(map, coordinates)) continue;
        const projected = map.project(coordinates);
        const key = `${Math.floor(projected.x / CELL_SIZE_PX)}:${Math.floor(projected.y / CELL_SIZE_PX)}`;
        const existing = buckets.get(key);
        if (existing) {
          existing.features.push(feature);
          existing.longitudeTotal += coordinates[0];
          existing.latitudeTotal += coordinates[1];
        } else {
          buckets.set(key, { features: [feature], longitudeTotal: coordinates[0], latitudeTotal: coordinates[1] });
        }
      }

      for (const bucket of buckets.values()) {
        if (bucket.features.length === 1) {
          const feature = bucket.features[0];
          const coordinates = feature.geometry.coordinates as [number, number];
          const { element, clickHandler } = publicPointMarker(feature, onSelect);
          const marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat(coordinates).addTo(map);
          activeMarkers.push({ marker, element, clickHandler });
          continue;
        }

        const { element, clickHandler, coordinates } = clusterMarker(map, bucket);
        const marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat(coordinates).addTo(map);
        activeMarkers.push({ marker, element, clickHandler });
      }
    });
  };

  map.on("moveend", render);
  map.on("resize", render);
  render();

  return () => {
    if (frame !== null) cancelAnimationFrame(frame);
    map.off("moveend", render);
    map.off("resize", render);
    clearMarkers(activeMarkers);
  };
}
