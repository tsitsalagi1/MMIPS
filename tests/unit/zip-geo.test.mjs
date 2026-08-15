import assert from "node:assert/strict";
import test from "node:test";
import { distanceMiles, lookupZcta, normalizeAlertRadius, normalizeZip } from "../../.test-dist/lib/zip-geo.js";

test("ZIP and radius inputs are tightly normalized", () => {
  assert.equal(normalizeZip(" 74464 "), "74464");
  assert.equal(normalizeZip("7446"), null);
  assert.equal(normalizeZip("74464-1234"), null);
  assert.equal(normalizeAlertRadius("50"), 50);
  assert.equal(normalizeAlertRadius(250), 250);
  assert.equal(normalizeAlertRadius(5), null);
  assert.equal(normalizeAlertRadius(500), null);
});

test("Census ZCTA lookup sends only ZIP geography query and validates returned coordinates", async () => {
  let requested = "";
  const fetcher = async (url) => {
    requested = String(url);
    return new Response(JSON.stringify({ features: [{ attributes: { ZCTA5: "74464", CENTLAT: "+35.91", CENTLON: "-94.97" } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const point = await lookupZcta("74464", fetcher);
  assert.deepEqual(point, { zip: "74464", latitude: 35.91, longitude: -94.97, source: "U.S. Census Bureau TIGERweb 2020 ZCTA" });
  assert.match(requested, /ZCTA5/);
  assert.match(requested, /74464/);
  assert.doesNotMatch(requested, /@|email|latitude|longitude|address/i);
});

test("Census lookup fails closed on absent or malformed geography", async () => {
  assert.equal(await lookupZcta("00000", async () => new Response(JSON.stringify({ features: [] }), { status: 200 })), null);
  assert.equal(await lookupZcta("74464", async () => new Response(JSON.stringify({ features: [{ attributes: { ZCTA5: "74464", CENTLAT: "999", CENTLON: "-94" } }] }), { status: 200 })), null);
  assert.equal(await lookupZcta("74464", async () => new Response("down", { status: 503 })), null);
});

test("representative ZIP areas from every inhabited U.S. territory are accepted", async () => {
  const territorySamples = [
    { zip: "00901", latitude: 18.466109, longitude: -66.1088563, territory: "Puerto Rico" },
    { zip: "00802", latitude: 18.3427383, longitude: -64.9258422, territory: "U.S. Virgin Islands" },
    { zip: "96799", latitude: -14.1820597, longitude: -170.3833425, territory: "American Samoa" },
    { zip: "96910", latitude: 13.4548695, longitude: 144.7512511, territory: "Guam" },
    { zip: "96950", latitude: 15.1888537, longitude: 145.7534808, territory: "Northern Mariana Islands" }
  ];

  for (const sample of territorySamples) {
    const fetcher = async () => new Response(JSON.stringify({
      features: [{ attributes: { ZCTA5: sample.zip, CENTLAT: String(sample.latitude), CENTLON: String(sample.longitude) } }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
    const result = await lookupZcta(sample.zip, fetcher);
    assert.equal(result?.zip, sample.zip, sample.territory);
    assert.equal(result?.latitude, sample.latitude, sample.territory);
    assert.equal(result?.longitude, sample.longitude, sample.territory);
  }
});

test("distance helper uses miles and is symmetric", () => {
  const tahlequah = { latitude: 35.9154, longitude: -94.96996 };
  const muskogee = { latitude: 35.7479, longitude: -95.3697 };
  const distance = distanceMiles(tahlequah, muskogee);
  assert.ok(distance > 20 && distance < 30, `unexpected distance ${distance}`);
  assert.ok(Math.abs(distance - distanceMiles(muskogee, tahlequah)) < 0.000001);
  assert.equal(distanceMiles(tahlequah, tahlequah), 0);
});
