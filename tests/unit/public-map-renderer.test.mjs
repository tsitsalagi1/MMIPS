import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedMapResource, readPublicMapConfig, toPublicGeoJson } from "../../.test-dist/components/map/public-map-renderer.js";

const validEnv = {
  NEXT_PUBLIC_MAP_STYLE_URL: "https://maps.synthetic.invalid/styles/public.json",
  NEXT_PUBLIC_MAP_ATTRIBUTION: "Synthetic map attribution",
  NEXT_PUBLIC_MAP_ALLOWED_ORIGINS: "https://maps.synthetic.invalid,https://tiles.synthetic.invalid"
};

test("public map configuration requires HTTPS, attribution, and exact origins", () => {
  const valid = readPublicMapConfig(validEnv);
  assert.equal(valid.ok, true);
  if (!valid.ok) return;
  assert.equal(isAllowedMapResource("https://tiles.synthetic.invalid/tile/1", valid.value.allowedOrigins), true);
  assert.equal(isAllowedMapResource("https://tiles.synthetic.invalid.attacker.example/tile/1", valid.value.allowedOrigins), false);
  assert.equal(isAllowedMapResource("https://maps.synthetic.invalid.attacker.example/style", valid.value.allowedOrigins), false);
  for (const style of ["http://maps.synthetic.invalid/style", "javascript:alert(1)", "data:text/plain,x", "file:///style", "mapbox://styles/x", "custom://style"]) {
    assert.equal(readPublicMapConfig({ ...validEnv, NEXT_PUBLIC_MAP_STYLE_URL: style }).ok, false);
  }
  assert.equal(readPublicMapConfig({ ...validEnv, NEXT_PUBLIC_MAP_ATTRIBUTION: "" }).ok, false);
  assert.equal(readPublicMapConfig({ ...validEnv, NEXT_PUBLIC_MAP_ALLOWED_ORIGINS: "https://*.synthetic.invalid" }).ok, false);
  assert.equal(readPublicMapConfig({ ...validEnv, NEXT_PUBLIC_MAP_ALLOWED_ORIGINS: "https://tiles.synthetic.invalid" }).ok, false);
});

test("strict public GeoJSON projects only bounded approximate public fields in longitude-latitude order", () => {
  const point = {
    caseId: "synthetic-public-id", slug: "synthetic-profile", publicName: "Synthetic Person",
    profileType: "missing", publicStatus: "missing", publicMapLabel: "Synthetic broad area",
    publicLatitude: 35.1, publicLongitude: -95.1, precision: "county", regionType: "synthetic region",
    lastPublicUpdate: null, rawLatitude: 35.123456, exactAddress: "private synthetic value",
    moderator_approved: true, hidden_at: null, photo_storage_path: "private/path"
  };
  const result = toPublicGeoJson([point, { ...point, caseId: "invalid", publicLatitude: 91 }]);
  assert.equal(result.features.length, 1);
  assert.deepEqual(result.features[0].geometry.coordinates, [-95.1, 35.1]);
  assert.deepEqual(Object.keys(result.features[0].properties).sort(), ["precision", "profileType", "publicId", "publicMapLabel", "publicName", "publicStatus", "slug"].sort());
  const serialized = JSON.stringify(result);
  for (const forbidden of ["rawLatitude", "exactAddress", "moderator_approved", "hidden_at", "photo_storage_path", "private/path"]) assert.doesNotMatch(serialized, new RegExp(forbidden));
});
