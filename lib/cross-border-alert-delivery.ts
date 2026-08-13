import {
  buildPublicAlertEmail,
  createSupabaseAlertStore,
  sendClaimedAlert,
  unsubscribeSigningKeys
} from "@/lib/alerts";
import { siteUrl, sendTransactionalEmail } from "@/lib/email";
import { mmipsSiteMode } from "@/lib/site-mode";
import { subscriberMatchesUrgentTarget } from "@/lib/urgent-alerts";
import type { CrossBorderAlertPayload } from "@/lib/cross-border-alert-contract";

function localProfileHandoffUrl(payload: CrossBorderAlertPayload) {
  const source = new URL(payload.publicUrl);
  const segments = source.pathname.split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== "profiles") throw new Error("cross_border_alert_profile_url_invalid");
  const slug = segments[1];
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) throw new Error("cross_border_alert_profile_slug_invalid");
  return `${siteUrl().replace(/\/$/, "")}/profiles/cross-border/${payload.sourceCountry}/${encodeURIComponent(slug)}`;
}

export async function processCrossBorderAlert(payload: CrossBorderAlertPayload) {
  const localCountry = mmipsSiteMode();
  if ((localCountry !== "us" && localCountry !== "ca") || localCountry === payload.sourceCountry) {
    throw new Error("cross_border_alert_wrong_destination");
  }

  const store = createSupabaseAlertStore();
  const signingKey = unsubscribeSigningKeys()[0];
  if (!store || !signingKey) throw new Error("cross_border_alert_local_store_unavailable");

  const subscribers = (await store.activeSubscribers()).filter((subscriber) =>
    subscriberMatchesUrgentTarget(subscriber, payload)
  );
  if (payload.intent === "preview") return { matched: subscribers.length, sent: 0, failed: 0 };

  const alertEventKey = `cross-border:${payload.sourceCountry}:${payload.eventKey}`;
  const publicUrl = localProfileHandoffUrl(payload);
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const delivery = await store.claimDelivery({ subscriberId: subscriber.id, alertEventKey });
    if (!delivery || delivery.delivery_status === "sent") continue;

    const message = buildPublicAlertEmail({
      title: payload.title,
      publicUrl,
      publicMapLabel: payload.publicMapLabel,
      tipContact: payload.officialTipContact,
      leadAgency: payload.leadAgency,
      unsubscribeTokenId: subscriber.unsubscribe_token_id,
      signingKey,
      deliveryKey: delivery.id,
      siteUrl: siteUrl()
    });
    const result = await sendClaimedAlert(
      store,
      delivery,
      { ...message, to: subscriber.email_normalized },
      { send: sendTransactionalEmail }
    );
    if (result.ok) sent += 1;
    else failed += 1;
  }

  return { matched: subscribers.length, sent, failed };
}
