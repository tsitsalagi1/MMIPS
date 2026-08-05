import assert from "node:assert/strict";
import test from "node:test";
import {
  flyerTitleForProfile,
  mapCategoryLabel,
  profileIntroForType,
  profileTypeLabel,
  statusLabel,
  verificationLabel
} from "../../.test-dist/lib/status.js";

test("production status labels use calm public wording", () => {
  assert.equal(statusLabel("missing"), "Missing");
  assert.equal(statusLabel("murdered_unsolved"), "Information needed");
  assert.equal(statusLabel("resolved"), "Located / resolved");
  assert.equal(statusLabel("not-a-real-status"), "Unknown");
});

test("production profile type labels avoid unsafe details", () => {
  assert.equal(profileTypeLabel("urgent_missing"), "Urgent public awareness");
  assert.equal(profileTypeLabel("murdered_info_needed"), "Remembering / information needed");
  assert.equal(profileTypeLabel("removed"), "Removed from public view");
});

test("production flyer titles and map categories preserve approved public status semantics", () => {
  assert.equal(flyerTitleForProfile("urgent_missing", "missing"), "URGENT PUBLIC AWARENESS");
  assert.equal(flyerTitleForProfile("located", "resolved"), "LOCATED / STATUS UPDATE");
  assert.equal(mapCategoryLabel("murdered_info_needed", "murdered_unsolved"), "Murdered / information needed");
});

test("production intro and verification labels route information safely", () => {
  assert.match(profileIntroForType("urgent_missing"), /MMIPS does not collect tips/);
  assert.equal(verificationLabel("family_authorized"), "Family/authorized submitter");
  assert.equal(verificationLabel("synthetic_demo_status"), "synthetic demo status");
});
