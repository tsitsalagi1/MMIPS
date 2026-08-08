"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";

declare global { interface Window { turnstile?: { render(element: HTMLElement, options: Record<string, unknown>): string; reset(id: string): void } } }

const genericPending = "If this email can receive MMIPS urgent alerts, a confirmation message will be sent. Please check your email and confirm before alerts are active.";

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

  function renderTurnstile() {
    if (!siteKey || !window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      action: "alerts_subscribe",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => { setTurnstileToken(""); setMessage("The anti-spam check could not load. Please retry it."); }
    });
  }
  useEffect(() => { renderTurnstile(); });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Saving your private alert preferences and sending a confirmation request.");
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

  return (
    <main className="alerts-page stack page-narrow" id="main-content">
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderTurnstile} />}

      <section className="alerts-hero card stack">
        <p className="eyebrow">Urgent community alerts</p>
        <h1>Help your community. Get urgent MMIP alerts near you.</h1>
        <p className="lead">When a moderator-approved public case needs urgent awareness, nearby community members may recognize a person, vehicle, area, or circumstance that can help an official investigation. Choose your ZIP code and how far from that area you want to receive MMIPS urgent email alerts.</p>
      </section>

      <section className="card stack" aria-labelledby="alerts-consent-heading">
        <h2 id="alerts-consent-heading">How urgent alerts work</h2>
        <ul className="checklist">
          <li>MMIPS sends alerts only after a profile is approved for public awareness and a moderator explicitly authorizes the urgent alert.</li>
          <li>Your ZIP code is used as a generalized Census ZIP Code Tabulation Area reference point. MMIPS does not ask for your street address or device location.</li>
          <li>Your email address, ZIP code, and distance preference stay private and are used only for alert delivery and consent records.</li>
          <li>You must confirm through an email link before alerts become active.</li>
          <li>Every alert contains an unsubscribe link. No account or explanation is required to unsubscribe.</li>
          <li>MMIPS is not an emergency service or tip line. Urgent information should go to emergency services or the official contact listed on the public profile.</li>
        </ul>
      </section>

      <form className="card stack alerts-subscribe-card" onSubmit={submit} noValidate aria-describedby="alerts-help alerts-privacy alerts-status">
        <h2>Sign up for urgent community alerts</h2>
        <p id="alerts-help">Choose the area you want to help watch. Location matching uses only a generalized ZIP-area reference point and an approved approximate public-awareness point for the case.</p>

        <div className="field-group">
          <label htmlFor="alert-email">Email address <span aria-hidden="true">*</span></label>
          <p id="alert-email-help" className="field-help">Use an email address where you can receive the confirmation link. Do not enter tips, case details, addresses, or phone numbers here.</p>
          <input id="alert-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" aria-describedby="alert-email-help" />
        </div>

        <div className="check-grid">
          <div className="field-group">
            <label htmlFor="alert-zip">ZIP code <span aria-hidden="true">*</span></label>
            <p id="alert-zip-help" className="field-help">Five digits only. This is an alert-area preference, not a request for your home address.</p>
            <input id="alert-zip" name="zip" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} value={zip} onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))} required aria-describedby="alert-zip-help" />
          </div>

          <div className="field-group">
            <label htmlFor="alert-radius">Alert distance <span aria-hidden="true">*</span></label>
            <p id="alert-radius-help" className="field-help">Receive an urgent alert when its approved public-awareness point falls within this distance of your ZIP-area reference point.</p>
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
          <legend>Urgent alert preference</legend>
          <label className="checkbox"><input type="checkbox" checked={allUrgent} onChange={(event) => setAllUrgent(event.target.checked)} /> Also send me every approved urgent MMIPS alert, even when it is outside my selected distance.</label>
          <p className="field-help">Leave this unchecked if you want only ZIP/radius-matched urgent alerts.</p>
        </fieldset>

        <p id="alerts-privacy" className="notice"><strong>Privacy:</strong> MMIPS stores subscriber information privately. The server sends only the ZIP code—not your email address—to the U.S. Census Bureau TIGERweb service to obtain a generalized ZCTA reference point. Public responses do not reveal whether an email is subscribed.</p>

        {siteKey ? <div className="field-group alerts-turnstile"><p id="turnstile-help" className="field-help">Complete the anti-spam check. If it expires or fails, retry it before submitting.</p><div ref={widgetRef} aria-describedby="turnstile-help" /></div> : <p className="notice">The anti-spam check is unavailable. Subscription requests will remain disabled.</p>}

        {status === "error" && <div className="error-summary" role="alert"><strong>Request not completed.</strong><p>{message}</p></div>}
        <div id="alerts-status" ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="status-message">{status === "loading" ? "Sending the request…" : message}</div>
        <button type="submit" disabled={status === "loading" || !siteKey || !turnstileToken}>{status === "loading" ? "Sending request…" : "Send confirmation email"}</button>
      </form>
    </main>
  );
}
