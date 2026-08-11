import { isPublicMapPrecision, type PublicMapPoint, type PublicMapResult } from "./public-map";
import type { CaseStatus, ProfileType } from "./types";

const US_PUBLIC_MAP_URL = "https://us.mmips.com/api/profiles/map";
const US_PROFILE_BASE_URL = "https://us.mmips.com/profiles/";
const MAX_REMOTE_PUBLIC_POINTS = 10000;
const REMOTE_TIMEOUT_MS = 8000;

const CASE_STATUSES = new Set<CaseStatus>(["missing", "murdered_unsolved", "unidentified", "resolved", "unknown"]);
const PROFILE_TYPES = new Set<ProfileType>(["urgent_missing", "missing", "murdered_info_needed", "unidentified", "located", "removed", "unknown"]);

export interface CanadaFederatedMapResult extends PublicMapResult {
  canadaCount: number;
  unitedStatesCount: number;
}

function isCaseStatus(value: unknown): value is CaseStatus {
  return typeof value === "string" && CASE_STATUSES.has(value as CaseStatus);
}

function isProfileType(value: unknown): value is ProfileType {
  return typeof value === "string" && PROFILE_TYPES.has(value as ProfileType);
}

function safeSlug(value: unknown) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,159}$/i.test(value) ? value : null;
}

function sanitizeUnitedStatesPublicPoint(value: unknown): PublicMapPoint | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const slug = safeSlug(row.slug);
  const originalCaseId = typeof row.caseId === "string" && row.caseId.length <= 160 ? row.caseId : null;
  const latitude = Number(row.publicLatitude);
  const longitude = Number(row.publicLongitude);

  if (!slug || !originalCaseId) return null;
  if (typeof row.publicName !== "string" || !row.publicName.trim() || row.publicName.length > 240) return null;
  if (typeof row.publicMapLabel !== "string" || !row.publicMapLabel.trim() || row.publicMapLabel.length > 500) return null;
  if (!isProfileType(row.profileType) || !isCaseStatus(row.publicStatus) || !isPublicMapPrecision(row.precision)) return null;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;

  return {
    caseId: `us:${originalCaseId}`,
    slug,
    publicName: row.publicName.trim(),
    profileType: row.profileType,
    publicStatus: row.publicStatus,
    publicMapLabel: row.publicMapLabel.trim(),
    publicLatitude: latitude,
    publicLongitude: longitude,
    precision: row.precision,
    regionType: typeof row.regionType === "string" ? row.regionType.slice(0, 120) : "approved public area",
    lastPublicUpdate: typeof row.lastPublicUpdate === "string" ? row.lastPublicUpdate : null,
    sourceCountry: "us",
    profileUrl: `${US_PROFILE_BASE_URL}${encodeURIComponent(slug)}`
  };
}

function tagCanadaPoint(point: PublicMapPoint): PublicMapPoint {
  return {
    ...point,
    sourceCountry: "ca",
    profileUrl: `/profiles/${encodeURIComponent(point.slug)}`
  };
}

async function loadUnitedStatesPublicPoints(): Promise<PublicMapPoint[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
  try {
    const response = await fetch(US_PUBLIC_MAP_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: controller.signal
    });
    if (!response.ok) return [];
    const body = await response.json().catch(() => null) as { points?: unknown[] } | null;
    if (!body || !Array.isArray(body.points)) return [];
    return body.points
      .slice(0, MAX_REMOTE_PUBLIC_POINTS)
      .map(sanitizeUnitedStatesPublicPoint)
      .filter((point): point is PublicMapPoint => Boolean(point));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function getCanadaFederatedPublicMapPoints(localResult: PublicMapResult): Promise<CanadaFederatedMapResult> {
  const canadaPoints = localResult.points.map(tagCanadaPoint);
  const unitedStatesPoints = await loadUnitedStatesPublicPoints();
  const points = [...canadaPoints, ...unitedStatesPoints];

  return {
    points,
    canadaCount: canadaPoints.length,
    unitedStatesCount: unitedStatesPoints.length,
    availability: localResult.availability === "error" && unitedStatesPoints.length === 0 ? "error" : "available"
  };
}
