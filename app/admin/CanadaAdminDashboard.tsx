"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type CanadaSubmission = {
  id: string;
  created_at: string;
  public_reference: string | null;
  review_status: string;
  full_name: string;
  age: number | null;
  status: string;
  last_seen_date: string | null;
  last_seen_locality: string;
  last_seen_province_territory: string;
  last_seen_postal_code: string | null;
  lead_police_service: string | null;
  police_file_number: string | null;
  official_tip_contact: string | null;
  public_summary_proposed: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string | null;
  relationship: string;
  authority_basis: string | null;
  publication_requested: boolean;
  map_requested: boolean;
  last_seen_area_public_proposed: string | null;
  public_latitude_proposed: number | null;
  public_longitude_proposed: number | null;
  moderator_notes: string | null;
  synthetic: boolean;
};

type EditState = {
  slug: string;
  publicSummary: string;
  publicArea: string;
  publicLatitude: string;
  publicLongitude: string;
  publishMap: boolean;
  reason: string;
};

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

function initialEdit(item: CanadaSubmission): EditState {
  return {
    slug: slugify(item.full_name),
    publicSummary: item.public_summary_proposed || "",
    publicArea: item.last_seen_area_public_proposed || `${item.last_seen_locality}, ${item.last_seen_province_territory}`,
    publicLatitude: item.public_latitude_proposed == null ? "" : String(item.public_latitude_proposed),
    publicLongitude: item.public_longitude_proposed == null ? "" : String(item.public_longitude_proposed),
    publishMap: item.map_requested !== false,
    reason: item.moderator_notes || ""
  };
}

export default function CanadaAdminDashboard() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState("pending_review");
  const [items, setItems] = useState<CanadaSubmission[]>([]);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshSession() {
    const { data } = await supabase.auth.getSession();
    setSessionToken(data.session?.access_token ?? null);
    setUserEmail(data.session?.user.email ?? null);
  }

  useEffect(() => {
    void refreshSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void refreshSession());
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function load(token = sessionToken) {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/canada/submissions?status=${encodeURIComponent(status)}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.message || "Could not load Canadian submissions.");
      const submissions = (json.submissions || []) as CanadaSubmission[];
      setItems(submissions);
      setEdits((current) => {
        const next = { ...current };
        for (const item of submissions) if (!next[item.id]) next[item.id] = initialEdit(item);
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load Canadian submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (sessionToken) void load(sessionToken); }, [sessionToken, status]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMessage(error.message);
    setSessionToken(data.session?.access_token ?? null);
    setUserEmail(data.user?.email ?? null);
    setPassword("");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSessionToken(null);
    setUserEmail(null);
    setItems([]);
  }

  function setEdit(id: string, patch: Partial<EditState>) {
    setEdits((current) => ({ ...current, [id]: { ...(current[id] || initialEdit(items.find((item) => item.id === id)!)), ...patch } }));
  }

  async function act(item: CanadaSubmission, action: "approve" | "needs_more_info" | "rejected") {
    if (!sessionToken) return;
    const edit = edits[item.id] || initialEdit(item);
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/canada/submissions/${item.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(action === "approve" ? {
          action,
          reason: edit.reason,
          slug: edit.slug,
          publicSummary: edit.publicSummary,
          publicArea: edit.publicArea,
          publicLatitude: edit.publicLatitude,
          publicLongitude: edit.publicLongitude,
          publishMap: edit.publishMap
        } : { action, reason: edit.reason })
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.message || "Moderation action failed.");
      setMessage(action === "approve" ? "Submission approved and released through the Canadian publication gates." : `Submission moved to ${action.replaceAll("_", " ")}.`);
      await load(sessionToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Moderation action failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionToken) {
    return (
      <main className="container section plain-language-page">
        <p className="eyebrow">MMIPS Canada administration</p>
        <h1>Moderator sign in</h1>
        <p className="lead">Canadian moderation uses the separate Canadian Supabase Auth system. Password sign-in is only the first step; protected actions require authenticator MFA.</p>
        <form className="card form" onSubmit={signIn}>
          <label>Admin email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          {message ? <p role="status">{message}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className="container section plain-language-page">
      <div className="button-row" style={{ justifyContent: "space-between" }}>
        <div><p className="eyebrow">MMIPS Canada administration</p><h1>Submission review</h1><p className="muted">Signed in as {userEmail}</p></div>
        <button type="button" className="secondary" onClick={signOut}>Sign out</button>
      </div>
      <div className="notice warning"><strong>Private review area.</strong><p>Do not copy private family contact information into public fields. Public profile and map release are separate decisions. Exact or sensitive locations should not be published.</p></div>
      <div className="card">
        <label>Review queue<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending_review">Pending review</option><option value="needs_more_info">Needs more information</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="hidden">Hidden</option><option value="all">All</option></select></label>
        <button type="button" className="secondary" onClick={() => load()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
        {message ? <p role="status">{message}</p> : null}
      </div>

      {items.map((item) => {
        const edit = edits[item.id] || initialEdit(item);
        return (
          <article key={item.id} className="card" style={{ marginTop: 20 }}>
            {item.synthetic ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST SUBMISSION</strong> — fictional rehearsal data only.</p> : null}
            <h2>{item.full_name}</h2>
            <p><strong>Reference:</strong> {item.public_reference || item.id}</p>
            <p><strong>Status:</strong> {item.status} · <strong>Last seen:</strong> {item.last_seen_locality}, {item.last_seen_province_territory}{item.last_seen_date ? ` · ${item.last_seen_date}` : ""}</p>
            <p><strong>Police service:</strong> {item.lead_police_service || "Not provided"}{item.police_file_number ? ` · File ${item.police_file_number}` : ""}</p>
            <details><summary>Private submitter information</summary><p>{item.submitter_name} · {item.relationship} · {item.submitter_email}{item.submitter_phone ? ` · ${item.submitter_phone}` : ""}</p><p><strong>Authority/permission basis:</strong> {item.authority_basis || "Not provided"}</p></details>

            <div className="form" style={{ marginTop: 16 }}>
              <label>Public slug<input value={edit.slug} onChange={(event) => setEdit(item.id, { slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></label>
              <label>Reviewed public summary<textarea value={edit.publicSummary} onChange={(event) => setEdit(item.id, { publicSummary: event.target.value })} /></label>
              <label>Approved public area<input value={edit.publicArea} onChange={(event) => setEdit(item.id, { publicArea: event.target.value })} /></label>
              <div className="check-grid"><label>Public latitude<input inputMode="decimal" value={edit.publicLatitude} onChange={(event) => setEdit(item.id, { publicLatitude: event.target.value })} /></label><label>Public longitude<input inputMode="decimal" value={edit.publicLongitude} onChange={(event) => setEdit(item.id, { publicLongitude: event.target.value })} /></label></div>
              <label className="checkbox"><input type="checkbox" checked={edit.publishMap} onChange={(event) => setEdit(item.id, { publishMap: event.target.checked })} /> Approve this approximate public area for the map</label>
              <label>Moderator notes / reason<textarea value={edit.reason} onChange={(event) => setEdit(item.id, { reason: event.target.value })} /></label>
              <div className="button-row"><button type="button" onClick={() => act(item, "approve")} disabled={loading}>Approve profile{edit.publishMap ? " + map" : ""}</button><button type="button" className="secondary" onClick={() => act(item, "needs_more_info")} disabled={loading}>Needs more information</button><button type="button" className="secondary" onClick={() => act(item, "rejected")} disabled={loading}>Reject</button></div>
            </div>
          </article>
        );
      })}
      {!loading && !items.length ? <div className="card" style={{ marginTop: 20 }}><p>No submissions in this queue.</p></div> : null}
    </main>
  );
}
