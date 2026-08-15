import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAlertStore, MAX_ALERT_REQUEST_BYTES, requestAlertSubscription } from "@/lib/alerts";
import { expectedTurnstileHostname, verifyTurnstileToken } from "@/lib/security/turnstile";
import { lookupZcta, normalizeAlertRadius, normalizeZip } from "@/lib/zip-geo";
import { mmipsSiteMode } from "@/lib/site-mode";
import {
  kilometresToMiles,
  lookupCanadianPostalArea,
  normalizeCanadaAlertRadiusKm
} from "@/lib/canada-postal-geo";
import {
  CANADA_ALERT_CONSENT_EN,
  CANADA_ALERT_CONSENT_FR,
  CANADA_ALERT_CONSENT_SOURCE
} from "@/lib/canada-alert-consent";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") || "0");
  if (length > MAX_ALERT_REQUEST_BYTES) return NextResponse.json({ ok: false, code: "request_too_large", message: "We could not process that request. Please check the form and try again." }, { status: 413 });
  let body: {
    email?: unknown;
    zip?: unknown;
    postalCode?: unknown;
    radiusMiles?: unknown;
    radiusKilometres?: unknown;
    allUrgent?: unknown;
    consentLanguage?: unknown;
    consentConfirmed?: unknown;
    turnstileToken?: unknown;
  };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "invalid_request", message: "We could not process that request. Please check the form and try again." }, { status: 400 }); }

  const turnstile = await verifyTurnstileToken(typeof body.turnstileToken === "string" ? body.turnstileToken : null, request, { expectedAction: "alerts_subscribe", expectedHostname: expectedTurnstileHostname(request) });
  if (!turnstile.ok) return NextResponse.json({ ok: false, code: "abuse_check_failed", message: "We could not process that request right now. Please try again later." }, { status: 400 });

  if (mmipsSiteMode() === "ca") {
    const postalArea = lookupCanadianPostalArea(body.postalCode ?? body.zip);
    const radiusKilometres = normalizeCanadaAlertRadiusKm(body.radiusKilometres);
    if (!postalArea || !radiusKilometres || body.consentConfirmed !== true) {
      return NextResponse.json({
        ok: false,
        code: "invalid_alert_area",
        message: "Enter a valid Canadian postal code and choose an alert distance."
      }, { status: 400 });
    }

    const store = createSupabaseAlertStore();
    if (!store) return NextResponse.json({ ok: false, code: "alerts_unavailable", message: "Email alerts are not available right now. Please try again later." }, { status: 503 });
    const consentLanguage = body.consentLanguage === "fr" ? "fr" : "en";
    try {
      const result = await requestAlertSubscription(store, body.email, {
        homeArea: postalArea.fsa,
        provinceTerritory: postalArea.provinceTerritory,
        radiusKilometres,
        radiusMiles: kilometresToMiles(radiusKilometres),
        allUrgent: body.allUrgent === true,
        homeLatitude: postalArea.latitude,
        homeLongitude: postalArea.longitude,
        geographySource: postalArea.source,
        consentLanguage
      }, {
        consentSource: CANADA_ALERT_CONSENT_SOURCE,
        consentText: consentLanguage === "fr" ? CANADA_ALERT_CONSENT_FR : CANADA_ALERT_CONSENT_EN
      });
      if (!result.ok) return NextResponse.json({ ok: false, code: result.code, message: "Enter a valid email address." }, { status: 400 });
      return NextResponse.json({ ok: true, code: "accepted", message: "If this email can receive MMIPS Canada urgent alerts, a confirmation message will be sent." });
    } catch {
      return NextResponse.json({ ok: false, code: "alerts_request_failed", message: "We could not process that request right now. Please try again later." }, { status: 500 });
    }
  }

  const zip = normalizeZip(body.zip);
  const radiusMiles = normalizeAlertRadius(body.radiusMiles);
  if (!zip || !radiusMiles) return NextResponse.json({ ok: false, code: "invalid_alert_area", message: "Enter a valid 5-digit ZIP code and choose an alert distance." }, { status: 400 });

  const zcta = await lookupZcta(zip);
  if (!zcta) return NextResponse.json({ ok: false, code: "zip_lookup_failed", message: "We could not verify that ZIP code right now. Check the ZIP code and try again." }, { status: 400 });

  const store = createSupabaseAlertStore();
  if (!store) return NextResponse.json({ ok: false, code: "alerts_unavailable", message: "Email alerts are not available right now. Please try again later." }, { status: 503 });

  try {
    const result = await requestAlertSubscription(store, body.email, {
      homeZip: zcta.zip,
      radiusMiles,
      allUrgent: body.allUrgent === true,
      homeLatitude: zcta.latitude,
      homeLongitude: zcta.longitude,
      geographySource: zcta.source
    });
    if (!result.ok) return NextResponse.json({ ok: false, code: result.code, message: "Enter a valid email address." }, { status: 400 });
    return NextResponse.json({ ok: true, code: "accepted", message: "If this email can receive MMIPS urgent alerts, a confirmation message will be sent." });
  } catch {
    return NextResponse.json({ ok: false, code: "alerts_request_failed", message: "We could not process that request right now. Please try again later." }, { status: 500 });
  }
}
