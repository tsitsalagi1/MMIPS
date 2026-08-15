import fsaData from "../data/canada-fsa-centroids.json" with { type: "json" };
import { normalizeCanadianPostalCode, type CanadaProvinceTerritoryCode } from "./canada-config";

export const CANADA_ALERT_RADIUS_KM_OPTIONS = [25, 50, 100, 250, 500] as const;
export type CanadaAlertRadiusKilometres = typeof CANADA_ALERT_RADIUS_KM_OPTIONS[number];

export type CanadaFsaPoint = {
  postalCode: string;
  fsa: string;
  provinceTerritory: CanadaProvinceTerritoryCode;
  latitude: number;
  longitude: number;
  source: "Statistics Canada 2021 Census Forward Sortation Area representative point";
};

type FsaRow = [
  fsa: string,
  latitude: number,
  longitude: number,
  provinceTerritory: CanadaProvinceTerritoryCode
];

const areas = new Map(
  (fsaData.areas as FsaRow[]).map(([fsa, latitude, longitude, provinceTerritory]) => [
    fsa,
    { fsa, latitude, longitude, provinceTerritory }
  ])
);

export function normalizeCanadaAlertRadiusKm(input: unknown): CanadaAlertRadiusKilometres | null {
  const value = Number(input);
  return (CANADA_ALERT_RADIUS_KM_OPTIONS as readonly number[]).includes(value)
    ? value as CanadaAlertRadiusKilometres
    : null;
}

export function kilometresToMiles(kilometres: CanadaAlertRadiusKilometres) {
  // The shared alert schema stores radius_miles as an integer. Keep the
  // visitor-facing choice in kilometres and use only this rounded value for
  // the existing distance matcher.
  return Math.round(kilometres / 1.609344);
}

export function lookupCanadianPostalArea(input: unknown): CanadaFsaPoint | null {
  if (typeof input !== "string") return null;
  const postalCode = normalizeCanadianPostalCode(input);
  if (!postalCode) return null;
  const fsa = postalCode.slice(0, 3);
  const point = areas.get(fsa);
  if (!point) return null;

  return {
    postalCode,
    fsa,
    provinceTerritory: point.provinceTerritory,
    latitude: point.latitude,
    longitude: point.longitude,
    source: "Statistics Canada 2021 Census Forward Sortation Area representative point"
  };
}

export function canadaFsaCount() {
  return areas.size;
}
