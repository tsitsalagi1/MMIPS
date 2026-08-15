import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const usForm = fs.readFileSync("app/submit/page.tsx", "utf8");
const canadaForm = fs.readFileSync("components/CanadaSubmissionForm.tsx", "utf8");
const fields = fs.readFileSync("lib/submission-identifying-details.ts", "utf8");
const fieldComponent = fs.readFileSync("components/SubmissionIdentifyingDetails.tsx", "utf8");
const usRoute = fs.readFileSync("app/api/submissions/route.ts", "utf8");
const canadaRoute = fs.readFileSync("lib/canada-intake.ts", "utf8");

test("both country submission forms collect the same investigator-useful identifying details", () => {
  assert.match(usForm, /SubmissionIdentifyingDetails/);
  assert.match(canadaForm, /SubmissionIdentifyingDetails/);
  for (const requiredName of [
    "height_description",
    "weight_description",
    "hair_description",
    "eye_description",
    "tattoos_description",
    "scars_marks_description",
    "clothing_description",
    "footwear_description",
    "vehicle_transportation_description",
  ]) assert.match(fields, new RegExp(requiredName));
  assert.match(fieldComponent, /Nothing is sent while you are typing/);
  assert.match(fieldComponent, /stored privately with the submission for moderator review/);
  assert.match(fieldComponent, /do not become public automatically/i);
});

test("both server intake paths append bounded identifying details to the private review record", () => {
  assert.match(usRoute, /appendIdentifyingDetailsToSummary\(form/);
  assert.match(canadaRoute, /appendIdentifyingDetailsToSummary\(form/);
  assert.match(fields, /slice\(0, 24000\)/);
  assert.match(fields, /typeof entry !== "string"/);
});
