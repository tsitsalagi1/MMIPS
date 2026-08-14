import { signCrossBorderAlert } from "@/lib/cross-border-alert-auth";
import type { CrossBorderAlertPayload } from "@/lib/cross-border-alert-contract";
import { canadaSiteUrl, mmipsSiteMode, usSiteUrl } from "@/lib/site-mode";
import { siteUrl } from "@/lib/email";

export function prepareCrossBorderAlertRequest(target: {
  caseId: string;
  slug: string;
  title: string;
  publicMapLabel: string;
  officialTipContact: string;
  leadAgency?: string | null;
  latitude: number;
  longitude: number;
  synthetic: boolean;
}, eventKey: string, intent: "preview" | "send") {
  const mode = mmipsSiteMode();
  if (mode !== "us" && mode !== "ca") throw new Error("cross_border_alert_country_required");
  const payload: CrossBorderAlertPayload = {
    version: 1,
    sourceCountry: mode,
    intent,
    eventKey,
    title: target.title.slice(0, 160),
    publicUrl: `${siteUrl().replace(/\/$/, "")}/profiles/${encodeURIComponent(target.slug)}`,
    publicMapLabel: target.publicMapLabel.slice(0, 200),
    officialTipContact: target.officialTipContact,
    leadAgency: target.leadAgency ?? null,
    latitude: target.latitude,
    longitude: target.longitude,
    synthetic: target.synthetic,
    issuedAt: new Date().toISOString()
  };
  const baseUrl = mode === "us" ? canadaSiteUrl() : usSiteUrl();
  return {
    url: `${baseUrl.replace(/\/$/, "")}/api/federation/alerts/relay`,
    payload,
    signature: signCrossBorderAlert(payload)
  };
}
