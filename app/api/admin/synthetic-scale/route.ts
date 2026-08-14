import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { safeApiError } from "@/lib/security/api-errors";

export const dynamic = "force-dynamic";

const PREFIX = "mmips-test-scale-";
const BATCH_SIZE = 150;
const US_LAYER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer/2/query";
const CANADA_LAYER = "https://services.sac-isc.gc.ca/geomatics/rest/services/AGOL_FEATURE_SERVICES/First_Nations_Aboriginal_Lands_E/FeatureServer/2/query";

type SourceName = "us" | "ca";
type SourceRecord = { source: SourceName; sourceId: string; geographyName: string; affiliation: string; regionCode: string | null; latitude: number; longitude: number };

function authorizeScaleAdmin(request: NextRequest) { return requireAdmin(request); }
type Admin = Awaited<ReturnType<typeof authorizeScaleAdmin>> & { ok: true };

function safeInteger(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function validCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

async function fetchJson(url: URL) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`SOURCE_HTTP_${response.status}`);
  const body = await response.json();
  if (body?.error) throw new Error("SOURCE_ARCGIS_ERROR");
  return body;
}

async function fetchSourcePage(source: SourceName, offset: number): Promise<{ records: SourceRecord[]; done: boolean }> {
  if (source === "us") {
    const url = new URL(US_LAYER);
    url.searchParams.set("where", "1=1");
    url.searchParams.set("outFields", "OBJECTID,GEOID,BASENAME,NAME,CENTLAT,CENTLON");
    url.searchParams.set("returnGeometry", "false");
    url.searchParams.set("orderByFields", "OBJECTID ASC");
    url.searchParams.set("resultOffset", String(offset));
    url.searchParams.set("resultRecordCount", String(BATCH_SIZE));
    url.searchParams.set("f", "json");
    const body = await fetchJson(url);
    const features = Array.isArray(body?.features) ? body.features : [];
    const records = features.flatMap((feature: any) => {
      const attributes = feature?.attributes || {};
      const latitude = Number(attributes.CENTLAT);
      const longitude = Number(attributes.CENTLON);
      const sourceId = String(attributes.GEOID || attributes.OBJECTID || "").trim();
      const geographyName = String(attributes.NAME || attributes.BASENAME || "Federal Indian reservation").trim();
      if (!sourceId || !validCoordinate(latitude, longitude)) return [];
      return [{ source, sourceId, geographyName, affiliation: geographyName, regionCode: null, latitude, longitude } satisfies SourceRecord];
    });
    return { records, done: features.length < BATCH_SIZE || body?.exceededTransferLimit !== true };
  }

  const url = new URL(CANADA_LAYER);
  url.searchParams.set("where", "ADMIN_LAND_TYPE='INDIAN RESERVE'");
  url.searchParams.set("outFields", "OBJECTID,ADMIN_LAND_ID,SHORT_NAME,ENAME,CPC_CODE,FIRST_NATIONS");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("orderByFields", "OBJECTID ASC");
  url.searchParams.set("resultOffset", String(offset));
  url.searchParams.set("resultRecordCount", String(BATCH_SIZE));
  url.searchParams.set("f", "json");
  const body = await fetchJson(url);
  const features = Array.isArray(body?.features) ? body.features : [];
  const records = features.flatMap((feature: any) => {
    const attributes = feature?.attributes || {};
    const latitude = Number(feature?.geometry?.y);
    const longitude = Number(feature?.geometry?.x);
    const sourceId = String(attributes.ADMIN_LAND_ID || attributes.OBJECTID || "").trim();
    const geographyName = String(attributes.ENAME || attributes.SHORT_NAME || "First Nation reserve").trim();
    const affiliation = String(attributes.FIRST_NATIONS || geographyName).trim();
    const regionCode = typeof attributes.CPC_CODE === "string" ? attributes.CPC_CODE.trim() || null : null;
    if (!sourceId || !validCoordinate(latitude, longitude)) return [];
    return [{ source, sourceId, geographyName, affiliation, regionCode, latitude, longitude } satisfies SourceRecord];
  });
  return { records, done: features.length < BATCH_SIZE || body?.exceededTransferLimit !== true };
}

function syntheticStatus(index: number) {
  switch (index % 4) {
    case 1: return { status: "murdered_unsolved", profile_type: "murdered_info_needed" };
    case 2: return { status: "unidentified", profile_type: "unidentified" };
    case 3: return { status: "resolved", profile_type: "located" };
    default: return { status: "missing", profile_type: "missing" };
  }
}

function slugFor(record: SourceRecord) {
  return `${PREFIX}${record.source}-${record.sourceId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`.slice(0, 180);
}

async function stageBatch(admin: Admin, source: SourceName, offset: number) {
  const page = await fetchSourcePage(source, offset);
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

  newRecords.forEach((record, index) => {
    const personId = randomUUID();
    const caseId = randomUUID();
    const slug = slugFor(record);
    const category = syntheticStatus(offset + index);
    personRows.push({ id: personId, full_name: `MMIPS SYNTHETIC SCALE TEST ${record.source.toUpperCase()} ${record.sourceId} — NOT A REAL PERSON`, tribal_affiliation: `${record.affiliation} — official geography name used for synthetic load testing only`, public_notes: "SYNTHETIC LOAD TEST ONLY — NOT A REAL PERSON OR CASE." });
    caseRows.push({ id: caseId, person_id: personId, slug, status: category.status, profile_type: category.profile_type, urgency_level: "standard", review_status: "pending_review", public_summary: "SYSTEM LOAD TEST ONLY — NOT A REAL PERSON. Fictional MMIPS profile used to test national-scale search, pagination, mapping, accessibility, filtering, and performance.", last_seen_area_public: `${record.geographyName} — SYNTHETIC TEST GEOGRAPHY`, last_seen_state: record.regionCode, location_precision: "approximate", lead_agency: "MMIPS SYNTHETIC LOAD TEST — NOT REAL", official_tip_contact: "SYNTHETIC TEST ONLY — DO NOT SEND REAL TIPS", official_info_pending: false, synthetic: true });
    pointRows.push({ case_id: caseId, public_label: `${record.geographyName} — SYNTHETIC TEST GEOGRAPHY`, public_latitude: record.latitude, public_longitude: record.longitude, precision: "tribal_region", region_type: record.source === "us" ? "federal_reservation_scale_test" : "canadian_reserve_scale_test", moderator_approved: false });
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
    await admin.supabase.from("audit_log").insert({ actor_id: admin.user.id, action: "synthetic_scale_batch_staged", entity_type: "synthetic_scale_rehearsal", reason: "Admin staged a national synthetic geography batch for load testing.", metadata: { source, offset, inserted: newRecords.length, staged_at: now } });
  }
  return { inserted: newRecords.length, nextOffset: offset + BATCH_SIZE, done: page.done };
}

async function publishBatch(admin: Admin) {
  const { data: rows, error } = await admin.supabase.from("cases").select("id").like("slug", `${PREFIX}%`).eq("review_status", "pending_review").limit(BATCH_SIZE);
  if (error) throw error;
  const ids = (rows || []).map((row: any) => row.id);
  if (!ids.length) return { processed: 0, done: true };
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const { error: pointError } = await admin.supabase.from("public_case_map_points").update({ moderator_approved: true, safety_reviewed_at: now, approved_by: admin.user.id, updated_at: now }).in("case_id", ids);
  if (pointError) throw pointError;
  const { error: caseError } = await admin.supabase.from("cases").update({ review_status: "approved", published_at: now, last_public_update: today, updated_at: now }).in("id", ids);
  if (caseError) throw caseError;
  await admin.supabase.from("audit_log").insert({ actor_id: admin.user.id, action: "synthetic_scale_batch_published", entity_type: "synthetic_scale_rehearsal", reason: "Admin published a synthetic load-test batch after explicit confirmation.", metadata: { processed: ids.length } });
  return { processed: ids.length, done: ids.length < BATCH_SIZE };
}

async function removeBatch(admin: Admin) {
  const { data: rows, error } = await admin.supabase.from("cases").select("id,person_id").like("slug", `${PREFIX}%`).limit(BATCH_SIZE);
  if (error) throw error;
  const ids = (rows || []).map((row: any) => row.id);
  const personIds = (rows || []).map((row: any) => row.person_id).filter(Boolean);
  if (!ids.length) return { processed: 0, done: true };
  const { error: caseError } = await admin.supabase.from("cases").delete().in("id", ids);
  if (caseError) throw caseError;
  if (personIds.length) { const { error: personError } = await admin.supabase.from("persons").delete().in("id", personIds); if (personError) throw personError; }
  await admin.supabase.from("audit_log").insert({ actor_id: admin.user.id, action: "synthetic_scale_batch_removed", entity_type: "synthetic_scale_rehearsal", reason: "Admin removed a national synthetic load-test batch.", metadata: { processed: ids.length } });
  return { processed: ids.length, done: ids.length < BATCH_SIZE };
}

async function counts(admin: Admin) {
  const [{ count: total }, { count: staged }, { count: published }] = await Promise.all([
    admin.supabase.from("cases").select("id", { count: "exact", head: true }).like("slug", `${PREFIX}%`),
    admin.supabase.from("cases").select("id", { count: "exact", head: true }).like("slug", `${PREFIX}%`).eq("review_status", "pending_review"),
    admin.supabase.from("cases").select("id", { count: "exact", head: true }).like("slug", `${PREFIX}%`).eq("review_status", "approved").not("published_at", "is", null)
  ]);
  return { total: total || 0, staged: staged || 0, published: published || 0 };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await authorizeScaleAdmin(request);
    if (!admin.ok) return admin.response;
    return NextResponse.json({ ok: true, prefix: PREFIX, batchSize: BATCH_SIZE, counts: await counts(admin) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return safeApiError({ code: "synthetic_scale_status_failed", message: "Could not load synthetic scale-test status." }); }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await authorizeScaleAdmin(request);
    if (!admin.ok) return admin.response;
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "";
    const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";
    if (action === "stage") {
      if (confirmation !== "STAGE NATIONAL SYNTHETIC TEST") return NextResponse.json({ ok: false, message: "Type STAGE NATIONAL SYNTHETIC TEST to stage fictional load-test records." }, { status: 400 });
      const source: SourceName | null = body.source === "us" ? "us" : body.source === "ca" ? "ca" : null;
      if (!source) return NextResponse.json({ ok: false, message: "Choose the U.S. or Canada source." }, { status: 400 });
      const offset = safeInteger(body.offset);
      return NextResponse.json({ ok: true, action, source, ...(await stageBatch(admin, source, offset)), counts: await counts(admin) });
    }
    if (action === "publish") {
      if (confirmation !== "PUBLISH NATIONAL SYNTHETIC TEST") return NextResponse.json({ ok: false, message: "Type PUBLISH NATIONAL SYNTHETIC TEST to publish fictional load-test records." }, { status: 400 });
      return NextResponse.json({ ok: true, action, ...(await publishBatch(admin)), counts: await counts(admin) });
    }
    if (action === "remove") {
      if (confirmation !== "REMOVE NATIONAL SYNTHETIC TEST") return NextResponse.json({ ok: false, message: "Type REMOVE NATIONAL SYNTHETIC TEST to delete the national fictional load-test records." }, { status: 400 });
      return NextResponse.json({ ok: true, action, ...(await removeBatch(admin)), counts: await counts(admin) });
    }
    return NextResponse.json({ ok: false, message: "Choose a supported synthetic scale-test action." }, { status: 400 });
  } catch { return safeApiError({ code: "synthetic_scale_action_failed", message: "Could not complete the synthetic scale-test action." }); }
}
