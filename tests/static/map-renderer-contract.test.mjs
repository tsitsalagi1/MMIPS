import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const renderer = await readFile("components/map/MapLibreRenderer.tsx", "utf8");
const experience = await readFile("components/map/PublicMapExperience.tsx", "utf8");
const publicBoundary = await readFile("lib/public-map.ts", "utf8");

test("MapLibre is exact-pinned without a CDN", async () => {
  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
  assert.equal(manifest.dependencies["maplibre-gl"], "6.0.0");
  assert.equal(lock.packages["node_modules/maplibre-gl"].version, "6.0.0");
  assert.doesNotMatch(renderer, /https?:\/\/.*maplibre/i);
});

test("MapLibre stays behind the browser-only dynamic boundary", async () => {
  assert.match(renderer, /^"use client";/);
  assert.match(experience, /dynamic\([\s\S]*ssr: false/);
  assert.doesNotMatch(publicBoundary, /maplibre-gl|window|document/);
  assert.doesNotMatch(await readFile("app/map/page.tsx", "utf8"), /maplibre-gl/);
});

test("renderer has privacy-safe real-map and fallback controls", () => {
  assert.match(renderer, /type: "geojson"/);
  assert.match(renderer, /dragRotate: false/);
  assert.match(renderer, /pitch: 0/);
  assert.match(renderer, /scrollZoom: false/);
  assert.match(renderer, /MAP_WEBGL2_UNAVAILABLE/);
  assert.match(renderer, /webglcontextlost/);
  assert.match(renderer, /map\.remove\(\)/);
  assert.doesNotMatch(renderer, /GeolocateControl|Marker\(|geocoder|routing|draggable/);
  assert.match(experience, /public-map-list/);
  assert.match(experience, /aria-live="polite"/);
  assert.match(experience, /profiles\.map/);
  assert.doesNotMatch(experience, /points\.map\(\(point\).*<article/);
});

test("map data uses the dedicated public relation rather than private case coordinates", async () => {
  const page = await readFile("app/map/page.tsx", "utf8");
  assert.match(publicBoundary, /\.from\("public_case_map_points"\)/);
  assert.doesNotMatch(publicBoundary, /\.from\("cases"\)/);
  assert.match(page, /getPublicMapPoints\(\)/);
  assert.match(page, /loadedPoints\.filter/);
  assert.doesNotMatch(page, /item\.latitude|item\.longitude/);
});
