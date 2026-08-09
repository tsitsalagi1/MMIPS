import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const experience = fs.readFileSync("components/map/PublicMapExperience.tsx", "utf8");
const renderer = fs.readFileSync("components/map/MapLibreRenderer.tsx", "utf8");
const clusters = fs.readFileSync("components/map/public-map-clusters.ts", "utf8");
const rendererCss = fs.readFileSync("components/map/MapLibreRenderer.module.css", "utf8");
const boundary = fs.readFileSync("components/map/public-map-renderer.ts", "utf8");
const page = fs.readFileSync("app/map/page.tsx", "utf8");
const zipRoute = fs.readFileSync("app/api/map/zip/route.ts", "utf8");
const serverSources = ["app/map/page.tsx", "lib/public-map.ts"].map((path) => fs.readFileSync(path, "utf8")).join("\n");

test("MapLibre 6 dependency is exact, locked, ESM-loaded, and absent from server boundaries", () => {
  assert.equal(packageJson.dependencies["maplibre-gl"], "6.0.0");
  assert.equal(lock.packages["node_modules/maplibre-gl"].version, "6.0.0");
  assert.doesNotMatch(JSON.stringify(packageJson.dependencies), /maplibre-gl[^\n]*(\^|~|latest|cdn)/i);
  assert.match(renderer, /import \* as maplibregl from "maplibre-gl"/);
  assert.match(renderer, /import "maplibre-gl\/dist\/maplibre-gl\.css"/);
  assert.doesNotMatch(serverSources, /maplibre-gl|\bwindow\b|\bdocument\b/);
});

test("small result sets retain independent accessible MapLibre markers", () => {
  assert.match(renderer, /^"use client"/);
  assert.match(experience, /dynamic\(\(\) => import\("\.\/MapLibreRenderer"\), \{ ssr: false \}\)/);
  assert.match(renderer, /CLUSTER_THRESHOLD = 300/);
  assert.match(renderer, /new maplibregl\.Marker\(\{ element, anchor: "center" \}\)/);
  assert.match(renderer, /element\.type = "button"/);
  assert.match(renderer, /element\.setAttribute\("aria-label"/);
  assert.match(rendererCss, /\.publicMarker/);
  assert.doesNotMatch(renderer + experience + clusters, /dangerouslySetInnerHTML|draggable|GeolocateControl|navigator\.geolocation|geocoder|routeControl|localStorage|sessionStorage/);
});

test("large result sets use viewport-bounded DOM clustering instead of fragile style layers", () => {
  assert.match(renderer, /geoJson\.features\.length > CLUSTER_THRESHOLD/);
  assert.match(renderer, /addClusteredPublicPoints/);
  assert.match(renderer, /data-point-mode=\{points\.length > CLUSTER_THRESHOLD \? "clustered" : "markers"\}/);
  assert.match(clusters, /CELL_SIZE_PX = 56/);
  assert.match(clusters, /inViewport\(map, coordinates\)/);
  assert.match(clusters, /map\.project\(coordinates\)/);
  assert.match(clusters, /Math\.floor\(projected\.x \/ CELL_SIZE_PX\)/);
  assert.match(clusters, /new maplibregl\.Marker/);
  assert.match(clusters, /mmipsClusterMarker/);
  assert.match(clusters, /mmipsClusterPointMarker/);
  assert.match(clusters, /map\.on\("moveend", render\)/);
  assert.match(clusters, /map\.on\("resize", render\)/);
  assert.doesNotMatch(clusters, /addSource|addLayer|cluster:\s*true|getClusterExpansionZoom/);
  assert.match(rendererCss, /mmipsClusterMarker/);
});

test("large cluster rendering no longer waits for MapLibre style load", () => {
  assert.match(renderer, /clusterCleanupRef\.current = addClusteredPublicPoints/);
  assert.doesNotMatch(renderer, /pendingClusterLoadRef/);
  assert.doesNotMatch(renderer, /if \(geoJson\.features\.length > CLUSTER_THRESHOLD && !map\.isStyleLoaded\(\)\)/);
});

test("MapTiler remains the raster basemap while MMIPS data stays a separate overlay", () => {
  assert.match(renderer, /BASEMAP_SOURCE_ID = "maptiler-streets-raster"/);
  assert.match(renderer, /\/maps\/\$\{mapId\}\/\{z\}\/\{x\}\/\{y\}\.png\?key=/);
  assert.match(renderer, /type: "raster"/);
  assert.match(renderer, /tileSize: 512/);
  assert.match(renderer, /preferredRasterStyle \?\? config\.styleUrl/);
  assert.match(renderer, /isAllowedMapResource\(tileUrl/);
});

test("camera frames the United States and Canada and preserves page scrolling", () => {
  assert.match(renderer, /CONTINENTAL_BOUNDS/);
  assert.match(renderer, /\[\[-141, 24\], \[-52, 83\]\]/);
  assert.match(renderer, /center: \[-100, 45\]/);
  assert.match(renderer, /zoom: 2\.5/);
  assert.match(renderer, /fitBounds\(bounds, \{ padding: 28, duration: 0, maxZoom: 4 \}\)/);
  for (const setting of ["dragRotate: false", "pitchWithRotate: false", "scrollZoom: false", "touchPitch: false", "maxPitch: 0"]) assert.match(renderer, new RegExp(setting));
  assert.match(renderer, /showCompass: false/);
  assert.match(rendererCss, /\.canvas\{height:24rem;width:100%;min-height:24rem\}/);
});

test("ZIP search uses the existing Census lookup behind a no-store same-origin request", () => {
  assert.match(experience, /fetch\("\/api\/map\/zip"/);
  assert.match(experience, /method: "POST"/);
  assert.match(experience, /cache: "no-store"/);
  assert.match(experience, /pattern="\[0-9\]\{5\}"/);
  assert.match(experience, /autoComplete="postal-code"/);
  assert.match(experience, /MMIPS does not save this ZIP search as a case location/);
  assert.match(zipRoute, /lookupZcta\(zip\)/);
  assert.match(zipRoute, /normalizeZip/);
  assert.match(zipRoute, /"Cache-Control": "no-store"/);
  assert.doesNotMatch(zipRoute, /console\.|request\.nextUrl|searchParams/);
});

test("ZIP search focuses the map with a zero-duration camera change", () => {
  assert.match(experience, /focusTarget=\{mapFocus\}/);
  assert.match(renderer, /focusTarget\?: MapFocusTarget \| null/);
  assert.match(renderer, /map\.flyTo\(/);
  assert.match(renderer, /center: \[focusTarget\.longitude, focusTarget\.latitude\]/);
  assert.match(renderer, /zoom: focusTarget\.zoom \?\? 9/);
  assert.match(renderer, /duration: 0/);
  assert.doesNotMatch(renderer, /duration:\s*[1-9][0-9]*/);
});

test("configuration, request, compatible WebGL fallback, and hard failures fail safely", () => {
  assert.match(boundary, /styleUrl\.protocol !== "https:"/);
  assert.match(boundary, /origin\.includes\("\*"\)/);
  assert.match(boundary, /allowedOrigins\.has\(url\.origin\)/);
  assert.match(boundary, /getContext\("webgl2"\) \|\| canvas\.getContext\("webgl"\)/);
  assert.doesNotMatch(boundary, /failIfMajorPerformanceCaveat:\s*true/);
  for (const code of ["MAP_CONFIG_UNAVAILABLE", "MAP_CONFIG_INVALID", "MAP_WEBGL_UNAVAILABLE", "MAP_INITIALIZATION_FAILED", "MAP_STYLE_LOAD_FAILED", "MAP_RESOURCE_REJECTED", "MAP_CONTEXT_LOST"]) assert.match(renderer + boundary, new RegExp(code));
  assert.match(renderer, /Visual map unavailable\./);
  assert.match(renderer, /Use Search Profiles to browse public profiles without the map/);
  assert.match(renderer, /Retry visual map/);
});

test("slow basemap loading remains non-destructive", () => {
  assert.match(renderer, /MAP_SLOW_LOAD_NOTICE_MS = 15000/);
  assert.match(renderer, /if \(!mapLoaded\) setLoadingSlowly\(true\)/);
  assert.match(renderer, /Public profiles remain available through Search Profiles/);
  assert.match(renderer, /map\.once\("idle", onIdle\)/);
  assert.match(renderer, /data-map-state=\{failure \? "fallback" : loadingSlowly \? "loading-slowly" : "interactive"\}/);
  assert.match(rendererCss, /\.loadingNotice/);
});

test("map page is map-first and does not duplicate paginated profile cards", () => {
  assert.match(experience, /<MapLibreRenderer points=\{filtered\}/);
  assert.match(experience, /href="\/profiles"/);
  assert.match(experience, /Prefer a list or need a non-map view\? Search public profiles/);
  assert.doesNotMatch(experience, /ACCESSIBLE_PAGE_SIZE|accessiblePoints|accessible-map-list|Previous 20|Next 20|Page \{safePage\}/);
  assert.doesNotMatch(experience, /\.map\(\(point\) => <article/);
  assert.doesNotMatch(page, /getPublishedCases\(\)/);
  assert.match(page, /getPublicMapPoints\(\)/);
  assert.match(page, /<h1>MMIPS public map<\/h1>/);
});
