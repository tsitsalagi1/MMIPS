import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const listRoute = fs.readFileSync("app/api/admin/profiles/route.ts", "utf8");
const updateRoute = fs.readFileSync("app/api/admin/profiles/[id]/route.ts", "utf8");
const panel = fs.readFileSync("app/admin/AdminOfficialSourceDrafts.tsx", "utf8");
const page = fs.readFileSync("app/admin/page.tsx", "utf8");

test("official-source drafts remain pending and require explicit human publication", () => {
  assert.match(listRoute, /official_source_drafts/);
  assert.match(listRoute, /review_status", "pending_review"/);
  assert.match(listRoute, /published_at", null/);
  assert.match(listRoute, /verification_type === "official_source"/);
  assert.match(updateRoute, /action === "publish_official_source"/);
  assert.match(updateRoute, /current\.review_status !== "pending_review"/);
  assert.match(updateRoute, /current\.published_at/);
  assert.match(updateRoute, /review_status: "approved"/);
  assert.match(updateRoute, /published_at: publishedAt/);
});

test("publication requires a public HTTPS government source and moderator note", () => {
  assert.match(updateRoute, /url\.protocol === "https:"/);
  assert.match(updateRoute, /url\.hostname\.endsWith\("\.gov"\)/);
  assert.match(updateRoute, /verification_type", "official_source"/);
  assert.match(updateRoute, /is_public", true/);
  assert.match(updateRoute, /moderatorNotes\.length < 10/);
  assert.match(updateRoute, /official_source_profile_published/);
});

test("admin UI forces source review and deliberate confirmation before publication", () => {
  assert.match(panel, /Official-source drafts awaiting review/);
  assert.match(panel, /target="_blank" rel="noreferrer noopener"/);
  assert.match(panel, /I reviewed the official source and this MMIPS draft/);
  assert.match(panel, /does not expose exact\/private location or non-public investigative information/);
  assert.match(panel, /window\.confirm/);
  assert.match(panel, /Publish reviewed official-source profile/);
  assert.match(panel, /disabled=\{loading \|\| !confirmed\[draft\.id\]/);
  assert.match(page, /AdminOfficialSourceDrafts/);
});

test("official-source publication does not introduce automated data harvesting or auto-approval", () => {
  assert.doesNotMatch(panel + listRoute + updateRoute, /scrape|crawler|crawl\(|cheerio|playwright|puppeteer/i);
  assert.doesNotMatch(updateRoute, /review_status:\s*"approved"[\s\S]{0,120}(GET|setInterval|cron)/i);
});
