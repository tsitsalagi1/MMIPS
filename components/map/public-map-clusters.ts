import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { PublicMapFeatureCollection } from "./public-map-renderer";

const SOURCE_ID = "mmips-public-cluster-source";
const CLUSTERS_ID = "mmips-public-clusters";
const CLUSTER_COUNT_ID = "mmips-public-cluster-count";
const POINTS_ID = "mmips-public-cluster-points";

type LayerEvent = { features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: Record<string, unknown> }> };

export function addClusteredPublicPoints(
  map: MapLibreMap,
  geoJson: PublicMapFeatureCollection,
  onSelect: (publicId: string) => void
) {
  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: geoJson as any,
    cluster: true,
    clusterMaxZoom: 12,
    clusterRadius: 48
  });

  map.addLayer({
    id: CLUSTERS_ID,
    type: "circle",
    source: SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#8f201b",
      "circle-radius": ["step", ["get", "point_count"], 18, 25, 23, 100, 29, 500, 35],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff8ef"
    }
  });

  map.addLayer({
    id: CLUSTER_COUNT_ID,
    type: "symbol",
    source: SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 12
    },
    paint: { "text-color": "#fff8ef" }
  });

  map.addLayer({
    id: POINTS_ID,
    type: "circle",
    source: SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#b82722",
      "circle-radius": 8,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff8ef"
    }
  });

  const pointClick = (event: LayerEvent) => {
    const publicId = event.features?.[0]?.properties?.publicId;
    if (typeof publicId === "string") onSelect(publicId);
  };

  const clusterClick = async (event: LayerEvent) => {
    const feature = event.features?.[0];
    const coordinates = feature?.geometry?.coordinates;
    const clusterId = Number(feature?.properties?.cluster_id);
    if (!coordinates || !Number.isFinite(clusterId)) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource;
    try {
      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({ center: coordinates, zoom: Math.min(zoom, 13) });
    } catch {
      map.easeTo({ center: coordinates, zoom: Math.min(map.getZoom() + 2, 13) });
    }
  };

  const pointerOn = () => { map.getCanvas().style.cursor = "pointer"; };
  const pointerOff = () => { map.getCanvas().style.cursor = ""; };

  map.on("click", POINTS_ID, pointClick as any);
  map.on("click", CLUSTERS_ID, clusterClick as any);
  map.on("mouseenter", POINTS_ID, pointerOn);
  map.on("mouseleave", POINTS_ID, pointerOff);
  map.on("mouseenter", CLUSTERS_ID, pointerOn);
  map.on("mouseleave", CLUSTERS_ID, pointerOff);

  return () => {
    map.off("click", POINTS_ID, pointClick as any);
    map.off("click", CLUSTERS_ID, clusterClick as any);
    map.off("mouseenter", POINTS_ID, pointerOn);
    map.off("mouseleave", POINTS_ID, pointerOff);
    map.off("mouseenter", CLUSTERS_ID, pointerOn);
    map.off("mouseleave", CLUSTERS_ID, pointerOff);
    for (const layer of [POINTS_ID, CLUSTER_COUNT_ID, CLUSTERS_ID]) {
      if (map.getLayer(layer)) map.removeLayer(layer);
    }
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  };
}
