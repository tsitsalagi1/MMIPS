import type { DeliveryStatus } from "./alerts-core";

export type UrgentAlertEventStatus = "sending" | "sent" | "partial" | "failed";

export function summarizeUrgentDeliveryState(statuses: readonly DeliveryStatus[], matchedCount: number) {
  const expected = Number.isInteger(matchedCount) && matchedCount > 0 ? matchedCount : 0;
  const sent = statuses.filter((status) => status === "sent").length;
  const failedFinal = statuses.filter((status) => status === "failed_final").length;
  const retryable = statuses.filter((status) => status === "queued" || status === "failed_retryable").length;
  const missing = Math.max(0, expected - statuses.length);
  const failed = failedFinal + retryable + missing;
  const status: UrgentAlertEventStatus = expected === 0 || (sent === expected && failed === 0)
    ? "sent"
    : sent > 0
      ? "partial"
      : "failed";

  return { status, sent, failed, failedFinal, retryable, missing };
}
