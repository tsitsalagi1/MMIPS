"use client";

import { FormEvent, useRef, useState } from "react";

const genericPending = "If this email can receive MMIPS alerts, a confirmation message will be sent. Please check your email and confirm before alerts are active.";

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "pending" | "error">("idle");
  const [message, setMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Submitting your request without publishing your email address.");
    try {
      const response = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preferences: { categories: ["all_public_alerts"] } })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("error");
        setMessage(typeof data.message === "string" ? data.message : "We could not process that request right now. Please try again later.");
      } else {
        setStatus("pending");
        setMessage(genericPending);
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage("We could not process that request right now. Please try again later.");
    } finally {
      window.setTimeout(() => statusRef.current?.focus(), 0);
    }
  }

  return (
    <main className="stack page-narrow" id="main-content">
      <section className="hero-card stack">
        <p className="eyebrow">Private email alerts</p>
        <h1>Get approved public MMIPS updates by email</h1>
        <p className="lead">Alerts are for moderator-approved public profiles and material public status updates only. They do not include private case details, exact sensitive locations, requester information, private photos, rumors, accusations, or graphic details.</p>
      </section>

      <section className="card stack" aria-labelledby="alerts-consent-heading">
        <h2 id="alerts-consent-heading">Before you subscribe</h2>
        <ul className="checklist">
          <li>Subscribing does not report a case, send a tip, or ask MMIPS to investigate.</li>
          <li>MMIPS does not investigate tips. Send urgent information to emergency services or the listed official contact.</li>
          <li>Your email address and alert preferences remain private and are used only for MMIPS email alerts.</li>
          <li>You must confirm through an email link before alerts are active.</li>
          <li>Every alert email includes an unsubscribe link. You do not need an account or a reason to unsubscribe.</li>
        </ul>
      </section>

      <form className="card stack" onSubmit={submit} noValidate aria-describedby="alerts-help alerts-privacy alerts-status">
        <h2>Subscribe with double opt-in</h2>
        <p id="alerts-help">Required fields are marked. Version 1 supports one broad preference: all approved public alerts. More specific location preferences are deferred until they can be proven public-safe.</p>
        <div className="field-group">
          <label htmlFor="alert-email">Email address <span aria-hidden="true">*</span></label>
          <p id="alert-email-help" className="field-help">Use an email address where you can receive the confirmation link. Do not enter phone numbers, addresses, private case details, or tips here.</p>
          <input id="alert-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" aria-describedby="alert-email-help" />
        </div>
        <fieldset className="field-group">
          <legend>Alert preference</legend>
          <label className="checkbox"><input type="checkbox" checked readOnly /> All approved public MMIPS email alerts</label>
          <p className="field-help">This broad preference avoids exact-location or sensitive targeting in Version 1.</p>
        </fieldset>
        <p id="alerts-privacy" className="notice">MMIPS stores subscriber information privately. Public responses are intentionally general and will not reveal whether an email was already subscribed.</p>
        {status === "error" && <div className="error-summary" role="alert"><strong>Request not completed.</strong><p>{message}</p></div>}
        <div id="alerts-status" ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="status-message">{status === "loading" ? "Sending the request…" : message}</div>
        <button type="submit" disabled={status === "loading"}>{status === "loading" ? "Sending request…" : "Send confirmation email"}</button>
      </form>
    </main>
  );
}
