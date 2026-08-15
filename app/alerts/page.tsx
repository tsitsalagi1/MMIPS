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
        <h1>{isCanada ? "Get urgent MMIPS Canada alerts near you" : "Get urgent MMIPS alerts near you"}</h1>
        <p className="lead">{isCanada
          ? "Sign up for email alerts about approved public profiles near your broad postal area. MMIPS reviews every alert before it is sent."
          : "Sign up for email alerts about approved public profiles near your ZIP area. MMIPS reviews every alert before it is sent."}</p>
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
          ? "You only need an email address and Canadian postal code. Both are required. Choose a distance that feels useful to you. You can unsubscribe at any time."
          : "You only need an email address and ZIP code. Both are required. Choose a distance that feels useful to you. You can unsubscribe at any time."}</p>

        {isCanada ? (
          <div className="field-group">
            <label htmlFor="alert-language">Confirmation and alert language</label>
            <select id="alert-language" aria-describedby="alert-language-help" value={consentLanguage} onChange={(event) => { setConsentLanguage(event.target.value === "fr" ? "fr" : "en"); setConsentConfirmed(false); }}>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
            <p id="alert-language-help" className="field-help">Choose the language for confirmation messages and alerts. Changing it clears the consent checkbox below.</p>
          </div>
        ) : null}

        <div className="field-group">
          <label htmlFor="alert-email">Email address</label>
          <input id="alert-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" aria-describedby="alert-email-help" />
          <p id="alert-email-help" className="field-help">Enter one email address. We will send a confirmation link before alerts begin. Do not enter tips or case details here.</p>
        </div>

        <div className="check-grid">
          <div className="field-group">
            <label htmlFor="alert-zip">{isCanada ? "Canadian postal code" : "ZIP code"}</label>
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
            <p id="alert-zip-help" className="field-help">{isCanada
              ? "Example: K1A 0B1. We keep only K1A, the broad postal area, for matching."
              : "Enter five digits. We use the ZIP area to match nearby alerts, not to find your home address. Census ZIP-area matching includes the five inhabited U.S. territories, but some P.O. box or special-purpose ZIP codes cannot be mapped."}</p>
          </div>

          <div className="field-group">
            <label htmlFor="alert-radius">Alert distance</label>
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
            <p id="alert-radius-help" className="field-help">We will email you when an approved urgent alert is within this distance of your {isCanada ? "broad postal area" : "ZIP area"}.</p>
          </div>
        </div>

        <fieldset className="field-group alerts-preference">
          <legend>Alerts outside your distance (optional)</legend>
          <label className="checkbox"><input type="checkbox" checked={allUrgent} onChange={(event) => setAllUrgent(event.target.checked)} /> Send me every approved urgent MMIPS alert.</label>
          <p className="field-help">Leave this unchecked to receive only alerts near your {isCanada ? "postal area" : "ZIP area"}.</p>
        </fieldset>

        <p id="alerts-privacy" className="notice"><strong>Privacy:</strong> {isCanada
          ? "Your subscriber information stays private. We keep only the first three characters of your postal code and match that broad area on the MMIPS Canada server. We do not send your postal code or email address to a geocoder."
          : "Your subscriber information stays private. Our server sends only your ZIP code—not your email address—to the U.S. Census Bureau to find the broad ZIP area. Public pages never show whether an email is subscribed."}</p>

        {isCanada ? (
          <fieldset className="field-group alerts-preference">
            <legend>{consentLanguage === "fr" ? "Consentement exprès" : "Express consent"}</legend>
            <label className="checkbox">
              <input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} required />
              {consentLanguage === "fr" ? CANADA_ALERT_CONSENT_FR : CANADA_ALERT_CONSENT_EN}
            </label>
          </fieldset>
        ) : null}

        {siteKey ? <div className="field-group alerts-turnstile"><div ref={widgetRef} aria-describedby="turnstile-help" /><p id="turnstile-help" className="field-help">Complete this check before you send the form. If it expires or fails, try it again.</p></div> : <p className="notice">The anti-spam check is unavailable, so alert sign-up is temporarily unavailable.</p>}

        {status === "error" && <div className="error-summary" role="alert"><strong>We could not finish the request.</strong><p>{message}</p></div>}
        <div id="alerts-status" ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="status-message">{status === "loading" ? "Sending the request…" : message}</div>
        <button type="submit" disabled={status === "loading" || !siteKey || !turnstileToken || (isCanada && !consentConfirmed)}>{status === "loading" ? "Sending request…" : "Send confirmation email"}</button>
      </form>
    </main>
  );
}
