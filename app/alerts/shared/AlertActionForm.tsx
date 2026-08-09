"use client";
import { useState } from "react";

export default function AlertActionForm({ action, token, title, button, description }: { action: "confirm" | "unsubscribe"; token: string; title: string; button: string; description: string }) {
  const [done, setDone] = useState(false), [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await fetch(`/api/alerts/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
    } finally {
      setDone(true);
      setBusy(false);
    }
  }

  return <main id="main-content" className="alerts-page alert-action-page">
    <section className="card stack alert-action-card">
      <h1>{title}</h1>
      <p>{description}</p>
      {done
        ? <p role="status" tabIndex={-1}>Your request was processed. This message is intentionally general to protect subscriber privacy.</p>
        : <button type="button" onClick={submit} disabled={busy || !token}>{busy ? "Processing…" : button}</button>}
    </section>
  </main>;
}
