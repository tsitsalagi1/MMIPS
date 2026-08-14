import assert from "node:assert/strict";
import test from "node:test";
import { subscriberMatchesUrgentTarget } from "../../.test-dist/lib/urgent-alert-matching.js";

function subscriber(overrides = {}) {
  return {
    id: "synthetic-subscriber",
    email_normalized: "border-rehearsal@example.test",
    status: "active",
    synthetic: true,
    confirmation_token_hash: null,
    confirmation_expires_at: null,
    unsubscribe_token_id: "s".repeat(43),
    unsubscribe_token_version: 1,
    preferences: { categories: ["urgent_community_alerts"] },
    home_zip: "48226",
    home_latitude: 42.3314,
    home_longitude: -83.0458,
    radius_miles: 10,
    all_urgent: false,
    geography_source: "synthetic-border-rehearsal",
    confirmation_last_sent_at: null,
    confirmation_window_started_at: null,
    confirmation_send_count: 0,
    ...overrides
  };
}

const windsorTarget = {
  latitude: 42.3149,
  longitude: -83.0364,
  synthetic: true
};

test("distance matches a synthetic Detroit subscriber to a nearby Windsor alert across the border", () => {
  assert.equal(subscriberMatchesUrgentTarget(subscriber(), windsorTarget), true);
});

test("distance excludes a synthetic Chicago subscriber from the same Windsor alert", () => {
  assert.equal(subscriberMatchesUrgentTarget(subscriber({
    home_zip: "60601",
    home_latitude: 41.8781,
    home_longitude: -87.6298,
    radius_miles: 100
  }), windsorTarget), false);
});

test("synthetic alerts never match a real subscriber even at the same coordinates", () => {
  assert.equal(subscriberMatchesUrgentTarget(subscriber({ synthetic: false }), windsorTarget), false);
});

test("real alerts never match a synthetic subscriber even with an all-urgent preference", () => {
  assert.equal(subscriberMatchesUrgentTarget(
    subscriber({ all_urgent: true, preferences: { categories: ["urgent_community_alerts"], allUrgent: true } }),
    { ...windsorTarget, synthetic: false }
  ), false);
});
