import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workflow = fs.readFileSync("lib/alerts-workflow.ts", "utf8");
const alerts = fs.readFileSync("lib/alerts.ts", "utf8");
const actionForm = fs.readFileSync("app/alerts/shared/AlertActionForm.tsx", "utf8");
const theme = fs.readFileSync("app/theme-overrides.css", "utf8");
const flyerPage = fs.readFileSync("app/profiles/[slug]/flyer/page.tsx", "utf8");
const flyerActions = fs.readFileSync("components/FlyerActions.tsx", "utf8");

test("confirmation email has a visible signed cancel link and standard one-click unsubscribe headers", () => {
  assert.match(workflow, /signUnsubscribeToken\(subscriber\.unsubscribe_token_id, signingKey\)/);
  assert.match(workflow, /Unsubscribe \/ cancel this alert request/);
  assert.match(workflow, /"List-Unsubscribe": `<\$\{unsubscribeApiUrl\}>`/);
  assert.match(workflow, /"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"/);
  assert.match(alerts, /signingKeys: unsubscribeSigningKeys\(\)/);
});

test("confirmation and unsubscribe action pages use the centered alerts layout", () => {
  assert.match(actionForm, /className="alerts-page alert-action-page"/);
  assert.match(actionForm, /className="card stack alert-action-card"/);
  assert.match(theme, /\.alert-action-page/);
  assert.match(theme, /justify-items: center/);
  assert.match(theme, /\.alert-action-card/);
});

test("printable and JPEG flyers visibly promote MMIPS alerts", () => {
  assert.match(flyerPage, /const alertsUrl = `\$\{siteUrl\}\/alerts`/);
  assert.match(flyerPage, /Get MMIPS urgent community alerts/);
  assert.match(flyerPage, /Alerts: \{alertsUrl\}/);
  assert.match(flyerPage, /alertsUrl=\{alertsUrl\}/);
  assert.match(flyerActions, /alertsUrl: string/);
  assert.match(flyerActions, /GET MMIPS URGENT COMMUNITY ALERTS/);
  assert.match(flyerActions, /Alerts: \$\{props\.alertsUrl\}/);
});
