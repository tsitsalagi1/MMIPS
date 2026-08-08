"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type AdminProfile = {
  id: string;
  slug: string;
  status: string;
  profile_type: string | null;
  urgency_level: string | null;
  published_at: string | null;
  persons?:
    | { full_name?: string | null; tribal_affiliation?: string | null }
    | { full_name?: string | null; tribal_affiliation?: string | null }[]
    | null;
};

type Preview = {
  profile: {
    id: string;
    slug: string;
    name: string;
    urgency_level: string;
    public_map_label: string;
    official_tip_contact: string;
    lead_agency: string | null;
    public_profile_url: string;
  };
  matchedCount: number;
  canSend: boolean;
};

function personFor(profile: AdminProfile) {
  return Array.isArray(profile.persons) ? profile.persons[0] : profile.persons;
}

export default function AdminUrgentAlerts() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSessionToken(data.session?.access_token ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setSessionToken(session?.access_token ?? null)
    );
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionToken || query.trim().length < 2) return;
    setLoading(true);
    setMessage("");
    setPreview(null);
    try {
      const params = new URLSearchParams({ q: query.trim(), visibility: "published" });
      const response = await fetch(`/api/admin/profiles?${params.toString()}`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Could not search public profiles.");
      setProfiles(data.profiles || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not search public profiles.");
    } finally {
      setLoading(false);
    }
  }

  async function choose(profile: AdminProfile) {
    if (!sessionToken) return;
    setSelected(profile);
    setPreview(null);
    setConfirmation("");
    setMessage("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ caseId: profile.id });
      const response = await fetch(`/api/admin/alerts/urgent?${params.toString()}`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Could not preview the alert audience.");
      setPreview(data as Preview);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not preview the alert audience.");
    } finally {
      setLoading(false);
    }
  }

  async function sendAlert() {
    if (!sessionToken || !selected || !preview) return;
    if (confirmation.trim() !== "SEND URGENT ALERT") {
      setMessage("Type SEND URGENT ALERT exactly before sending.");
      return;
    }
    const ok = window.confirm(
      `Send this approved urgent public alert to ${preview.matchedCount} matched confirmed subscriber${
        preview.matchedCount === 1 ? "" : "s"
      }?`
    );
    if (!ok) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/alerts/urgent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ caseId: selected.id, confirmation: confirmation.trim() })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Could not send the urgent alert.");
      setMessage(data.message);
      setConfirmation("");
      await choose(selected);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the urgent alert.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionToken) return null;

  return (
    <section className="container section correction-admin-section" aria-labelledby="urgent-alert-admin-heading">
      <h2 id="urgent-alert-admin-heading">Urgent community alert dispatch</h2>
      <p className="lead">
        Send a geographically targeted urgent email only after the public profile, official tip/reporting
        contact, and approximate public map point are approved. Subscriber ZIP/radius preferences remain private.
      </p>

      <section className="notice warning">
        <strong>Human approval is required.</strong>
        <p>
          A raw submission never sends a public alert automatically. The profile must be published, marked
          <em> Urgent public awareness</em>, have an approved approximate public map point, include an official
          tip/reporting contact, and pass this final moderator confirmation.
        </p>
        <p>
          Every urgent alert directs case information to the official contact — never to MMIPS — and links back
          to the approved public profile.
        </p>
        <p>During the synthetic launch rehearsal, the server blocks real-person alert sends even if this control is used.</p>
      </section>

      <form className="card admin-controls" onSubmit={search}>
        <label>
          Find a published profile
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, slug, Tribe, agency, or public area"
            minLength={2}
          />
        </label>
        <button type="submit" disabled={loading || query.trim().length < 2}>
          {loading ? "Searching…" : "Search profiles"}
        </button>
      </form>

      {profiles.length ? (
        <div className="admin-list">
          {profiles.map((profile) => {
            const person = personFor(profile);
            return (
              <article className="card" key={profile.id}>
                <h3>{person?.full_name || profile.slug}</h3>
                <p className="muted">
                  {person?.tribal_affiliation || "Tribal affiliation not listed"} · {profile.status} ·{" "}
                  {profile.urgency_level || "standard"}
                </p>
                <button type="button" className="secondary" onClick={() => choose(profile)} disabled={loading}>
                  Preview urgent audience
                </button>
              </article>
            );
          })}
        </div>
      ) : null}

      {selected && preview ? (
        <section className="card stack">
          <p className="eyebrow">Final urgent alert review</p>
          <h3>{preview.profile.name}</h3>
          <p>
            <strong>Approved public-awareness area:</strong> {preview.profile.public_map_label}
          </p>
          <p>
            <strong>Profile link in alert:</strong>{" "}
            <a href={preview.profile.public_profile_url} target="_blank" rel="noreferrer">
              {preview.profile.public_profile_url}
            </a>
          </p>
          <p>
            <strong>Tips/reporting contact:</strong>{" "}
            {preview.profile.lead_agency ? `${preview.profile.lead_agency}: ` : ""}
            {preview.profile.official_tip_contact}
          </p>
          <p>
            <strong>Confirmed subscribers matched:</strong> {preview.matchedCount}
          </p>
          <p>
            <strong>Urgency:</strong> {preview.profile.urgency_level}
          </p>
          {!preview.canSend ? (
            <p className="notice warning">
              This profile is not currently eligible. It must be approved, published, marked Urgent public awareness,
              and include an official tip/reporting contact.
            </p>
          ) : null}
          <label>
            Type <strong>SEND URGENT ALERT</strong> to confirm
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
          </label>
          <button
            type="button"
            onClick={sendAlert}
            disabled={loading || !preview.canSend || confirmation.trim() !== "SEND URGENT ALERT"}
          >
            {loading
              ? "Processing…"
              : `Send to ${preview.matchedCount} matched subscriber${preview.matchedCount === 1 ? "" : "s"}`}
          </button>
        </section>
      ) : null}

      {message ? (
        <p className="status-message" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}
