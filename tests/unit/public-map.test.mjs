import assert from "node:assert/strict";
import test from "node:test";
import { toPublicGeoJson } from "../../.test-dist/lib/public-map.js";
import { isAllowedMapRequest, validateMapConfig } from "../../.test-dist/lib/public-map-config.js";

const point = { publicId: "synthetic-1", slug: "synthetic-profile", publicName: "Synthetic profile", mapLabel: "Synthetic approximate area", profileType: "missing", status: "missing", precision: "approximate", publicLongitude: -100, publicLatitude: 40 };

test("configuration requires HTTPS, attribution, and exact allowed origins", () => {
  assert.equal(validateMapConfig({ styleUrl: "https://maps.example.test/style.json", attribution: "Synthetic provider", allowedOrigins: "https://maps.example.test" }).ok, true);
  for (const styleUrl of ["http://maps.example.test/style", "javascript:alert(1)", "data:text/plain,x", "file:///tmp/style", "custom://maps/style"]) assert.equal(validateMapConfig({ styleUrl, attribution: "Provider", allowedOrigins: "https://maps.example.test" }).ok, false);
  assert.equal(validateMapConfig({ styleUrl: "https://maps.example.test/style", attribution: "", allowedOrigins: "https://maps.example.test" }).ok, false);
  assert.equal(validateMapConfig({ styleUrl: "https://maps.example.test/style", attribution: "Provider", allowedOrigins: "https://*.example.test" }).ok, false);
});

test("request validation cannot be bypassed with a substring origin", () => {
  const origins = new Set(["https://maps.example.test"]);
  assert.equal(isAllowedMapRequest("https://maps.example.test/tile", origins), true);
  assert.equal(isAllowedMapRequest("https://maps.example.test.attacker.invalid/tile", origins), false);
});

test("strict public GeoJSON uses longitude then latitude and excludes invalid points", () => {
  const result = toPublicGeoJson([point, { ...point, publicId: "invalid", publicLongitude: 181 }]);
  assert.equal(result.features.length, 1);
  assert.deepEqual(result.features[0].geometry.coordinates, [-100, 40]);
  assert.deepEqual(Object.keys(result.features[0].properties).sort(), ["mapLabel", "precision", "profileType", "publicId", "publicName", "slug", "status"]);
  assert.equal(JSON.stringify(result).includes("private"), false);
  assert.equal(JSON.stringify(result).includes("photo"), false);
});
