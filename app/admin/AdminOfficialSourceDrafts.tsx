"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type OfficialSource = {
  verification_type: string;
  source_label: string | null;
  source_url: string | null;
  notes: string | null;
  is_public: boolean;
};

type Draft = {
  id: string;
  slug: string;
  status: string;
  profile_type: string | null;
  review_status: string;
  public_summary: string;
  last_seen_date: string | null;
  last_seen_area_public: string | null;
  location_precision: string | null;
  lead_agency: string | null;
  official_tip_contact: string | null;
  persons?: { full_name?: string | null; age?: number | null; tribal_affiliation?: string | null } | { full_name?: string | null; age?: number | null; tribal_affiliation?: string | null }[] | null;
  case_verifications?: OfficialSource[] | null;
};

function personFor(draft: Draft) {
  return Array.isArray(draft.persons) ? draft.persons[0] : draft.persons;
}

function sourcesFor(draft: Draft) {
  return (draft.case_verifications || []).filter((source) => source.verification_type === "official_source" && source.is_public && source.source_url);
}

export default function AdminOfficialSourceDrafts() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function refreshSession() {
    const { data } = await supabase.auth.getSession();
    setSessionToken(data.session?.access_token ?? null);
  }

  useEffect(() => {
    void refreshSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void refreshSession(); });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function loadDrafts(token = sessionToken) {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/profiles?visibility=official_source_drafts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || "Could not load official-source drafts.");
      setDrafts(data.profiles || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load official-source drafts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionToken) void loadDrafts(sessionToken);
    else setDrafts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  async function publishDraft(draft: Draft) {
    if (!sessionToken || !confirmed[draft.id]) return;
    const moderatorNote = (notes[draft.id] || "").trim();
    if (moderatorNote.length < 10) {
      setMessage("Add a short moderator note describing what you checked before publishing.");
      return;
    }
    const person = personFor(draft);
    const ok = window.confirm(`Publish ${person?.full_name || draft.slug} to MMIPS after your official-source and safety review? This will make the profile public.`);
    if (!ok) return;

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/profiles/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ action: "publish_official_source", moderator_notes: moderatorNote })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || "Could not publish this official-source draft.");
      setMessage(`${data.message} Public profile: /profiles/${data.slug}`);
      setConfirmed((current) => ({ ...current, [draft.id]: false }));
      setNotes((current) => ({ ...current, [draft.id]: "" }));
      await loadDrafts(sessionToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish this official-source draft.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionToken) return null;

  return (
    <section className="container section correction-admin-section" aria-labelledby="official-source-drafts-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Human publication gate</p>
          <h2 id="official-source-drafts-heading">Official-source drafts awaiting review</h2>
          <p className="lead compact-lead">These records were prepared from public government case pages. They stay private until an authorized MMIPS moderator opens the source, compares the draft, confirms the safety boundary, and deliberately publishes it.</p>
        </div>
        <button type="button" className="button secondary" onClick={() => loadDrafts()} disabled={loading}>{loading ? "Refreshing..." : "Refresh drafts"}</button>
      </div>

      <div className="notice warning">
        <strong>Do not treat source publication as automatic MMIPS approval.</strong>
        <p>Open the official source and verify the name, status, public location, agency, and summary. Do not add exact private locations, allegations, investigative details, or unverified information.</p>
      </div>

      {message ? <p className="notice small-notice" role="status">{message}</p> : null}

      <div className="admin-list">
        {drafts.length === 0 ? <div className="card"><p>No official-source drafts are waiting for human review.</p></div> : drafts.map((draft) => {
          const person = personFor(draft);
          const sources = sourcesFor(draft);
          return (
            <article className="card admin-submission" key={draft.id}>
              <div className="case-header-line">
                <div>
                  <h3>{person?.full_name || draft.slug}</h3>
                  <p className="muted">{person?.tribal_affiliation || "Tribal affiliation not listed"} · {draft.status.replaceAll("_", " ")}</p>
                </div>
                <span className="badge badge-neutral">Pending human review</span>
              </div>

              <div className="admin-detail-grid">
                <p><strong>Public area:</strong> {draft.last_seen_area_public || "Not listed"}</p>
                <p><strong>Public date:</strong> {draft.last_seen_date || "Not listed"}</p>
                <p><strong>Lead agency:</strong> {draft.lead_agency || "Not listed"}</p>
                <p><strong>Location precision:</strong> {draft.location_precision || "Not listed"}</p>
              </div>

              <div className="admin-summary">
                <h3>Draft public summary</h3>
                <p>{draft.public_summary}</p>
                <p><strong>Official tip contact:</strong> {draft.official_tip_contact || "Not listed"}</p>
              </div>

              <div className="admin-summary">
                <h3>Official source{sources.length === 1 ? "" : "s"}</h3>
                {sources.map((source, index) => (
                  <p key={`${draft.id}-source-${index}`}>
                    <a href={source.source_url || "#"} target="_blank" rel="noreferrer noopener">{source.source_label || "Open official source"}</a>
                    {source.notes ? <span className="muted"> — {source.notes}</span> : null}
                  </p>
                ))}
              </div>

              <label className="checkbox photo-permission-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(confirmed[draft.id])}
                  onChange={(event) => setConfirmed((current) => ({ ...current, [draft.id]: event.target.checked }))}
                />
                <span>
                  <strong>I reviewed the official source and this MMIPS draft.</strong>
                  <span>I confirm the draft matches the public source, routes tips to an official contact, and does not expose exact/private location or non-public investigative information.</span>
                </span>
              </label>

              <label>Moderator review note
                <textarea
                  value={notes[draft.id] || ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [draft.id]: event.target.value }))}
                  placeholder="Example: Reviewed BIA OJS MMU public case page on 2026-08-08; name/status/location/agency match; no private coordinates or allegations included."
                />
              </label>

              <div className="button-row">
                <button type="button" onClick={() => publishDraft(draft)} disabled={loading || !confirmed[draft.id] || (notes[draft.id] || "").trim().length < 10}>Publish reviewed official-source profile</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
