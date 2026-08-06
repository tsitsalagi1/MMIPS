import crypto from "node:crypto";

export const ALERT_CONFIRMATION_TTL_HOURS = 48;
export const ALERT_TOKEN_BYTES = 32;
export const MAX_ALERT_REQUEST_BYTES = 4096;
const TOKEN_HASH_PREFIX = "sha256:";

export type AlertPreference = "all_public_alerts";
export type SubscriberStatus = "pending" | "active" | "unsubscribed" | "suppressed";
export type AlertEventKind = "new_public_profile" | "material_public_status_update";

export type AlertSubscriberRecord = {
  id: string;
  email_normalized: string;
  status: SubscriberStatus;
  confirmation_token_hash: string | null;
  confirmation_expires_at: string | null;
  unsubscribe_token_hash: string | null;
  preferences: { categories: AlertPreference[] };
};

export type AlertStore = {
  findSubscriberByEmail(email: string): Promise<AlertSubscriberRecord | null>;
  upsertPendingSubscription(input: {
    email: string;
    confirmationTokenHash: string;
    confirmationExpiresAt: string;
    unsubscribeTokenHash: string;
    preferences: { categories: AlertPreference[] };
  }): Promise<AlertSubscriberRecord>;
  activateByConfirmationHash(hash: string, now: Date): Promise<AlertSubscriberRecord | null>;
  unsubscribeByHash(hash: string, now: Date): Promise<boolean>;
  activeSubscribers(): Promise<AlertSubscriberRecord[]>;
  hasDelivery(subscriberId: string, alertEventKey: string): Promise<boolean>;
  recordDelivery(input: { subscriberId: string; alertEventKey: string; status: string; providerMessageId?: string | null; failureCode?: string | null }): Promise<void>;
};

export function normalizeEmail(input: unknown) {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (/\s/.test(email)) return null;
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return null;
  return email;
}

export function normalizePreferences(input: unknown): { categories: AlertPreference[] } {
  if (input && typeof input === "object" && "categories" in input && Array.isArray((input as { categories?: unknown }).categories)) {
    const safe = (input as { categories: unknown[] }).categories.filter((item): item is AlertPreference => item === "all_public_alerts");
    return { categories: safe.length ? ["all_public_alerts"] : ["all_public_alerts"] };
  }
  return { categories: ["all_public_alerts"] };
}

export function createOpaqueToken() {
  return crypto.randomBytes(ALERT_TOKEN_BYTES).toString("base64url");
}

export function hashAlertToken(token: string) {
  return `${TOKEN_HASH_PREFIX}${crypto.createHash("sha256").update(token, "utf8").digest("hex")}`;
}

export function createAlertTokens(now = new Date()) {
  const confirmationToken = createOpaqueToken();
  const unsubscribeToken = createOpaqueToken();
  return {
    confirmationToken,
    confirmationTokenHash: hashAlertToken(confirmationToken),
    confirmationExpiresAt: new Date(now.getTime() + ALERT_CONFIRMATION_TTL_HOURS * 60 * 60 * 1000).toISOString(),
    unsubscribeToken,
    unsubscribeTokenHash: hashAlertToken(unsubscribeToken)
  };
}

