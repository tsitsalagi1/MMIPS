import { distanceMiles } from "./zip-geo";
import { isSupportedAlertRadiusMiles, type AlertSubscriberRecord } from "./alerts-core";

export type UrgentAlertAudienceTarget = {
  latitude: number;
  longitude: number;
  synthetic: boolean;
};

export function subscriberMatchesUrgentTarget(
  subscriber: AlertSubscriberRecord,
  target: UrgentAlertAudienceTarget
) {
  if (subscriber.status !== "active") return false;
  if (subscriber.synthetic !== target.synthetic) return false;
  if (!subscriber.preferences?.categories?.includes("urgent_community_alerts")) return false;
  if (subscriber.all_urgent === true || subscriber.preferences.allUrgent === true) return true;
  const latitude = Number(subscriber.home_latitude ?? subscriber.preferences.homeLatitude);
  const longitude = Number(subscriber.home_longitude ?? subscriber.preferences.homeLongitude);
  const radius = Number(subscriber.radius_miles ?? subscriber.preferences.radiusMiles);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !isSupportedAlertRadiusMiles(radius)) {
    return false;
  }
  return distanceMiles(
    { latitude, longitude },
    { latitude: target.latitude, longitude: target.longitude }
  ) <= radius;
}
