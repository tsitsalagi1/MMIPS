import crypto from "node:crypto";

export const ALERT_CONFIRMATION_TTL_HOURS = 48;
export const ALERT_RESEND_COOLDOWN_MS = 10 * 60 * 1000;
export const ALERT_RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;
export const ALERT_RESEND_WINDOW_LIMIT = 3;
export const ALERT_TOKEN_BYTES = 32;
export const MAX_ALERT_REQUEST_BYTES = 4096;
const TOKEN_HASH_PREFIX = "sha256:";

export type AlertPreference = "all_public_alerts" | "urgent_community_alerts";
export type SubscriberStatus = "pending" | "active" | "unsubscribed" | "suppressed";
export type DeliveryStatus = "queued" | "sent" | "failed_retryable" | "failed_final";
export type AlertEventKind = "new_public_profile" | "material_public_status_update" | "urgent_community_alert";

export type AlertPreferences = {
  categories: AlertPreference[];
  homeZip?: string;
  radiusMiles?: 10 | 25 | 50 | 100 | 250;
  allUrgent?: boolean;
  homeLatitude?: number;
  homeLongitude?: number;
  geographySource?: string;
};

export type AlertSubscriberRecord = {
  id: string; email_normalized: string; status: SubscriberStatus;
  synthetic: boolean;
  confirmation_token_hash: string | null; confirmation_expires_at: string | null;
  unsubscribe_token_id: string; unsubscribe_token_version: number;
  preferences: AlertPreferences;
  home_zip?: string | null; home_latitude?: number | null; home_longitude?: number | null;
  radius_miles?: number | null; all_urgent?: boolean | null; geography_source?: string | null;
  confirmation_last_sent_at: string | null; confirmation_window_started_at: string | null;
  confirmation_send_count: number;
};

export type AlertStore = {
  findSubscriberByEmail(email: string): Promise<AlertSubscriberRecord | null>;
  savePending(input: { email: string; consentSource: string; consentText: string; confirmationTokenHash: string; confirmationExpiresAt: string; unsubscribeTokenId?: string; preferences: AlertPreferences; requestedAt: string; windowStartedAt: string; sendCount: number }): Promise<AlertSubscriberRecord>;
  markConfirmationSent(id: string, sentAt: string): Promise<void>;
  activateByConfirmationHash(hash: string, now: Date): Promise<Pick<AlertSubscriberRecord, "id" | "email_normalized"> | null>;
  unsubscribeByTokenId(id: string, now: Date): Promise<boolean>;
  activeSubscribers(): Promise<AlertSubscriberRecord[]>;
  claimDelivery(input: { subscriberId: string; alertEventKey: string }): Promise<{ id: string; delivery_status: DeliveryStatus } | null>;
  updateDelivery(id: string, status: DeliveryStatus, details?: { providerMessageId?: string; failureCode?: string }): Promise<void>;
};

export function normalizeEmail(input: unknown) {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || /\s/.test(email) || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) return null;
  return email;
}

export function normalizePreferences(input: unknown): AlertPreferences {
  if (input && typeof input === "object") {
    const raw = input as Record<string, unknown>;
    const zip = typeof raw.homeZip === "string" && /^[0-9]{5}$/.test(raw.homeZip) ? raw.homeZip : undefined;
    const radius = Number(raw.radiusMiles);
    const radiusMiles = [10, 25, 50, 100, 250].includes(radius) ? radius as 10 | 25 | 50 | 100 | 250 : undefined;
    const latitude = Number(raw.homeLatitude);
    const longitude = Number(raw.homeLongitude);
    if (zip && radiusMiles && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return {
        categories: ["urgent_community_alerts"],
        homeZip: zip,
        radiusMiles,
        allUrgent: raw.allUrgent === true,
        homeLatitude: latitude,
        homeLongitude: longitude,
        geographySource: typeof raw.geographySource === "string" ? raw.geographySource.slice(0, 160) : undefined
      };
    }
  }
  // Invalid or incomplete geography must never broaden an urgent-alert subscription.
  return { categories: ["urgent_community_alerts"] };
}

export function createOpaqueToken() { return crypto.randomBytes(ALERT_TOKEN_BYTES).toString("base64url"); }
export function hashAlertToken(token: string) { return `${TOKEN_HASH_PREFIX}${crypto.createHash("sha256").update(token, "utf8").digest("hex")}`; }
export function createConfirmationToken(now = new Date()) { const token = createOpaqueToken(); return { token, hash: hashAlertToken(token), expiresAt: new Date(now.getTime() + ALERT_CONFIRMATION_TTL_HOURS * 3600000).toISOString() }; }
export function createUnsubscribeTokenId() { return createOpaqueToken(); }

function signature(id: string, key: string) { return crypto.createHmac("sha256", key).update(`v1.${id}`, "utf8").digest(); }
export function signUnsubscribeToken(id: string, key: string) {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(id) || key.length < 32) throw new Error("alerts_signing_configuration_invalid");
  return `v1.${id}.${signature(id, key).toString("base64url")}`;
}
export function verifyUnsubscribeToken(token: unknown, keys: readonly string[]) {
  if (typeof token !== "string" || token.length > 256) return null;
  const match = /^v1\.([A-Za-z0-9_-]{40,64})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return null;
  const supplied = Buffer.from(match[2], "base64url");
  for (const key of keys.filter((item) => item.length >= 32)) {
    const expected = signature(match[1], key);
    if (supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected)) return match[1];
  }
  return null;
}
export function canSendConfirmation(row: AlertSubscriberRecord | null, now: Date) {
  if (!row) return { send: true, windowStartedAt: now.toISOString(), sendCount: 1 };
  if (row.status === "active" || row.status === "suppressed") return { send: false };
  const last = row.confirmation_last_sent_at ? Date.parse(row.confirmation_last_sent_at) : 0;
  if (last && now.getTime() - last < ALERT_RESEND_COOLDOWN_MS) return { send: false };
  const windowStart = row.confirmation_window_started_at ? Date.parse(row.confirmation_window_started_at) : 0;
  if (!windowStart || now.getTime() - windowStart >= ALERT_RESEND_WINDOW_MS) return { send: true, windowStartedAt: now.toISOString(), sendCount: 1 };
  if (row.confirmation_send_count >= ALERT_RESEND_WINDOW_LIMIT) return { send: false };
  return { send: true, windowStartedAt: row.confirmation_window_started_at!, sendCount: row.confirmation_send_count + 1 };
}
