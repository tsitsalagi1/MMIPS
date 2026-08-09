import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const experience = fs.readFileSync("components/map/PublicMapExperience.tsx", "utf8");
const renderer = fs.readFileSync("components/map/MapLibreRenderer.tsx", "utf8");
const rendererCss = fs.readFileSync("components/map/MapLibreRenderer.module.css", "utf8");
const boundary = fs.readFileSync("components/map/public-map-renderer.ts", "utf8");
const page = fs.readFileSync("app/map/page.tsx", "utf8");
const serverSources = ["app/map/page.tsx", "lib/public-map.ts"].map((path) => fs.readFileSync(path, "utf8")).join("\n");

test("MapLibre 6 dependency is exact, locked, ESM-loaded, and absent from server boundaries", () => {
  assert.equal(packageJson.dependencies["maplibre-gl"], "6.0.0");
  assert.equal(lock.packages["node_modules/maplibre-gl"].version, "6.0.0");
  assert.doesNotMatch(JSON.stringify(packageJson.dependencies), /maplibre-gl[^\n]*(\^|~|latest|cdn)/i);
  assert.match(renderer, /import \* as maplibregl from "maplibre-gl"/);
  assert.match(renderer, /import "maplibre-gl\/dist\/maplibre-gl\.css"/);
  assert.doesNotMatch(serverSources, /maplibre-gl|\bwindow\b|\bdocument\b/);
});

test("renderer is client-only and uses an explicit GeoJSON point layer with bounded cleanup", () => {
  assert.match(renderer, /^"use client"/);
  assert.match(experience, /dynamic\(\(\) => import\("\.\/MapLibreRenderer"\), \{ ssr: false \}\)/);
  assert.match(renderer, /type: "geojson"/);
  assert.match(renderer, /function pointLayer\(\)/);
  assert.match(renderer, /type: "circle"/);
  assert.match(renderer, /map\.once\("load", onLoad\)/);
  assert.match(renderer, /map\.on\("click", LAYER_ID, onPointClick\)/);
  assert.match(renderer, /map\.remove\(\)/);
  assert.match(renderer, /removeEventListener\("webglcontextlost"/);
  assert.doesNotMatch(renderer + experience, /dangerouslySetInnerHTML|new maplibregl\.Marker|draggable|GeolocateControl|navigator\.geolocation|geocoder|routeControl|flyTo|localStorage|sessionStorage/);
  assert.doesNotMatch(renderer, /left:\s*[^;]+%|top:\s*[^;]+%/);
});

test("MapTiler uses the documented raster basemap path while MMIPS keeps its own point layer", () => {
  assert.match(renderer, /BASEMAP_SOURCE_ID = "maptiler-streets-raster"/);
  assert.match(renderer, /\/maps\/\$\{mapId\}\/\{z\}\/\{x\}\/\{y\}\.png\?key=/);
  assert.match(renderer, /type: "raster"/);
  assert.match(renderer, /tileSize: 512/);
  assert.match(renderer, /preferredRasterStyle \?\? config\.styleUrl/);
  assert.match(renderer, /isAllowedMapResource\(tileUrl/);
});

test("camera opens on a United States overview and preserves page scrolling", () => {
  assert.match(renderer, /CONTIGUOUS_US_BOUNDS/);
  assert.match(renderer, /\[\[-125, 24\], \[-66\.5, 49\.5\]\]/);
  assert.match(renderer, /center: \[-98\.5, 38\.5\]/);
  assert.match(renderer, /zoom: 3/);
  assert.match(renderer, /fitBounds\(bounds, \{ padding: 28, duration: 0, maxZoom: 4 \}\)/);
  for (const setting of ["dragRotate: false", "pitchWithRotate: false", "scrollZoom: false", "touchPitch: false", "maxPitch: 0"]) assert.match(renderer, new RegExp(setting));
  assert.match(renderer, /showCompass: false/);
  assert.match(rendererCss, /\.canvas\{height:24rem;width:100%;min-height:24rem\}/);
});

test("configuration, request, compatible WebGL fallback, and hard failures fail safely to the list", () => {
  assert.match(boundary, /styleUrl\.protocol !== "https:"/);
  assert.match(boundary, /origin\.includes\("\*"\)/);
  assert.match(boundary, /allowedOrigins\.has\(url\.origin\)/);
  assert.match(boundary, /getContext\("webgl2"\) \|\| canvas\.getContext\("webgl"\)/);
  assert.doesNotMatch(boundary, /failIfMajorPerformanceCaveat:\s*true/);
  for (const code of ["MAP_CONFIG_UNAVAILABLE", "MAP_CONFIG_INVALID", "MAP_WEBGL_UNAVAILABLE", "MAP_INITIALIZATION_FAILED", "MAP_STYLE_LOAD_FAILED", "MAP_RESOURCE_REJECTED", "MAP_CONTEXT_LOST"]) assert.match(renderer + boundary, new RegExp(code));
  assert.match(renderer, /Visual map unavailable\./);
  assert.match(renderer, /Retry visual map/);
  assert.doesNotMatch(renderer, /MAP_LOAD_TIMEOUT_MS|setFailure\("MAP_STYLE_LOAD_FAILED"\)[\s\S]{0,160}setTimeout/);
  assert.doesNotMatch(renderer, /console\.(log|warn|error)\([^\n]*(url|points|geoJson|provider)/i);
});

test("slow loading remains non-destructive and gives the user a wait-or-retry choice", () => {
  assert.match(renderer, /MAP_SLOW_LOAD_NOTICE_MS = 15000/);
  assert.match(renderer, /if \(!mapLoaded\) setLoadingSlowly\(true\)/);
  assert.match(renderer, /Map is taking longer than expected to load\./);
  assert.match(renderer, /You can keep waiting; the map will continue loading, or you can retry it\./);
  assert.match(renderer, /data-map-state=\{failure \? "fallback" : loadingSlowly \? "loading-slowly" : "interactive"\}/);
  assert.match(rendererCss, /\.loadingNotice/);
});

test("map uses filtered points while the complete list uses published profiles", () => {
  assert.match(experience, /<MapLibreRenderer points=\{filtered\}/);
  assert.match(experience, /profiles\.map\(\(profile\)/);
  assert.doesNotMatch(experience, /filtered\.map\(\(point\)/);
  assert.match(page, /getPublishedCases\(\)/);
  assert.match(page, /getPublicMapPoints\(\)/);
  assert.match(page, /profiles=\{profiles\}/);
  assert.match(experience, /Skip visual map and go to the complete accessible list/);
  assert.match(experience, /id="accessible-map-list"/);
  assert.match(experience, /aria-live="polite" aria-atomic="true"/);
  assert.match(experience, /Open public profile/);
  assert.match(experience, /complete accessible list/);
  assert.match(experience, /not an exact location/);
});
