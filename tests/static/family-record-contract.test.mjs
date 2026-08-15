import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/resources/family-record/page.tsx", "utf8");
const actions = fs.readFileSync("app/resources/family-record/FamilyRecordPrintActions.tsx", "utf8");
const usResources = fs.readFileSync("app/resources/page.tsx", "utf8");
const canadaResources = fs.readFileSync("components/CanadaResources.tsx", "utf8");
const generator = fs.readFileSync("scripts/generate-family-record-pdfs.py", "utf8");
const proxy = fs.readFileSync("proxy.ts", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");

test("both country resource pages link to the printable and fillable family record", () => {
  for (const source of [usResources, canadaResources]) {
    assert.match(source, /href="\/resources\/family-record"/);
    assert.match(source, /Download fillable PDF/);
  }
  assert.match(usResources, /mmips-us-family-record\.pdf/);
  assert.match(canadaResources, /mmips-canada-family-record\.pdf/);
});

test("the browser record is local-only, printable, and separates private from public information", () => {
  assert.match(page, /Nothing you type on this page is sent to MMIPS or saved by this page/);
  assert.match(page, /private-record-field/);
  assert.match(page, /Broad area that the investigating agency says may be safe to share publicly/);
  assert.match(page, /Exact last-seen or last-contact location for investigators/);
  assert.match(page, /Height/);
  assert.match(page, /Weight/);
  assert.match(page, /Hair colour/);
  assert.match(page, /Eye colour/);
  assert.match(page, /Tattoos/);
  assert.match(page, /Last seen/);
  assert.match(page, /Need to contact/);
  assert.match(page, /Contacted/);
  assert.match(page, /Do not attach photographs to this workbook/);
  assert.match(page, /BIA Missing and Murdered Unit/);
  assert.match(page, /Family Information Liaison Unit/);
  assert.doesNotMatch(page, /<form|fetch\(|localStorage|sessionStorage|action=/);
  assert.match(actions, /window\.print\(\)/);
});

test("generated U.S. and Canada PDFs are comprehensive eleven-page AcroForms", () => {
  assert.match(generator, /TOTAL_PAGES = 11/);
  assert.match(generator, /c\.acroForm\.textfield/);
  assert.match(generator, /c\.acroForm\.checkbox/);
  assert.match(generator, /PdfReader/);
  assert.match(generator, /missing a normal appearance/);
  assert.match(generator, /Height/);
  assert.match(generator, /Weight/);
  assert.match(generator, /Hair colour/);
  assert.match(generator, /Eye colour/);
  assert.match(generator, /Tattoos/);
  assert.match(generator, /Last seen/);
  assert.match(generator, /do not attach them here/i);
  assert.match(generator, /Need to contact/);
  assert.match(generator, /Contacted/);
  for (const filename of ["public/forms/mmips-us-family-record.pdf", "public/forms/mmips-canada-family-record.pdf"]) {
    const pdf = fs.readFileSync(filename);
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(pdf.length > 100000, `${filename} should contain the branded form and fields`);
    assert.match(pdf.toString("latin1"), /\/AcroForm/);
  }
});

test("Canada routing and both country sitemaps expose the family record and PDF assets", () => {
  assert.match(proxy, /pathname\.startsWith\("\/resources\/"\)/);
  assert.match(proxy, /ico\|pdf/);
  assert.equal((sitemap.match(/"\/resources\/family-record"/g) || []).length, 2);
});
