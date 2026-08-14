import { createHmac, timingSafeEqual } from "node:crypto";
import type { CrossBorderAlertPayload } from "@/lib/cross-border-alert-contract";

export function crossBorderAlertSecret() {
  return process.env.MMIPS_CROSS_BORDER_ALERT_SECRET || "";
}

export function signCrossBorderAlert(payload: CrossBorderAlertPayload, secret = crossBorderAlertSecret()) {
  if (!secret) throw new Error("cross_border_alert_secret_unavailable");
  return createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

export function verifyCrossBorderAlert(payload: CrossBorderAlertPayload, signature: string, now = Date.now()) {
  const secret = crossBorderAlertSecret();
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const issued = Date.parse(payload.issuedAt);
  if (!Number.isFinite(issued) || Math.abs(now - issued) > 5 * 60 * 1000) return false;
  const expected = signCrossBorderAlert(payload, secret);
  const providedBytes = Buffer.from(signature, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}
