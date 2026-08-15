"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CANADA_ALERT_CONSENT_EN, CANADA_ALERT_CONSENT_FR } from "@/lib/canada-alert-consent";

declare global { interface Window { turnstile?: { render(element: HTMLElement, options: Record<string, unknown>): string; reset(id: string): void } } }

const genericPending = "If this email can receive MMIPS urgent alerts, a confirmation message will be sent. Check your email and confirm before alerts become active.";

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("50");
  const [allUrgent, setAllUrgent] = useState(false);
  const [consentLanguage, setConsentLanguage] = useState<"en" | "fr">("en");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "pending" | "error">("idle");
  const [message, setMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isCanada = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mmips.com").hostname === "ca.mmips.com";
    } catch {
      return false;
    }
  })();

  function renderTurnstile() {
    if (!siteKey || !window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      action: "alerts_subscribe",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => { setTurnstileToken(""); setMessage("The anti-spam check could not load. Please try it again."); }
    });
  }
  useEffect(() => { renderTurnstile(); });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Saving your alert choices and sending a confirmation email.");
    try {
      const response = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isCanada
          ? { email, postalCode: zip, radiusKilometres: Number(radiusMiles), allUrgent, consentLanguage, consentConfirmed, turnstileToken }
          : { email, zip, radiusMiles: Number(radiusMiles), allUrgent, turnstileToken })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("error");
        setMessage(typeof data.message === "string" ? data.message : "We could not process that request right now. Please try again later.");
      } else {
        setStatus("pending");
        setMessage(isCanada && consentLanguage === "fr"
          ? "Si cette adresse peut recevoir les alertes urgentes de MMIPS Canada, un courriel de confirmation sera envoyé. Confirmez votre adresse avant l’activation des alertes."
          : genericPending);
        setEmail("");
        setZip("");
        setConsentConfirmed(false);
      }
    } catch {
      setStatus("error");
      setMessage("We could not process that request right now. Please try again later.");
    } finally {
      setTurnstileToken("");
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
      window.setTimeout(() => statusRef.current?.focus(), 0);
    }
  }

  return (
    <main className="alerts-page stack page-narrow" id="main-content">
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderTurnstile} />}

      <section className="alerts-hero card stack">
        <p className="eyebrow">Urgent community alerts</p>
        <h1>{isCanada ? "Get urgent MMIPS Canada alerts near you." : "Get urgent MMIPS alerts near you."}</h1>
        <p className="lead">{isCanada
          ? "MMIPS Canada sends email alerts when an approved public profile needs urgent community attention. Enter your Canadian postal code and choose how far from that broad postal area you want to receive alerts."
          : "MMIPS sends email alerts when an approved public profile needs urgent community attention. Enter your ZIP code and choose how far from that area you want to receive alerts."}</p>
      </section>

      <section className="card stack" aria-labelledby="alerts-consent-heading">
        <h2 id="alerts-consent-heading">How alerts work</h2>
        <ul className="checklist">
          <li>A moderator must approve the public profile and the urgent alert before MMIPS sends it.</li>
          <li>{isCanada ? "We keep only your broad three-character postal area for matching. We do not ask for your street address or phone location." : "We use your ZIP code only to match you with nearby alerts. We do not ask for your street address or phone location."}</li>
          <li>{isCanada ? "Your email address, postal area, and distance choice stay private." : "Your email address, ZIP code, and distance choice stay private."}</li>
          <li>You must click the confirmation link in your email before alerts begin.</li>
          <li>Every alert includes a simple unsubscribe link. You do not need an account or an explanation to unsubscribe.</li>
          <li>MMIPS is not a tip line or emergency service. Send tips to the official contact shown in the alert. Call 911 for immediate danger.</li>
        </ul>
      </section>

      <form className="card stack alerts-subscribe-card" onSubmit={submit} noValidate aria-describedby="alerts-help alerts-privacy alerts-status">
        <h2>Sign up for urgent community alerts</h2>
        <p id="alerts-help">{isCanada
          ? "Enter your email and Canadian postal code, then choose how far away you want alerts. Both fields are required. Alert distance starts at 50 kilometres, but you can change it."
          : "Enter your email and ZIP code, then choose how far away you want alerts. Email and ZIP code are required. Alert distance starts at 50 miles, but you can change it."}</p>

        {isCanada ? (
          <div className="field-group">
            <label htmlFor="alert-language">Confirmation and alert language</label>
            <select id="alert-language" value={consentLanguage} onChange={(event) => { setConsentLanguage(event.target.value === "fr" ? "fr" : "en"); setConsentConfirmed(false); }}>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        ) : null}

        <div className="field-group">
          <label htmlFor="alert-email">Email address</label>
          <p id="alert-email-help" className="field-help">We will send the confirmation link here. Do not enter tips, case details, addresses, or phone numbers.</p>
          <input id="alert-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" aria-describedby="alert-email-help" />
        </div>

        <div className="check-grid">
          <div className="field-group">
            <label htmlFor="alert-zip">{isCanada ? "Canadian postal code" : "ZIP code"}</label>
            <p id="alert-zip-help" className="field-help">{isCanada ? "Example: K1A 0B1. We immediately reduce it to the broad K1A postal area for matching." : "Five digits only. We use this to match nearby alerts, not to find your home address."}</p>
            <input
              id="alert-zip"
              name={isCanada ? "postalCode" : "zip"}
              inputMode={isCanada ? "text" : "numeric"}
              autoComplete="postal-code"
              pattern={isCanada ? "[A-Za-z][0-9][A-Za-z][ -]?[0-9][A-Za-z][0-9]" : "[0-9]{5}"}
              maxLength={isCanada ? 7 : 5}
              placeholder={isCanada ? "K1A 0B1" : undefined}
              value={zip}
              onChange={(event) => setZip(isCanada
                ? event.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, "").slice(0, 7)
                : event.target.value.replace(/\D/g, "").slice(0, 5))}
              required
              aria-describedby="alert-zip-help"
            />
          </div>

          <div className="field-group">
            <label htmlFor="alert-radius">Alert distance</label>
            <p id="alert-radius-help" className="field-help">Choose how close an approved urgent alert must be to your {isCanada ? "broad postal area" : "ZIP area"} before we email you.</p>
            <select id="alert-radius" name="radiusMiles" value={radiusMiles} onChange={(event) => setRadiusMiles(event.target.value)} aria-describedby="alert-radius-help">
              {isCanada ? (
                <>
                  <option value="25">Within 25 kilometres</option>
                  <option value="50">Within 50 kilometres</option>
                  <option value="100">Within 100 kilometres</option>
                  <option value="250">Within 250 kilometres</option>
                  <option value="500">Within 500 kilometres</option>
                </>
              ) : (
                <>
                  <option value="10">Within 10 miles</option>
                  <option value="25">Within 25 miles</option>
                  <option value="50">Within 50 miles</option>
                  <option value="100">Within 100 miles</option>
                  <option value="250">Within 250 miles</option>
                </>
              )}
            </select>
          </div>
        </div>

        <fieldset className="field-group alerts-preference">
          <legend>Want every urgent MMIPS alert?</legend>
          <label className="checkbox"><input type="checkbox" checked={allUrgent} onChange={(event) => setAllUrgent(event.target.checked)} /> Yes. Send me every approved urgent MMIPS alert, even when it is outside my selected distance.</label>
          <p className="field-help">Leave this unchecked if you want only alerts that match your {isCanada ? "postal area" : "ZIP code"} and distance.</p>
        </fieldset>

        <p id="alerts-privacy" className="notice"><strong>Privacy:</strong> {isCanada
          ? "MMIPS Canada keeps subscriber information private. Postal-area matching happens on the MMIPS Canada server using a broad Statistics Canada census area. We do not send your postal code or email address to a geocoder, and public pages do not show whether an email is subscribed."
          : "MMIPS keeps your subscriber information private. To get a general ZIP-area location, our server sends only your ZIP code to the U.S. Census Bureau. It does not send your email address. Public pages do not show whether an email is subscribed."}</p>

        {isCanada ? (
          <fieldset className="field-group alerts-preference">
            <legend>{consentLanguage === "fr" ? "Consentement exprès" : "Express consent"}</legend>
            <label className="checkbox">
              <input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} required />
              {consentLanguage === "fr" ? CANADA_ALERT_CONSENT_FR : CANADA_ALERT_CONSENT_EN}
            </label>
          </fieldset>
        ) : null}

        {siteKey ? <div className="field-group alerts-turnstile"><p id="turnstile-help" className="field-help">Complete the anti-spam check. If it expires or fails, try it again before you submit.</p><div ref={widgetRef} aria-describedby="turnstile-help" /></div> : <p className="notice">The anti-spam check is unavailable, so alert sign-up is temporarily unavailable.</p>}

        {status === "error" && <div className="error-summary" role="alert"><strong>We could not finish the request.</strong><p>{message}</p></div>}
        <div id="alerts-status" ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="status-message">{status === "loading" ? "Sending the request…" : message}</div>
        <button type="submit" disabled={status === "loading" || !siteKey || !turnstileToken || (isCanada && !consentConfirmed)}>{status === "loading" ? "Sending request…" : "Send confirmation email"}</button>
      </form>
    </main>
  );
}
