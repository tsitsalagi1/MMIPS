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

const OFFICIAL_SOURCE_PUBLICATION_LOCKED = true;

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
      const response = await fetch("/api/admin/profiles?visibility=official_source_drafts", { headers: { Authorization: `Bearer ${token}` } });
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

  if (!sessionToken) return null;

  return (
    <section className="container section correction-admin-section" aria-labelledby="official-source-drafts-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Human publication gate</p>
          <h2 id="official-source-drafts-heading">Official-source drafts held for later review</h2>
          <p className="lead compact-lead">These government-source records remain private while MMIPS completes a synthetic launch rehearsal. They are retained only as drafts for future human review and are not being used as test cases.</p>
        </div>
        <button type="button" className="button secondary" onClick={() => loadDrafts()} disabled={loading}>{loading ? "Refreshing..." : "Refresh drafts"}</button>
      </div>

      <div className="notice warning" role="status">
        <strong>Real-case publication is locked during testing.</strong>
        <p>Use only records labeled “MMIPS TEST PERSON — NOT A REAL PERSON” for launch rehearsal. Official-source publication will be unlocked only after the synthetic end-to-end test passes and a separate launch decision is made.</p>
      </div>

      {message ? <p className="notice small-notice" role="status">{message}</p> : null}

      <div className="admin-list">
        {drafts.length === 0 ? <div className="card"><p>No official-source drafts are waiting for future review.</p></div> : drafts.map((draft) => {
          const person = personFor(draft);
          const sources = sourcesFor(draft);
          return (
            <article className="card admin-submission" key={draft.id}>
              <div className="case-header-line">
                <div>
                  <h3>{person?.full_name || draft.slug}</h3>
                  <p className="muted">{person?.tribal_affiliation || "Tribal affiliation not listed"} · {draft.status.replaceAll("_", " ")}</p>
                </div>
                <span className="badge badge-neutral">Private — publication locked</span>
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

              <div className="notice small-notice">
                <strong>Publication disabled.</strong>
                <p>This control is intentionally unavailable during the synthetic rehearsal. The server also rejects direct publication requests while this lock is active.</p>
              </div>

              <button type="button" disabled={OFFICIAL_SOURCE_PUBLICATION_LOCKED}>Publish reviewed official-source profile</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
