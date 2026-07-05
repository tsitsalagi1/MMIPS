"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Submission = {
  id: string;
  created_at: string;
  review_status: string;
  full_name: string;
  age: number | null;
  status: string;
  tribal_affiliation: string | null;
  last_seen_date: string | null;
  last_seen_location: string;
  lead_agency: string | null;
  agency_case_number: string | null;
  namus_number: string | null;
  tip_contact: string | null;
  summary: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string | null;
  relationship: string;
  moderator_notes: string | null;
};

const statusLabels: Record<string, string> = {
  pending_review: "Pending review",
  needs_more_info: "Needs more info",
  approved: "Approved / published",
  rejected: "Rejected",
  hidden: "Hidden"
};

export default function AdminDashboard() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState("pending_review");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function refreshSession() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    setSessionToken(session?.access_token ?? null);
    setUserEmail(session?.user.email ?? null);
  }

  useEffect(() => {
    refreshSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => refreshSession());
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function loadSubmissions(token = sessionToken) {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/submissions?status=${encodeURIComponent(filter)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Could not load submissions.");
      setSubmissions(json.submissions || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionToken) loadSubmissions(sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, filter]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setSessionToken(data.session?.access_token ?? null);
    setUserEmail(data.user?.email ?? null);
    setPassword("");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSessionToken(null);
    setUserEmail(null);
    setSubmissions([]);
  }

  async function act(submission: Submission, action: "approve" | "needs_more_info" | "rejected") {
    if (!sessionToken) return;
    if (action === "approve") {
      const confirmed = window.confirm("Approve this submission and create a public case page? Only do this after consent, safety, and verification checks are complete.");
      if (!confirmed) return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ action, moderator_notes: notes[submission.id] || "" })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Action failed.");
      setMessage(json.slug ? `${json.message} /cases/${json.slug}` : json.message);
      await loadSubmissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionToken) {
    return (
      <main className="container section">
        <h1>Admin sign in</h1>
        <p className="lead">Only authorized MMIPS reviewers should access submissions. Public visitors cannot publish or view private submissions from this page.</p>
        <section className="card narrow-card">
          <form className="form" onSubmit={signIn}>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
            <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
          </form>
          {message && <p className="notice small-notice">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="container section">
      <div className="admin-topline">
        <div>
          <h1>Admin review dashboard</h1>
          <p className="lead">Review submitted cases before anything becomes public.</p>
          <p className="muted">Signed in as {userEmail}</p>
        </div>
        <button className="button secondary" onClick={signOut}>Sign out</button>
      </div>

      <section className="notice">
        <strong>Publishing rule:</strong> approve only after family/authorized submitter consent, no suspect accusations, no exact unsafe location, and an official/family-approved tip contact.
      </section>

      <section className="card admin-controls">
        <label>Queue filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="pending_review">Pending review</option>
            <option value="needs_more_info">Needs more info</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </label>
        <button onClick={() => loadSubmissions()} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </section>

      {message && <p className="notice small-notice">{message}</p>}

      <section className="admin-list">
        {submissions.length === 0 ? (
          <div className="card"><p>No submissions found for {statusLabels[filter] || filter}.</p></div>
        ) : submissions.map((submission) => (
          <article className="card admin-submission" key={submission.id}>
            <div className="case-header-line">
              <div>
                <h2>{submission.full_name}</h2>
                <p className="muted">{statusLabels[submission.review_status] || submission.review_status} · submitted {new Date(submission.created_at).toLocaleString()}</p>
              </div>
              <span className="badge badge-neutral">{submission.status}</span>
            </div>

            <div className="admin-detail-grid">
              <p><strong>Age:</strong> {submission.age ?? "Unknown"}</p>
              <p><strong>Tribe:</strong> {submission.tribal_affiliation || "Not provided"}</p>
              <p><strong>Last seen date:</strong> {submission.last_seen_date || "Not provided"}</p>
              <p><strong>Location:</strong> {submission.last_seen_location}</p>
              <p><strong>Lead agency:</strong> {submission.lead_agency || "Not provided"}</p>
              <p><strong>Agency case #:</strong> {submission.agency_case_number || "Not provided"}</p>
              <p><strong>NamUs #:</strong> {submission.namus_number || "Not provided"}</p>
              <p><strong>Tip contact:</strong> {submission.tip_contact || "Not provided"}</p>
            </div>

            <div className="admin-summary">
              <h3>Public summary draft</h3>
              <p>{submission.summary}</p>
            </div>

            <div className="admin-summary">
              <h3>Submitter</h3>
              <p>{submission.submitter_name} · {submission.relationship} · {submission.submitter_email}{submission.submitter_phone ? ` · ${submission.submitter_phone}` : ""}</p>
            </div>

            <label>Moderator notes
              <textarea value={notes[submission.id] ?? submission.moderator_notes ?? ""} onChange={(e) => setNotes({ ...notes, [submission.id]: e.target.value })} placeholder="Verification steps, family consent status, safety edits, reason for rejection, etc." />
            </label>

            <div className="button-row">
              <button type="button" onClick={() => act(submission, "approve")}>Approve + publish</button>
              <button type="button" className="button secondary" onClick={() => act(submission, "needs_more_info")}>Needs more info</button>
              <button type="button" className="button danger" onClick={() => act(submission, "rejected")}>Reject</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
