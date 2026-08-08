import { createClient } from "@supabase/supabase-js";
import {
  buildPublicAlertEmail,
  createSupabaseAlertStore,
  sendClaimedAlert,
  unsubscribeSigningKeys
} from "@/lib/alerts";
import { siteUrl, sendTransactionalEmail } from "@/lib/email";
import { summarizeUrgentDeliveryState } from "@/lib/urgent-alert-state";
import { distanceMiles } from "@/lib/zip-geo";
import type { AlertSubscriberRecord, DeliveryStatus } from "@/lib/alerts-core";

export type UrgentAlertTarget = {
  caseId: string;
  slug: string;
  title: string;
  publicMapLabel: string;
  officialTipContact: string;
  leadAgency?: string | null;
  latitude: number;
  longitude: number;
};

type PersistedDelivery = {
  id: string;
  subscriber_id: string;
  delivery_status: DeliveryStatus;
};

function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return value === "queued" || value === "sent" || value === "failed_retryable" || value === "failed_final";
}

export function subscriberMatchesUrgentTarget(
  subscriber: AlertSubscriberRecord,
  target: Pick<UrgentAlertTarget, "latitude" | "longitude">
) {
  if (subscriber.status !== "active") return false;
  if (!subscriber.preferences?.categories?.includes("urgent_community_alerts")) return false;
  if (subscriber.all_urgent === true || subscriber.preferences.allUrgent === true) return true;
  const latitude = Number(subscriber.home_latitude ?? subscriber.preferences.homeLatitude);
  const longitude = Number(subscriber.home_longitude ?? subscriber.preferences.homeLongitude);
  const radius = Number(subscriber.radius_miles ?? subscriber.preferences.radiusMiles);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || ![10, 25, 50, 100, 250].includes(radius)) {
    return false;
  }
  return distanceMiles(
    { latitude, longitude },
    { latitude: target.latitude, longitude: target.longitude }
  ) <= radius;
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
  return url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
}

export async function sendUrgentCommunityAlert(target: UrgentAlertTarget, actorId: string) {
  const store = createSupabaseAlertStore();
  const client = serviceClient();
  const signingKey = unsubscribeSigningKeys()[0];
  if (!store || !client || !signingKey) throw new Error("urgent_alert_configuration_unavailable");
  if (!target.officialTipContact.trim()) throw new Error("urgent_alert_tip_contact_required");

  const subscribers = (await store.activeSubscribers()).filter((subscriber) =>
    subscriberMatchesUrgentTarget(subscriber, target)
  );
  const subscriberById = new Map(subscribers.map((subscriber) => [subscriber.id, subscriber]));
  const eventKey = `urgent:${target.caseId}:${new Date().toISOString().slice(0, 13)}`;
  const publicUrl = `${siteUrl().replace(/\/$/, "")}/profiles/${encodeURIComponent(target.slug)}`;

  const { data: existing, error: existingError } = await client
    .from("urgent_alert_events")
    .select("id,status,matched_count,sent_count,title,public_url")
    .eq("event_key", eventKey)
    .maybeSingle();
  if (existingError) throw new Error("urgent_alert_event_lookup_failed");
  if (existing?.status === "sent") {
    return {
      matched: existing.matched_count ?? 0,
      sent: existing.sent_count ?? 0,
      failed: 0,
      duplicate: true
    };
  }

  let eventId: string;
  let matchedCount: number;
  let alertTitle: string;
  let alertPublicUrl: string;

  if (existing) {
    eventId = existing.id;
    matchedCount = Number.isInteger(existing.matched_count) && existing.matched_count >= 0
      ? existing.matched_count
      : 0;
    alertTitle = typeof existing.title === "string" && existing.title
      ? existing.title
      : target.title.slice(0, 160);
    alertPublicUrl = typeof existing.public_url === "string" && existing.public_url
      ? existing.public_url
      : publicUrl;
    const { error } = await client
      .from("urgent_alert_events")
      .update({ status: "sending", approved_by: actorId, updated_at: new Date().toISOString() })
      .eq("id", eventId);
    if (error) throw new Error("urgent_alert_event_retry_write_failed");
  } else {
    matchedCount = subscribers.length;
    alertTitle = target.title.slice(0, 160);
    alertPublicUrl = publicUrl;
    const { data: eventRow, error: eventError } = await client
      .from("urgent_alert_events")
      .insert({
        case_id: target.caseId,
        event_key: eventKey,
        title: alertTitle,
        public_url: alertPublicUrl,
        public_map_label: target.publicMapLabel.slice(0, 200),
        public_latitude: target.latitude,
        public_longitude: target.longitude,
        approved_by: actorId,
        matched_count: matchedCount,
        status: "sending",
        updated_at: new Date().toISOString()
      })
      .select("id")
      .single();
    if (eventError || !eventRow) throw new Error("urgent_alert_event_write_failed");
    eventId = eventRow.id;

    // Freeze the initial audience in the private delivery ledger before any provider send.
    // A retry reuses these rows instead of broadening the audience to new subscribers.
    for (const subscriber of subscribers) {
      await store.claimDelivery({ subscriberId: subscriber.id, alertEventKey: eventKey });
    }
  }

  const { data: plannedRows, error: plannedError } = await client
    .from("alert_deliveries")
    .select("id,subscriber_id,delivery_status")
    .eq("alert_event_key", eventKey);
  if (plannedError) throw new Error("urgent_alert_delivery_lookup_failed");

  const plannedDeliveries: PersistedDelivery[] = (plannedRows ?? [])
    .filter(
      (row) =>
        typeof row.id === "string" &&
        typeof row.subscriber_id === "string" &&
        isDeliveryStatus(row.delivery_status)
    )
    .map((row) => ({
      id: row.id,
      subscriber_id: row.subscriber_id,
      delivery_status: row.delivery_status
    }));

  for (const delivery of plannedDeliveries) {
    if (delivery.delivery_status !== "queued" && delivery.delivery_status !== "failed_retryable") continue;
    const subscriber = subscriberById.get(delivery.subscriber_id);
    if (!subscriber) {
      await store.updateDelivery(delivery.id, "failed_final", {
        failureCode: "subscriber_no_longer_eligible"
      });
      continue;
    }
    const message = buildPublicAlertEmail({
      title: alertTitle,
      publicUrl: alertPublicUrl,
      publicMapLabel: target.publicMapLabel,
      tipContact: target.officialTipContact,
      leadAgency: target.leadAgency,
      unsubscribeTokenId: subscriber.unsubscribe_token_id,
      signingKey,
      deliveryKey: delivery.id,
      siteUrl: siteUrl()
    });
    await sendClaimedAlert(
      store,
      delivery,
      { ...message, to: subscriber.email_normalized },
      { send: sendTransactionalEmail }
    );
  }

  const { data: finalRows, error: finalError } = await client
    .from("alert_deliveries")
    .select("delivery_status")
    .eq("alert_event_key", eventKey);
  if (finalError) throw new Error("urgent_alert_delivery_summary_failed");
  const finalStatuses = (finalRows ?? [])
    .map((row) => row.delivery_status)
    .filter(isDeliveryStatus);
  const summary = summarizeUrgentDeliveryState(finalStatuses, matchedCount);
  const completedAt = new Date().toISOString();
  const { error: summaryError } = await client
    .from("urgent_alert_events")
    .update({
      sent_count: summary.sent,
      status: summary.status,
      sent_at: summary.status === "sent" ? completedAt : null,
      updated_at: completedAt
    })
    .eq("id", eventId);
  if (summaryError) throw new Error("urgent_alert_event_summary_write_failed");

  return {
    matched: matchedCount,
    sent: summary.sent,
    failed: summary.failed,
    duplicate: false
  };
}
