import assert from "node:assert/strict";
import test from "node:test";
import { appendIdentifyingDetailsToSummary } from "../../.test-dist/lib/submission-identifying-details.js";

test("submission identifying details are bounded and appended for private moderator review", () => {
  const form = new FormData();
  form.set("height_description", "5 feet 7 inches");
  form.set("hair_description", "Black, shoulder length");
  form.set("tattoos_description", "Blue bird on left shoulder");
  form.set("clothing_description", "Red coat and dark jeans");
  const result = appendIdentifyingDetailsToSummary(form, "Approved public facts.");
  assert.match(result, /^Approved public facts\./);
  assert.match(result, /not published automatically/);
  assert.match(result, /Height \(feet and inches or centimetres\): 5 feet 7 inches/);
  assert.match(result, /Hair colour, length, and style: Black, shoulder length/);
  assert.match(result, /Tattoos - design, words, colour, and body location: Blue bird on left shoulder/);
  assert.match(result, /Last-seen clothing: Red coat and dark jeans/);
});

test("empty and non-text identifying entries do not add a description section", () => {
  const form = new FormData();
  form.set("height_description", "   ");
  form.set("hair_description", new Blob(["not accepted"]), "unsafe.txt");
  assert.equal(appendIdentifyingDetailsToSummary(form, "  Public facts.  "), "Public facts.");
});

test("identifying detail output has a hard upper bound", () => {
  const form = new FormData();
  form.set("tattoos_description", "x".repeat(10000));
  const result = appendIdentifyingDetailsToSummary(form, "y".repeat(20000));
  assert.ok(result.length <= 24000);
  assert.match(result, /Identifying details supplied for MMIPS review/);
});
