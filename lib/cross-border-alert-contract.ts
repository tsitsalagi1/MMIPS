export type CrossBorderCountry = "us" | "ca";
export type CrossBorderAlertPayload = {
  version: 1;
  sourceCountry: CrossBorderCountry;
  intent: "preview" | "send";
  eventKey: string;
  title: string;
  publicUrl: string;
  publicMapLabel: string;
  officialTipContact: string;
  leadAgency?: string | null;
  latitude: number;
  longitude: number;
  issuedAt: string;
};

export function isCrossBorderAlertPayload(value: unknown): value is CrossBorderAlertPayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return p.version === 1 &&
    (p.sourceCountry === "us" || p.sourceCountry === "ca") &&
    (p.intent === "preview" || p.intent === "send") &&
    typeof p.eventKey === "string" && p.eventKey.length > 0 && p.eventKey.length <= 220 &&
    typeof p.title === "string" && p.title.length > 0 && p.title.length <= 160 &&
    typeof p.publicUrl === "string" && p.publicUrl.startsWith("https://") &&
    typeof p.publicMapLabel === "string" && p.publicMapLabel.length <= 200 &&
    typeof p.officialTipContact === "string" && p.officialTipContact.trim().length > 0 &&
    Number.isFinite(Number(p.latitude)) && Number(p.latitude) >= -90 && Number(p.latitude) <= 90 &&
    Number.isFinite(Number(p.longitude)) && Number(p.longitude) >= -180 && Number(p.longitude) <= 180 &&
    typeof p.issuedAt === "string";
}
