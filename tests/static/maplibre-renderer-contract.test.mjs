import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const explorer = fs.readFileSync("components/ProfilesSearch.tsx", "utf8");
const renderer = fs.readFileSync("components/map/MapLibreRenderer.tsx", "utf8");
const clusters = fs.readFileSync("components/map/public-map-clusters.ts", "utf8");
const rendererCss = fs.readFileSync("components/map/MapLibreRenderer.module.css", "utf8");
const boundary = fs.readFileSync("components/map/public-map-renderer.ts", "utf8");
const mapRedirect = fs.readFileSync("app/map/page.tsx", "utf8");
const mapDataRoute = fs.readFileSync("app/api/profiles/map/route.ts", "utf8");
const publicMap = fs.readFileSync("lib/public-map.ts", "utf8");
const serverSources = ["app/map/page.tsx", "app/api/profiles/map/route.ts", "lib/public-map.ts"].map((path) => fs.readFileSync(path, "utf8")).join("\n");

test("MapLibre 6 dependency is exact, locked, ESM-loaded, and absent from server boundaries", () => {
  assert.equal(packageJson.dependencies["maplibre-gl"], "6.0.0");
  assert.equal(lock.packages["node_modules/maplibre-gl"].version, "6.0.0");
  assert.equal(packageJson.dependencies["maplibre-gl"].includes("^") || packageJson.dependencies["maplibre-gl"].includes("~"), false);
  assert.match(renderer, /import \* as maplibregl from "maplibre-gl"/);
  assert.match(renderer, /import "maplibre-gl\/dist\/maplibre-gl\.css"/);
  assert.doesNotMatch(serverSources, /maplibre-gl|\bwindow\b|\bdocument\b/);
});

test("Search Profiles dynamically owns the browser map", () => {
  assert.match(explorer, /dynamic\(\(\) => import\("\.\/map\/MapLibreRenderer"\), \{ ssr: false \}\)/);
  assert.match(explorer, /National MMIPS public profile map/);
  assert.match(explorer, /fetch\("\/api\/profiles\/map"/);
  assert.match(mapDataRoute, /getPublicMapPoints\(\)/);
});

test("small result sets retain independent accessible MapLibre markers", () => {
  assert.match(renderer, /^"use client"/);
  assert.match(renderer, /CLUSTER_THRESHOLD = 300/);
  assert.match(renderer, /new maplibregl\.Marker\(\{ element, anchor: "center" \}\)/);
  assert.match(renderer, /element\.type = "button"/);
  assert.match(renderer, /element\.setAttribute\("aria-label"/);
  assert.match(rendererCss, /\.publicMarker/);
  assert.doesNotMatch(renderer + explorer + clusters, /dangerouslySetInnerHTML|draggable|GeolocateControl|navigator\.geolocation|geocoder|routeControl|localStorage|sessionStorage/);
});

test("national result sets use viewport-bounded DOM clustering", () => {
  assert.match(renderer, /geoJson\.features\.length > CLUSTER_THRESHOLD/);
  assert.match(renderer, /addClusteredPublicPoints/);
  assert.match(clusters, /CELL_SIZE_PX = 56/);
  assert.match(clusters, /inViewport\(map, coordinates\)/);
  assert.match(clusters, /map\.project\(coordinates\)/);
  assert.match(clusters, /Math\.floor\(projected\.x \/ CELL_SIZE_PX\)/);
  assert.match(clusters, /new maplibregl\.Marker/);
  assert.match(clusters, /mmipsClusterMarker/);
  assert.match(clusters, /map\.on\("moveend", render\)/);
  assert.match(clusters, /map\.on\("resize", render\)/);
  assert.doesNotMatch(clusters, /addSource|addLayer|cluster:\s*true|getClusterExpansionZoom/);
});

test("MapTiler remains the raster basemap while MMIPS data stays a separate overlay", () => {
  assert.match(renderer, /BASEMAP_SOURCE_ID = "maptiler-streets-raster"/);
  assert.match(renderer, /type: "raster"/);
  assert.match(renderer, /tileSize: 512/);
  assert.match(renderer, /preferredRasterStyle \?\? config\.styleUrl/);
  assert.match(renderer, /isAllowedMapResource\(tileUrl/);
});

test("camera starts continent-wide, then fits filtered results without animation", () => {
  assert.match(renderer, /CONTINENTAL_BOUNDS/);
  assert.match(renderer, /\[\[-141, 24\], \[-52, 83\]\]/);
  assert.match(renderer, /center: \[-100, 45\]/);
  assert.match(renderer, /zoom: 2\.5/);
  assert.match(renderer, /geoJson\.features\.length === 1/);
  assert.match(renderer, /maxZoom: 6/);
  assert.match(renderer, /duration: 0/);
  assert.doesNotMatch(renderer, /duration:\s*[1-9][0-9]*/);
  for (const setting of ["dragRotate: false", "pitchWithRotate: false", "scrollZoom: false", "touchPitch: false", "maxPitch: 0"]) assert.match(renderer, new RegExp(setting));
});

test("profile searches narrow the map and ZIP searches may provide a bounded camera focus", () => {
  assert.match(explorer, /fetch\("\/api\/profiles\/search"/);
  assert.match(explorer, /setVisiblePoints\(mapped\)/);
  assert.match(explorer, /focusTarget=\{mapFocus\}/);
  assert.match(renderer, /focusTarget\?: MapFocusTarget \| null/);
  assert.match(renderer, /center: \[focusTarget\.longitude, focusTarget\.latitude\]/);
  assert.match(renderer, /if \(!focusTarget\) updateMapCamera\(map, geoJson\)/);
});

test("configuration, WebGL, resource, and context failures fail safely", () => {
  assert.match(boundary, /styleUrl\.protocol !== "https:"/);
  assert.match(boundary, /origin\.includes\("\*"\)/);
  assert.match(boundary, /allowedOrigins\.has\(url\.origin\)/);
  assert.match(boundary, /getContext\("webgl2"\) \|\| canvas\.getContext\("webgl"\)/);
  for (const code of ["MAP_CONFIG_UNAVAILABLE", "MAP_CONFIG_INVALID", "MAP_WEBGL_UNAVAILABLE", "MAP_INITIALIZATION_FAILED", "MAP_STYLE_LOAD_FAILED", "MAP_RESOURCE_REJECTED", "MAP_CONTEXT_LOST"]) assert.match(renderer + boundary, new RegExp(code));
  assert.match(renderer, /Search controls remain available/);
  assert.match(renderer, /Retry visual map/);
});

test("legacy standalone map URL permanently redirects to Search Profiles", () => {
  assert.match(mapRedirect, /permanentRedirect\("\/profiles"\)/);
  assert.doesNotMatch(mapRedirect, /PublicMapExperience|MapLibreRenderer/);
});

test("complete national public map loader remains bounded", () => {
  assert.match(publicMap, /MAP_POINT_PAGE_SIZE = 1000/);
  assert.match(publicMap, /MAP_POINT_SAFETY_LIMIT = 10000/);
  assert.match(publicMap, /CASE_ID_CHUNK_SIZE = 200/);
});
