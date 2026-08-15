import assert from "node:assert/strict";
import test from "node:test";
import {
  CANADA_ALERT_RADIUS_KM_OPTIONS,
  canadaFsaCount,
  kilometresToMiles,
  lookupCanadianPostalArea,
  normalizeCanadaAlertRadiusKm
} from "../../.test-dist/lib/canada-postal-geo.js";

test("Canada alert lookup reduces a full postal code to its broad FSA", () => {
  const area = lookupCanadianPostalArea(" k1a0b1 ");
  assert.equal(area?.postalCode, "K1A 0B1");
  assert.equal(area?.fsa, "K1A");
  assert.equal(area?.provinceTerritory, "ON");
  assert.ok(Number.isFinite(area?.latitude));
  assert.ok(Number.isFinite(area?.longitude));
  assert.match(area?.source ?? "", /Statistics Canada 2021 Census/);
});

test("Canada alert lookup rejects malformed and unrepresented postal codes", () => {
  assert.equal(lookupCanadianPostalArea("12345"), null);
  assert.equal(lookupCanadianPostalArea("D1A 1A1"), null);
  assert.equal(lookupCanadianPostalArea("Z9Z 9Z9"), null);
});

test("Canada alert matching uses the complete official FSA boundary set", () => {
  assert.equal(canadaFsaCount(), 1643);
});

test("Canada alert distances are explicit kilometre choices with integer-mile matching", () => {
  assert.deepEqual(CANADA_ALERT_RADIUS_KM_OPTIONS, [25, 50, 100, 250, 500]);
  assert.equal(normalizeCanadaAlertRadiusKm("50"), 50);
  assert.equal(normalizeCanadaAlertRadiusKm(75), null);
  assert.equal(kilometresToMiles(25), 16);
  assert.equal(kilometresToMiles(500), 311);
});
