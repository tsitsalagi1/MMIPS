import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { safeApiError } from "@/lib/security/api-errors";
import { mmipsSiteMode } from "@/lib/site-mode";
import {
  SYNTHETIC_SCALE_BENCHMARKS,
  syntheticScaleStatus,
  type SyntheticScaleSource
} from "@/lib/synthetic-scale-benchmarks";

export const dynamic = "force-dynamic";

const PREFIX = "mmips-test-scale-";
const BATCH_SIZE = 150;
const SOURCE_PAGE_SIZE = 1000;
const US_COMBINED_LAYER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer/47/query";
const US_ALASKA_LAYER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer/6/query";
const US_TERRITORY_LAYER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/2/query";
const US_TERRITORY_FIPS = ["60", "66", "69", "72", "78"] as const;
const CANADA_LAYER = "https://services.sac-isc.gc.ca/geomatics/rest/services/AGOL_FEATURE_SERVICES/First_Nations_Aboriginal_Lands_E/FeatureServer/2/query";
const CANADA_INUIT_LAYER = "https://geo.sac-isc.gc.ca/geomatics/rest/services/Donnees_Ouvertes-Open_Data/Communaute_inuite_Inuit_Community/MapServer/0/query";
const CANADA_FIRST_NATIONS_LAYER = "https://geo.sac-isc.gc.ca/geomatics/rest/services/Donnees_Ouvertes-Open_Data/Premiere_Nation_First_Nation/MapServer/0/query";
const YUKON_BAND_NUMBERS = new Set([490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 502, 503, 506, 507, 508]);

type SourceRecord = {
  source: SyntheticScaleSource;
  sourceId: string;
  geographyName: string;
  affiliation: string;
  regionCode: string | null;
  latitude: number;
  longitude: number;
  regionType: string;
  syntheticIndex: number;
};
type OfficialGeography = Omit<SourceRecord, "syntheticIndex">;

function authorizeScaleAdmin(request: NextRequest) { return requireAdmin(request); }
type Admin = Awaited<ReturnType<typeof authorizeScaleAdmin>> & { ok: true };

let usCombinedCache: Promise<OfficialGeography[]> | null = null;
let usAlaskaCache: Promise<OfficialGeography[]> | null = null;
let usTerritoryCache: Promise<OfficialGeography[]> | null = null;
let canadaCache: Promise<OfficialGeography[]> | null = null;

function safeInteger(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function validCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function siteSource(): SyntheticScaleSource | null {
  const mode = mmipsSiteMode();
  return mode === "us" || mode === "ca" ? mode : null;
}

function sourcePrefix(source: SyntheticScaleSource) {
  return `${PREFIX}${source}-`;
}

async function fetchJson(url: URL) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`SOURCE_HTTP_${response.status}`);
  const body = await response.json();
  if (body?.error) throw new Error("SOURCE_ARCGIS_ERROR");
  return body;
}

async function fetchCensusGeographies(layer: string, regionType: string, regionCode: string | null): Promise<OfficialGeography[]> {
  const records: OfficialGeography[] = [];
  for (let offset = 0; offset < 10000; offset += SOURCE_PAGE_SIZE) {
    const url = new URL(layer);
    url.searchParams.set("where", "1=1");
    url.searchParams.set("outFields", "OBJECTID,GEOID,BASENAME,NAME,CENTLAT,CENTLON");
    url.searchParams.set("returnGeometry", "false");
    url.searchParams.set("orderByFields", "OBJECTID ASC");
    url.searchParams.set("resultOffset", String(offset));
    url.searchParams.set("resultRecordCount", String(SOURCE_PAGE_SIZE));
    url.searchParams.set("f", "json");
    const body = await fetchJson(url);
    const features = Array.isArray(body?.features) ? body.features : [];
    records.push(...features.flatMap((feature: any) => {
      const attributes = feature?.attributes || {};
      const latitude = Number(attributes.CENTLAT);
      const longitude = Number(attributes.CENTLON);
      const sourceId = String(attributes.GEOID || attributes.OBJECTID || "").trim();
      const geographyName = String(attributes.NAME || attributes.BASENAME || "Indigenous area").trim();
      if (!sourceId || !validCoordinate(latitude, longitude)) return [];
      return [{ source: "us", sourceId, geographyName, affiliation: geographyName, regionCode, latitude, longitude, regionType } satisfies OfficialGeography];
    }));
    if (features.length < SOURCE_PAGE_SIZE || body?.exceededTransferLimit !== true) break;
  }
  return records;
}

async function fetchUsTerritoryGeographies(): Promise<OfficialGeography[]> {
  const url = new URL(US_TERRITORY_LAYER);
  const quotedCodes = US_TERRITORY_FIPS.map((code) => `'${code}'`).join(",");
  url.searchParams.set("where", `STATE IN (${quotedCodes})`);
  url.searchParams.set("outFields", "OBJECTID,STATE,BASENAME,NAME,STUSAB,CENTLAT,CENTLON");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("orderByFields", "STATE ASC");
  url.searchParams.set("f", "json");
  const body = await fetchJson(url);
  const features = Array.isArray(body?.features) ? body.features : [];
  const records = features.flatMap((feature: any) => {
    const attributes = feature?.attributes || {};
    const latitude = Number(attributes.CENTLAT);
    const longitude = Number(attributes.CENTLON);
    const sourceId = String(attributes.STATE || attributes.OBJECTID || "").trim();
    const geographyName = String(attributes.NAME || attributes.BASENAME || "U.S. territory").trim();
    const regionCode = String(attributes.STUSAB || "").trim();
    if (!sourceId || !regionCode || !validCoordinate(latitude, longitude)) return [];
    return [{
      source: "us",
      sourceId,
      geographyName,
      affiliation: "Indigenous community affiliation intentionally unspecified - territory coverage fixture only",
      regionCode,
      latitude,
      longitude,
      regionType: "us_territory_scale_test"
    } satisfies OfficialGeography];
  });
  if (records.length !== US_TERRITORY_FIPS.length) throw new Error("OFFICIAL_TERRITORY_COVERAGE_INCOMPLETE");
  return records;
}

async function fetchCanadaGeographies(): Promise<OfficialGeography[]> {
  const records: OfficialGeography[] = [];
  for (let offset = 0; offset < 10000; offset += SOURCE_PAGE_SIZE) {
    const url = new URL(CANADA_LAYER);
    url.searchParams.set("where", "ADMIN_LAND_TYPE='INDIAN RESERVE'");
    url.searchParams.set("outFields", "OBJECTID,ADMIN_LAND_ID,SHORT_NAME,ENAME,CPC_CODE,FIRST_NATIONS");
    url.searchParams.set("returnGeometry", "true");
    url.searchParams.set("outSR", "4326");
    url.searchParams.set("orderByFields", "OBJECTID ASC");
    url.searchParams.set("resultOffset", String(offset));
    url.searchParams.set("resultRecordCount", String(SOURCE_PAGE_SIZE));
    url.searchParams.set("f", "json");
    const body = await fetchJson(url);
    const features = Array.isArray(body?.features) ? body.features : [];
    records.push(...features.flatMap((feature: any) => {
      const attributes = feature?.attributes || {};
      const latitude = Number(feature?.geometry?.y);
      const longitude = Number(feature?.geometry?.x);
      const sourceId = String(attributes.ADMIN_LAND_ID || attributes.OBJECTID || "").trim();
      const geographyName = String(attributes.ENAME || attributes.SHORT_NAME || "First Nation reserve").trim();
      const affiliation = String(attributes.FIRST_NATIONS || geographyName).trim();
      const regionCode = typeof attributes.CPC_CODE === "string" ? attributes.CPC_CODE.trim() || null : null;
      if (!sourceId || !validCoordinate(latitude, longitude)) return [];
      return [{ source: "ca", sourceId, geographyName, affiliation, regionCode, latitude, longitude, regionType: "canadian_reserve_scale_test" } satisfies OfficialGeography];
    }));
    if (features.length < SOURCE_PAGE_SIZE || body?.exceededTransferLimit !== true) break;
  }
  const inuitUrl = new URL(CANADA_INUIT_LAYER);
  inuitUrl.searchParams.set("where", "1=1");
  inuitUrl.searchParams.set("outFields", "OBJECTID,ID,NAME,REGION,PROVINCE_CODE");
  inuitUrl.searchParams.set("returnGeometry", "true");
  inuitUrl.searchParams.set("outSR", "4326");
  inuitUrl.searchParams.set("orderByFields", "OBJECTID ASC");
  inuitUrl.searchParams.set("resultRecordCount", String(SOURCE_PAGE_SIZE));
  inuitUrl.searchParams.set("f", "json");
  const inuitBody = await fetchJson(inuitUrl);
  const inuit = (Array.isArray(inuitBody?.features) ? inuitBody.features : []).flatMap((feature: any) => {
    const attributes = feature?.attributes || {};
    const latitude = Number(feature?.geometry?.y);
    const longitude = Number(feature?.geometry?.x);
    const sourceId = String(attributes.ID || attributes.OBJECTID || "").trim();
    const geographyName = String(attributes.NAME || "Inuit community").trim();
    const region = String(attributes.REGION || "Inuit Nunangat").trim();
    const regionCode = typeof attributes.PROVINCE_CODE === "string" ? attributes.PROVINCE_CODE.trim() || null : null;
    if (!sourceId || !validCoordinate(latitude, longitude) || !regionCode) return [];
    return [{ source: "ca", sourceId, geographyName, affiliation: region, regionCode, latitude, longitude, regionType: "inuit_community_scale_test" } satisfies OfficialGeography];
  });

  const firstNationsUrl = new URL(CANADA_FIRST_NATIONS_LAYER);
  firstNationsUrl.searchParams.set("where", "1=1");
  firstNationsUrl.searchParams.set("outFields", "OBJECTID,BAND_NUMBER,BAND_NAME");
  firstNationsUrl.searchParams.set("returnGeometry", "true");
  firstNationsUrl.searchParams.set("outSR", "4326");
  firstNationsUrl.searchParams.set("orderByFields", "OBJECTID ASC");
  firstNationsUrl.searchParams.set("resultRecordCount", String(SOURCE_PAGE_SIZE));
  firstNationsUrl.searchParams.set("f", "json");
  const firstNationsBody = await fetchJson(firstNationsUrl);
  const yukon = (Array.isArray(firstNationsBody?.features) ? firstNationsBody.features : []).flatMap((feature: any) => {
    const attributes = feature?.attributes || {};
    const bandNumber = Number(attributes.BAND_NUMBER);
    const latitude = Number(feature?.geometry?.y);
    const longitude = Number(feature?.geometry?.x);
    const geographyName = String(attributes.BAND_NAME || "Yukon First Nation").trim();
    if (!YUKON_BAND_NUMBERS.has(bandNumber) || !validCoordinate(latitude, longitude)) return [];
    return [{ source: "ca", sourceId: String(bandNumber), geographyName, affiliation: geographyName, regionCode: "YT", latitude, longitude, regionType: "yukon_first_nation_scale_test" } satisfies OfficialGeography];
  });

  return [...inuit, ...yukon, ...records];
}

function cachedGeographies(source: SyntheticScaleSource) {
  if (source === "ca") {
    canadaCache ||= fetchCanadaGeographies();
    return Promise.all([canadaCache, Promise.resolve([] as OfficialGeography[]), Promise.resolve([] as OfficialGeography[])]);
  }
  usCombinedCache ||= fetchCensusGeographies(US_COMBINED_LAYER, "aiannh_area_scale_test", null);
  usAlaskaCache ||= fetchCensusGeographies(US_ALASKA_LAYER, "alaska_native_village_scale_test", "Alaska");
  usTerritoryCache ||= fetchUsTerritoryGeographies();
  return Promise.all([usCombinedCache, usAlaskaCache, usTerritoryCache]);
}

async function fetchSourceBatch(source: SyntheticScaleSource, offset: number): Promise<{ records: SourceRecord[]; done: boolean }> {
  const benchmark = SYNTHETIC_SCALE_BENCHMARKS[source];
  if (offset >= benchmark.targetProfiles) return { records: [], done: true };
  const length = Math.min(BATCH_SIZE, benchmark.targetProfiles - offset);
  const [national, alaska, territories] = await cachedGeographies(source);
  if (!national.length || (source === "us" && (!alaska.length || !territories.length))) throw new Error("OFFICIAL_GEOGRAPHY_SOURCE_EMPTY");

  const records = Array.from({ length }, (_, index): SourceRecord => {
    const syntheticIndex = offset + index;
    const useAlaska = source === "us" && syntheticIndex < benchmark.alaskaProfiles;
    if (useAlaska) return { ...alaska[syntheticIndex % alaska.length], syntheticIndex };
    const territoryIndex = syntheticIndex - benchmark.alaskaProfiles;
    const useTerritory = source === "us" && territoryIndex >= 0 && territoryIndex < benchmark.territoryProfiles;
    if (useTerritory) return { ...territories[territoryIndex % territories.length], syntheticIndex };
    if (source === "ca") {
      const mandatory = national.filter((item) => item.regionType !== "canadian_reserve_scale_test");
      if (syntheticIndex < mandatory.length) return { ...mandatory[syntheticIndex], syntheticIndex };
      const reserves = national.filter((item) => item.regionType === "canadian_reserve_scale_test");
      const reserveIndex = Math.floor((syntheticIndex - mandatory.length) * reserves.length / (benchmark.targetProfiles - mandatory.length));
      return { ...reserves[reserveIndex], syntheticIndex };
    }
    const countryIndex = syntheticIndex - benchmark.alaskaProfiles - benchmark.territoryProfiles;
    const countryTarget = benchmark.targetProfiles - benchmark.alaskaProfiles - benchmark.territoryProfiles;
    const poolIndex = Math.floor(countryIndex * national.length / countryTarget) % national.length;
    return { ...national[poolIndex], syntheticIndex };
  });
  return { records, done: offset + length >= benchmark.targetProfiles };
}

function slugFor(record: SourceRecord) {
  return `${sourcePrefix(record.source)}current-${String(record.syntheticIndex + 1).padStart(6, "0")}`;
}

async function stageBatch(admin: Admin, source: SyntheticScaleSource, offset: number) {
  const page = await fetchSourceBatch(source, offset);
  if (!page.records.length) return { inserted: 0, nextOffset: offset, done: true };
  const candidateSlugs = page.records.map(slugFor);
  const { data: existing, error: existingError } = await admin.supabase.from("cases").select("slug").in("slug", candidateSlugs);
  if (existingError) throw existingError;
  const existingSlugs = new Set((existing || []).map((row: any) => row.slug));
  const newRecords = page.records.filter((record) => !existingSlugs.has(slugFor(record)));
  const now = new Date().toISOString();
  const personRows: any[] = [];
  const caseRows: any[] = [];
  const pointRows: any[] = [];

  newRecords.forEach((record) => {
    const personId = randomUUID();
    const caseId = randomUUID();
    const slug = slugFor(record);
    const category = syntheticScaleStatus(source, record.syntheticIndex);
    const sequence = String(record.syntheticIndex + 1).padStart(6, "0");
    const fullName = `MMIPS SYNTHETIC SCALE TEST ${record.source.toUpperCase()} ${sequence} — NOT A REAL PERSON`;
    const isTerritoryFixture = record.regionType === "us_territory_scale_test";
    const publicArea = `${record.geographyName} — ${isTerritoryFixture ? "SYNTHETIC BROAD TERRITORY COVERAGE TEST" : "SYNTHETIC BROAD TEST GEOGRAPHY"}`;
    const publicSummary = "SYSTEM LOAD TEST ONLY — NOT A REAL PERSON. Fictional MMIPS profile used to test national-scale search, pagination, mapping, accessibility, filtering, and performance. The assigned geography is a coverage-test allocation, not a real incident location or prevalence claim.";
    personRows.push(source === "ca"
      ? { id: personId, full_name: fullName, public_notes: `SYNTHETIC LOAD TEST ONLY — NOT A REAL PERSON OR CASE. Official broad geography label: ${record.affiliation}.` }
      : { id: personId, full_name: fullName, tribal_affiliation: isTerritoryFixture ? record.affiliation : `${record.affiliation} — official broad geography name used for synthetic load testing only`, public_notes: "SYNTHETIC LOAD TEST ONLY — NOT A REAL PERSON OR CASE." });
    caseRows.push(source === "ca"
      ? { id: caseId, person_id: personId, slug, status: category.status === "murdered_unsolved" ? "homicide_unsolved" : "missing", urgency_level: "standard", review_status: "pending_review", public_summary: publicSummary, last_seen_locality: record.geographyName, last_seen_province_territory: record.regionCode, last_seen_area_public: publicArea, location_precision: "region", lead_police_service: "MMIPS SYNTHETIC LOAD TEST — NOT REAL", official_tip_contact: "SYNTHETIC TEST ONLY — DO NOT SEND REAL TIPS", synthetic: true, public_profile_enabled: true, public_map_enabled: true }
      : { id: caseId, person_id: personId, slug, status: category.status, profile_type: category.profile_type, urgency_level: "standard", review_status: "pending_review", public_summary: publicSummary, last_seen_area_public: publicArea, last_seen_state: record.regionCode, location_precision: "approximate", lead_agency: "MMIPS SYNTHETIC LOAD TEST — NOT REAL", official_tip_contact: "SYNTHETIC TEST ONLY — DO NOT SEND REAL TIPS", official_info_pending: false, synthetic: true });
    pointRows.push(source === "ca"
      ? { case_id: caseId, public_area_label: publicArea, province_territory: record.regionCode, public_latitude: record.latitude, public_longitude: record.longitude, moderator_approved: false, hidden: false }
      : { case_id: caseId, public_label: publicArea, public_latitude: record.latitude, public_longitude: record.longitude, precision: isTerritoryFixture ? "state" : "tribal_region", region_type: record.regionType, moderator_approved: false });
  });

  if (personRows.length) {
    const { error: personError } = await admin.supabase.from("persons").insert(personRows);
    if (personError) throw personError;
    const personIds = personRows.map((row) => row.id);
    const { error: caseError } = await admin.supabase.from("cases").insert(caseRows);
    if (caseError) { await admin.supabase.from("persons").delete().in("id", personIds); throw caseError; }
    const caseIds = caseRows.map((row) => row.id);
    const { error: pointError } = await admin.supabase.from("public_case_map_points").insert(pointRows);
    if (pointError) { await admin.supabase.from("cases").delete().in("id", caseIds); await admin.supabase.from("persons").delete().in("id", personIds); throw pointError; }
    await admin.supabase.from("audit_log").insert({ actor_id: admin.user.id, action: "synthetic_scale_batch_staged", entity_type: "synthetic_scale_rehearsal", reason: "Admin staged a country-bound synthetic geography batch for load testing.", metadata: { source, offset, inserted: newRecords.length, benchmark_target: SYNTHETIC_SCALE_BENCHMARKS[source].targetProfiles, staged_at: now } });
  }
  return { inserted: newRecords.length, nextOffset: offset + BATCH_SIZE, done: page.done };
}

async function publishBatch(admin: Admin, source: SyntheticScaleSource) {
  const { data: rows, error } = await admin.supabase.from("cases").select("id").like("slug", `${sourcePrefix(source)}%`).eq("review_status", "pending_review").limit(BATCH_SIZE);
  if (error) throw error;
  const ids = (rows || []).map((row: any) => row.id);
  if (!ids.length) return { processed: 0, done: true };
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const pointUpdate = source === "ca"
    ? { moderator_approved: true, hidden: false, updated_at: now }
    : { moderator_approved: true, safety_reviewed_at: now, approved_by: admin.user.id, updated_at: now };
  const { error: pointError } = await admin.supabase.from("public_case_map_points").update(pointUpdate).in("case_id", ids);
  if (pointError) throw pointError;
  const caseUpdate = source === "ca"
    ? { review_status: "approved", published_at: now, last_public_update: today, updated_at: now, synthetic: true, public_profile_enabled: true, public_map_enabled: true }
    : { review_status: "approved", published_at: now, last_public_update: today, updated_at: now, synthetic: true };
  const { error: caseError } = await admin.supabase.from("cases").update(caseUpdate).in("id", ids);
  if (caseError) throw caseError;
  await admin.supabase.from("audit_log").insert({ actor_id: admin.user.id, action: "synthetic_scale_batch_published", entity_type: "synthetic_scale_rehearsal", reason: "Admin published a country-bound synthetic load-test batch after explicit confirmation.", metadata: { source, processed: ids.length } });
  return { processed: ids.length, done: ids.length < BATCH_SIZE };
}

async function removeBatch(admin: Admin, source: SyntheticScaleSource) {
  const { data: rows, error } = await admin.supabase.from("cases").select("id,person_id").like("slug", `${sourcePrefix(source)}%`).limit(BATCH_SIZE);
  if (error) throw error;
  const ids = (rows || []).map((row: any) => row.id);
  const personIds = (rows || []).map((row: any) => row.person_id).filter(Boolean);
  if (!ids.length) return { processed: 0, done: true };
  const { error: caseError } = await admin.supabase.from("cases").delete().in("id", ids);
  if (caseError) throw caseError;
  if (personIds.length) { const { error: personError } = await admin.supabase.from("persons").delete().in("id", personIds); if (personError) throw personError; }
  await admin.supabase.from("audit_log").insert({ actor_id: admin.user.id, action: "synthetic_scale_batch_removed", entity_type: "synthetic_scale_rehearsal", reason: "Admin removed a country-bound synthetic load-test batch.", metadata: { source, processed: ids.length } });
  return { processed: ids.length, done: ids.length < BATCH_SIZE };
}

async function counts(admin: Admin, source: SyntheticScaleSource) {
  const prefix = `${sourcePrefix(source)}%`;
  const [{ count: total }, { count: staged }, { count: published }] = await Promise.all([
    admin.supabase.from("cases").select("id", { count: "exact", head: true }).like("slug", prefix),
    admin.supabase.from("cases").select("id", { count: "exact", head: true }).like("slug", prefix).eq("review_status", "pending_review"),
    admin.supabase.from("cases").select("id", { count: "exact", head: true }).like("slug", prefix).eq("review_status", "approved").not("published_at", "is", null)
  ]);
  return { total: total || 0, staged: staged || 0, published: published || 0 };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await authorizeScaleAdmin(request);
    if (!admin.ok) return admin.response;
    const source = siteSource();
    if (!source) return NextResponse.json({ ok: false, message: "Synthetic scale testing is available only on the U.S. and Canada sites." }, { status: 404 });
    return NextResponse.json({ ok: true, prefix: sourcePrefix(source), source, batchSize: BATCH_SIZE, benchmark: SYNTHETIC_SCALE_BENCHMARKS[source], counts: await counts(admin, source) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return safeApiError({ code: "synthetic_scale_status_failed", message: "Could not load synthetic scale-test status." }); }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await authorizeScaleAdmin(request);
    if (!admin.ok) return admin.response;
    const source = siteSource();
    if (!source) return NextResponse.json({ ok: false, message: "Synthetic scale testing is available only on the U.S. and Canada sites." }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "";
    const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";
    if (action === "stage") {
      if (confirmation !== "STAGE NATIONAL SYNTHETIC TEST") return NextResponse.json({ ok: false, message: "Type STAGE NATIONAL SYNTHETIC TEST to stage fictional load-test records." }, { status: 400 });
      if (body.source && body.source !== source) return NextResponse.json({ ok: false, message: "The selected geography source does not match this country site." }, { status: 400 });
      const offset = safeInteger(body.offset);
      return NextResponse.json({ ok: true, action, source, ...(await stageBatch(admin, source, offset)), counts: await counts(admin, source) });
    }
    if (action === "publish") {
      if (confirmation !== "PUBLISH NATIONAL SYNTHETIC TEST") return NextResponse.json({ ok: false, message: "Type PUBLISH NATIONAL SYNTHETIC TEST to publish fictional load-test records." }, { status: 400 });
      return NextResponse.json({ ok: true, action, source, ...(await publishBatch(admin, source)), counts: await counts(admin, source) });
    }
    if (action === "remove") {
      if (confirmation !== "REMOVE NATIONAL SYNTHETIC TEST") return NextResponse.json({ ok: false, message: "Type REMOVE NATIONAL SYNTHETIC TEST to delete the national fictional load-test records." }, { status: 400 });
      return NextResponse.json({ ok: true, action, source, ...(await removeBatch(admin, source)), counts: await counts(admin, source) });
    }
    return NextResponse.json({ ok: false, message: "Choose a supported synthetic scale-test action." }, { status: 400 });
  } catch { return safeApiError({ code: "synthetic_scale_action_failed", message: "Could not complete the synthetic scale-test action." }); }
}
