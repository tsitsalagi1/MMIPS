import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/resources/family-record/page.tsx", "utf8");
const usResources = fs.readFileSync("app/resources/page.tsx", "utf8");
const canadaResources = fs.readFileSync("components/CanadaResources.tsx", "utf8");
const generator = fs.readFileSync("scripts/generate-family-record-pdfs.py", "utf8");
const proxy = fs.readFileSync("proxy.ts", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");

test("both country resource pages offer only the private downloadable family record", () => {
  for (const source of [usResources, canadaResources]) {
    assert.doesNotMatch(source, /href="\/resources\/family-record"/);
    assert.match(source, /Download private fillable PDF/);
    assert.match(source, /MMIPS does not receive or save anything you type or write in the PDF/);
  }
  assert.match(usResources, /mmips-us-family-record\.pdf/);
  assert.match(canadaResources, /mmips-canada-family-record\.pdf/);
});

test("the retired browser worksheet redirects directly to the country PDF", () => {
  assert.match(page, /redirect\(/);
  assert.match(page, /mmips-canada-family-record\.pdf/);
  assert.match(page, /mmips-us-family-record\.pdf/);
  assert.doesNotMatch(page, /<form|<input|<textarea|localStorage|sessionStorage/);
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
  assert.match(generator, /MMIPS cannot see, receive, or save anything you type or write here/);
  assert.match(generator, /Nothing entered is sent to or saved by MMIPS/);
  for (const filename of ["public/forms/mmips-us-family-record.pdf", "public/forms/mmips-canada-family-record.pdf"]) {
    const pdf = fs.readFileSync(filename);
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(pdf.length > 100000, `${filename} should contain the branded form and fields`);
    assert.match(pdf.toString("latin1"), /\/AcroForm/);
  }
});

test("Canada routing permits PDFs while sitemaps exclude the retired worksheet route", () => {
  assert.match(proxy, /pathname\.startsWith\("\/resources\/"\)/);
  assert.match(proxy, /ico\|pdf/);
  assert.equal((sitemap.match(/"\/resources\/family-record"/g) || []).length, 0);
});
