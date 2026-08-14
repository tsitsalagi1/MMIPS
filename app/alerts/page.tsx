"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";

declare global { interface Window { turnstile?: { render(element: HTMLElement, options: Record<string, unknown>): string; reset(id: string): void } } }

const genericPending = "If this email can receive MMIPS urgent alerts, a confirmation message will be sent. Check your email and confirm before alerts become active.";

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("50");
  const [allUrgent, setAllUrgent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "pending" | "error">("idle");
  const [message, setMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const canadaAlertsLocked = (() => {
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
        body: JSON.stringify({ email, zip, radiusMiles: Number(radiusMiles), allUrgent, turnstileToken })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("error");
        setMessage(typeof data.message === "string" ? data.message : "We could not process that request right now. Please try again later.");
      } else {
        setStatus("pending");
        setMessage(genericPending);
        setEmail("");
        setZip("");
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

  if (canadaAlertsLocked) {
    return (
      <main className="alerts-page stack page-narrow" id="main-content">
        <section className="alerts-hero card stack">
          <p className="eyebrow">Urgent community alerts</p>
          <h1>Canadian alert sign-up is not open yet.</h1>
          <p className="lead">
            MMIPS is rehearsing distance-based U.S.–Canada alert matching with fictional records only.
            An alert can cross the border when a confirmed subscriber is inside the chosen distance.
          </p>
        </section>
        <section className="card stack">
          <h2>Why sign-up is paused</h2>
          <p>
            Canadian postal-area lookup, bilingual consent language, and privacy review must be completed before
            real subscriber information is accepted. The current rehearsal uses reserved, non-deliverable test
            addresses and does not enroll the public.
          </p>
          <p>MMIPS will not ask Canadian visitors to enter a U.S. ZIP code or send Canadian postal codes to the U.S. Census Bureau.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="alerts-page stack page-narrow" id="main-content">
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderTurnstile} />}

      <section className="alerts-hero card stack">
        <p className="eyebrow">Urgent community alerts</p>
        <h1>Get urgent MMIPS alerts near you.</h1>
        <p className="lead">MMIPS sends email alerts when an approved public profile needs urgent community attention. Enter your ZIP code and choose how far from that area you want to receive alerts.</p>
      </section>

      <section className="card stack" aria-labelledby="alerts-consent-heading">
        <h2 id="alerts-consent-heading">How alerts work</h2>
        <ul className="checklist">
          <li>A moderator must approve the public profile and the urgent alert before MMIPS sends it.</li>
          <li>We use your ZIP code only to match you with nearby alerts. We do not ask for your street address or phone location.</li>
          <li>Your email address, ZIP code, and distance choice stay private.</li>
          <li>You must click the confirmation link in your email before alerts begin.</li>
          <li>Every alert includes a simple unsubscribe link. You do not need an account or an explanation to unsubscribe.</li>
          <li>MMIPS is not a tip line or emergency service. Send tips to the official contact shown in the alert. Call 911 for immediate danger.</li>
        </ul>
      </section>

      <form className="card stack alerts-subscribe-card" onSubmit={submit} noValidate aria-describedby="alerts-help alerts-privacy alerts-status">
        <h2>Sign up for urgent community alerts</h2>
        <p id="alerts-help">Enter your email and ZIP code, then choose how far away you want alerts. Email and ZIP code are required. Alert distance starts at 50 miles, but you can change it.</p>

        <div className="field-group">
          <label htmlFor="alert-email">Email address</label>
          <p id="alert-email-help" className="field-help">We will send the confirmation link here. Do not enter tips, case details, addresses, or phone numbers.</p>
          <input id="alert-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" aria-describedby="alert-email-help" />
        </div>

        <div className="check-grid">
          <div className="field-group">
            <label htmlFor="alert-zip">ZIP code</label>
            <p id="alert-zip-help" className="field-help">Five digits only. We use this to match nearby alerts, not to find your home address.</p>
            <input id="alert-zip" name="zip" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} value={zip} onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))} required aria-describedby="alert-zip-help" />
          </div>

          <div className="field-group">
            <label htmlFor="alert-radius">Alert distance</label>
            <p id="alert-radius-help" className="field-help">Choose how close an approved urgent alert must be to your ZIP area before we email you.</p>
            <select id="alert-radius" name="radiusMiles" value={radiusMiles} onChange={(event) => setRadiusMiles(event.target.value)} aria-describedby="alert-radius-help">
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
              <option value="50">Within 50 miles</option>
              <option value="100">Within 100 miles</option>
              <option value="250">Within 250 miles</option>
            </select>
          </div>
        </div>

        <fieldset className="field-group alerts-preference">
          <legend>Want every urgent MMIPS alert?</legend>
          <label className="checkbox"><input type="checkbox" checked={allUrgent} onChange={(event) => setAllUrgent(event.target.checked)} /> Yes. Send me every approved urgent MMIPS alert, even when it is outside my selected distance.</label>
          <p className="field-help">Leave this unchecked if you want only alerts that match your ZIP code and distance.</p>
        </fieldset>

        <p id="alerts-privacy" className="notice"><strong>Privacy:</strong> MMIPS keeps your subscriber information private. To get a general ZIP-area location, our server sends only your ZIP code to the U.S. Census Bureau. It does not send your email address. Public pages do not show whether an email is subscribed.</p>

        {siteKey ? <div className="field-group alerts-turnstile"><p id="turnstile-help" className="field-help">Complete the anti-spam check. If it expires or fails, try it again before you submit.</p><div ref={widgetRef} aria-describedby="turnstile-help" /></div> : <p className="notice">The anti-spam check is unavailable, so alert sign-up is temporarily unavailable.</p>}

        {status === "error" && <div className="error-summary" role="alert"><strong>We could not finish the request.</strong><p>{message}</p></div>}
        <div id="alerts-status" ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="status-message">{status === "loading" ? "Sending the request…" : message}</div>
        <button type="submit" disabled={status === "loading" || !siteKey || !turnstileToken}>{status === "loading" ? "Sending request…" : "Send confirmation email"}</button>
      </form>
    </main>
  );
}
