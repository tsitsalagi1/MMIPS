import { createClient } from "@supabase/supabase-js";
import { buildPublicAlertEmail, createSupabaseAlertStore, sendClaimedAlert, unsubscribeSigningKeys } from "@/lib/alerts";
import { siteUrl, sendTransactionalEmail } from "@/lib/email";
import { distanceMiles } from "@/lib/zip-geo";
import type { AlertSubscriberRecord } from "@/lib/alerts-core";

export type UrgentAlertTarget = {
  caseId: string;
  slug: string;
  title: string;
  publicMapLabel: string;
  latitude: number;
  longitude: number;
};

export function subscriberMatchesUrgentTarget(subscriber: AlertSubscriberRecord, target: Pick<UrgentAlertTarget, "latitude" | "longitude">) {
  if (subscriber.status !== "active") return false;
  if (!subscriber.preferences?.categories?.includes("urgent_community_alerts")) return false;
  if (subscriber.all_urgent === true || subscriber.preferences.allUrgent === true) return true;
  const latitude = Number(subscriber.home_latitude ?? subscriber.preferences.homeLatitude);
  const longitude = Number(subscriber.home_longitude ?? subscriber.preferences.homeLongitude);
  const radius = Number(subscriber.radius_miles ?? subscriber.preferences.radiusMiles);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || ![10, 25, 50, 100, 250].includes(radius)) return false;
  return distanceMiles({ latitude, longitude }, { latitude: target.latitude, longitude: target.longitude }) <= radius;
}

export async function matchedUrgentSubscribers(target: Pick<UrgentAlertTarget, "latitude" | "longitude">) {
  const store = createSupabaseAlertStore();
  if (!store) throw new Error("alerts_store_unavailable");
  const subscribers = await store.activeSubscribers();
  return subscribers.filter((subscriber) => subscriberMatchesUrgentTarget(subscriber, target));
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export async function sendUrgentCommunityAlert(target: UrgentAlertTarget, actorId: string) {
  const store = createSupabaseAlertStore();
  const client = serviceClient();
  const signingKey = unsubscribeSigningKeys()[0];
  if (!store || !client || !signingKey) throw new Error("urgent_alert_configuration_unavailable");

  const subscribers = (await store.activeSubscribers()).filter((subscriber) => subscriberMatchesUrgentTarget(subscriber, target));
  const eventKey = `urgent:${target.caseId}:${new Date().toISOString().slice(0, 13)}`;
  const publicUrl = `${siteUrl().replace(/\/$/, "")}/cases/${encodeURIComponent(target.slug)}`;

  const { data: existing } = await client.from("urgent_alert_events").select("id,status,matched_count,sent_count").eq("event_key", eventKey).maybeSingle();
  if (existing?.status === "sent") return { matched: existing.matched_count ?? 0, sent: existing.sent_count ?? 0, failed: 0, duplicate: true };

  const { data: eventRow, error: eventError } = await client.from("urgent_alert_events").upsert({
    case_id: target.caseId,
    event_key: eventKey,
    title: target.title.slice(0, 160),
    public_url: publicUrl,
    public_map_label: target.publicMapLabel.slice(0, 200),
    public_latitude: target.latitude,
    public_longitude: target.longitude,
    approved_by: actorId,
    matched_count: subscribers.length,
    status: "sending",
    updated_at: new Date().toISOString()
  }, { onConflict: "event_key" }).select("id").single();
  if (eventError || !eventRow) throw new Error("urgent_alert_event_write_failed");

  let sent = 0;
  let failed = 0;
  for (const subscriber of subscribers) {
    const delivery = await store.claimDelivery({ subscriberId: subscriber.id, alertEventKey: eventKey });
    if (!delivery) continue;
    const message = buildPublicAlertEmail({
      title: `URGENT COMMUNITY ALERT — ${target.title}`,
      publicUrl,
      unsubscribeTokenId: subscriber.unsubscribe_token_id,
      signingKey,
      deliveryKey: delivery.id,
      siteUrl: siteUrl()
    });
    const result = await sendClaimedAlert(store, delivery, { ...message, subject: "Urgent MMIPS community alert" }, { send: sendTransactionalEmail });
    if (result.ok) sent++; else failed++;
  }

  const status = failed === 0 ? "sent" : sent > 0 ? "partial" : "failed";
  await client.from("urgent_alert_events").update({ sent_count: sent, status, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", eventRow.id);
  return { matched: subscribers.length, sent, failed, duplicate: false };
}
