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

type LinkedCase = {
  id?: string | null;
  slug?: string | null;
  status?: string | null;
  public_summary?: string | null;
  last_seen_area_public?: string | null;
  location_precision?: string | null;
  lead_agency?: string | null;
  agency_case_number?: string | null;
  namus_number?: string | null;
  ncic_status?: string | null;
  tribe_notified?: string | null;
  family_liaison?: string | null;
  official_tip_contact?: string | null;
  persons?: {
    id?: string | null;
    full_name?: string | null;
    age?: number | null;
    tribal_affiliation?: string | null;
  } | {
    id?: string | null;
    full_name?: string | null;
    age?: number | null;
    tribal_affiliation?: string | null;
  }[] | null;
};

type CorrectionRequest = {
  id: string;
  created_at: string;
  case_id: string | null;
  requester_name: string;
  requester_email: string;
  relationship: string;
  request_type: string;
  request_details: string;
  review_status: string;
  cases?: LinkedCase | null;
};

type CorrectionEditState = {
  full_name: string;
  age: string;
  tribal_affiliation: string;
  status: string;
  public_summary: string;
  last_seen_area_public: string;
  location_precision: string;
  lead_agency: string;
  agency_case_number: string;
  namus_number: string;
  official_tip_contact: string;
  ncic_status: string;
  tribe_notified: string;
  family_liaison: string;
};

const statusLabels: Record<string, string> = {
  pending_review: "Pending review",
  needs_more_info: "Needs more info",
  approved: "Approved / published",
  rejected: "Rejected",
  hidden: "Hidden",
  all: "All"
};

function linkedPerson(request: CorrectionRequest) {
  const persons = request.cases?.persons;
  return Array.isArray(persons) ? persons[0] : persons;
}

function caseNameForCorrection(request: CorrectionRequest) {
  const person = linkedPerson(request);
  return person?.full_name || request.cases?.slug || "Case reference not matched";
}

function blankIfNull(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function defaultCorrectionEdits(request: CorrectionRequest): CorrectionEditState {
  const person = linkedPerson(request);
  return {
    full_name: blankIfNull(person?.full_name),
    age: blankIfNull(person?.age),
    tribal_affiliation: blankIfNull(person?.tribal_affiliation),
    status: request.cases?.status || "missing",
    public_summary: blankIfNull(request.cases?.public_summary),
    last_seen_area_public: blankIfNull(request.cases?.last_seen_area_public),
    location_precision: request.cases?.location_precision || "city",
    lead_agency: blankIfNull(request.cases?.lead_agency),
    agency_case_number: blankIfNull(request.cases?.agency_case_number),
    namus_number: blankIfNull(request.cases?.namus_number),
    official_tip_contact: blankIfNull(request.cases?.official_tip_contact),
    ncic_status: blankIfNull(request.cases?.ncic_status),
    tribe_notified: blankIfNull(request.cases?.tribe_notified),
    family_liaison: blankIfNull(request.cases?.family_liaison)
  };
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [filter, setFilter] = useState("pending_review");
  const [correctionFilter, setCorrectionFilter] = useState("pending_review");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [correctionNotes, setCorrectionNotes] = useState<Record<string, string>>({});
  const [correctionEdits, setCorrectionEdits] = useState<Record<string, CorrectionEditState>>({});

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

  async function loadCorrectionRequests(token = sessionToken) {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/corrections?status=${encodeURIComponent(correctionFilter)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Could not load correction/removal requests.");
      setCorrectionRequests(json.correctionRequests || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load correction/removal requests.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAll(token = sessionToken) {
    await Promise.all([loadSubmissions(token), loadCorrectionRequests(token)]);
  }

  useEffect(() => {
    if (sessionToken) loadSubmissions(sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, filter]);

  useEffect(() => {
    if (sessionToken) loadCorrectionRequests(sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, correctionFilter]);

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
    setCorrectionRequests([]);
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
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  }

  function updateCorrectionEdit(id: string, key: keyof CorrectionEditState, value: string) {
    const request = correctionRequests.find((item) => item.id === id);
    const current = correctionEdits[id] || (request ? defaultCorrectionEdits(request) : defaultCorrectionEdits({ id, created_at: "", case_id: null, requester_name: "", requester_email: "", relationship: "", request_type: "", request_details: "", review_status: "" }));
    setCorrectionEdits({ ...correctionEdits, [id]: { ...current, [key]: value } });
  }

  async function actOnCorrection(request: CorrectionRequest, action: "approved" | "needs_more_info" | "rejected" | "hidden") {
    if (!sessionToken) return;
    const edit = correctionEdits[request.id] || defaultCorrectionEdits(request);

    if (action === "approved") {
      const confirmed = window.confirm("Mark this request applied and update the linked public case with the values shown in the Case updates panel? Confirm consent/safety review before applying.");
      if (!confirmed) return;
    }

    if (action === "hidden") {
      const confirmed = window.confirm("This marks the correction/removal request as hidden/reviewed. If a public case must be hidden, use location precision/status fields or update the case record after documenting why.");
      if (!confirmed) return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/corrections/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          action,
          moderator_notes: correctionNotes[request.id] || "",
          case_updates: {
            status: edit.status,
            public_summary: edit.public_summary,
            last_seen_area_public: edit.last_seen_area_public,
            location_precision: edit.location_precision,
            lead_agency: edit.lead_agency,
            agency_case_number: edit.agency_case_number,
            namus_number: edit.namus_number,
            official_tip_contact: edit.official_tip_contact,
            ncic_status: edit.ncic_status,
            tribe_notified: edit.tribe_notified,
            family_liaison: edit.family_liaison
          },
          person_updates: {
            full_name: edit.full_name,
            age: edit.age,
            tribal_affiliation: edit.tribal_affiliation
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Correction/removal action failed.");
      setMessage(json.message);
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Correction/removal action failed.");
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
          <p className="lead">Review submitted cases and correction/removal requests before anything changes publicly.</p>
          <p className="muted">Signed in as {userEmail}</p>
        </div>
        <button className="button secondary" onClick={signOut}>Sign out</button>
      </div>

      <section className="notice">
        <strong>Publishing rule:</strong> approve only after family/authorized submitter consent, no suspect accusations, no exact unsafe location, and an official/family-approved tip contact.
      </section>

      <section className="card admin-controls">
        <label>Submission queue filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="pending_review">Pending review</option>
            <option value="needs_more_info">Needs more info</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </label>
        <label>Correction/removal filter
          <select value={correctionFilter} onChange={(e) => setCorrectionFilter(e.target.value)}>
            <option value="pending_review">Pending review</option>
            <option value="needs_more_info">Needs more info</option>
            <option value="approved">Approved / applied</option>
            <option value="rejected">Rejected</option>
            <option value="hidden">Hidden</option>
            <option value="all">All</option>
          </select>
        </label>
        <button onClick={() => loadAll()} disabled={loading}>{loading ? "Loading..." : "Refresh all"}</button>
      </section>

      {message && <p className="notice small-notice">{message}</p>}

      <section className="admin-list">
        <h2>Case submissions</h2>
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

      <section className="admin-list correction-admin-section">
        <h2>Correction/removal requests</h2>
        {correctionRequests.length === 0 ? (
          <div className="card"><p>No correction/removal requests found for {statusLabels[correctionFilter] || correctionFilter}.</p></div>
        ) : correctionRequests.map((request) => {
          const edit = correctionEdits[request.id] || defaultCorrectionEdits(request);
          const hasLinkedCase = Boolean(request.case_id && request.cases?.slug);

          return (
            <article className="card admin-submission" key={request.id}>
              <div className="case-header-line">
                <div>
                  <h2>{request.request_type.replaceAll("_", " ")}</h2>
                  <p className="muted">{statusLabels[request.review_status] || request.review_status} · submitted {new Date(request.created_at).toLocaleString()}</p>
                </div>
                <span className="badge badge-neutral">correction/removal</span>
              </div>

              <div className="admin-detail-grid">
                <p><strong>Case:</strong> {caseNameForCorrection(request)}</p>
                <p><strong>Case slug:</strong> {request.cases?.slug || "Not matched"}</p>
                <p><strong>Requester:</strong> {request.requester_name}</p>
                <p><strong>Email:</strong> {request.requester_email}</p>
                <p><strong>Relationship:</strong> {request.relationship}</p>
                <p><strong>Request type:</strong> {request.request_type}</p>
              </div>

              <div className="admin-summary">
                <h3>Request details</h3>
                <pre className="pre-wrap">{request.request_details}</pre>
              </div>

              <section className="card nested-admin-card">
                <h3>Case updates to apply</h3>
                <p className="muted">Edit only the fields that should change. “Mark applied” will update the linked public case and then mark this correction/removal request approved/applied.</p>
                {!hasLinkedCase && <p className="notice small-notice">This request is not linked to a public case slug yet. Marking applied will only change the request status until it is matched to a case.</p>}

                <div className="admin-detail-grid edit-grid">
                  <label>Public case title / person name
                    <input value={edit.full_name} onChange={(e) => updateCorrectionEdit(request.id, "full_name", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Age
                    <input value={edit.age} onChange={(e) => updateCorrectionEdit(request.id, "age", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Tribal affiliation
                    <input value={edit.tribal_affiliation} onChange={(e) => updateCorrectionEdit(request.id, "tribal_affiliation", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Case status
                    <select value={edit.status} onChange={(e) => updateCorrectionEdit(request.id, "status", e.target.value)} disabled={!hasLinkedCase}>
                      <option value="missing">Missing</option>
                      <option value="murdered_unsolved">Murdered / unsolved</option>
                      <option value="unidentified">Unidentified</option>
                      <option value="resolved">Resolved</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </label>
                  <label>Public last-seen/location text
                    <input value={edit.last_seen_area_public} onChange={(e) => updateCorrectionEdit(request.id, "last_seen_area_public", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Location precision
                    <select value={edit.location_precision} onChange={(e) => updateCorrectionEdit(request.id, "location_precision", e.target.value)} disabled={!hasLinkedCase}>
                      <option value="city">City</option>
                      <option value="county">County</option>
                      <option value="approximate">Approximate</option>
                      <option value="hidden">Hidden</option>
                      <option value="exact_private">Exact/private - do not display exact public address</option>
                    </select>
                  </label>
                  <label>Lead agency
                    <input value={edit.lead_agency} onChange={(e) => updateCorrectionEdit(request.id, "lead_agency", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Agency case #
                    <input value={edit.agency_case_number} onChange={(e) => updateCorrectionEdit(request.id, "agency_case_number", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>NamUs #
                    <input value={edit.namus_number} onChange={(e) => updateCorrectionEdit(request.id, "namus_number", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Official tip contact
                    <input value={edit.official_tip_contact} onChange={(e) => updateCorrectionEdit(request.id, "official_tip_contact", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>NCIC status
                    <input value={edit.ncic_status} onChange={(e) => updateCorrectionEdit(request.id, "ncic_status", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Tribe notified
                    <input value={edit.tribe_notified} onChange={(e) => updateCorrectionEdit(request.id, "tribe_notified", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Family liaison
                    <input value={edit.family_liaison} onChange={(e) => updateCorrectionEdit(request.id, "family_liaison", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                </div>

                <label>Public summary
                  <textarea value={edit.public_summary} onChange={(e) => updateCorrectionEdit(request.id, "public_summary", e.target.value)} disabled={!hasLinkedCase} />
                </label>
              </section>

              <label>Moderator notes / action taken
                <textarea value={correctionNotes[request.id] ?? ""} onChange={(e) => setCorrectionNotes({ ...correctionNotes, [request.id]: e.target.value })} placeholder="What was checked, what was changed, who was contacted, reason for action, etc." />
              </label>

              <div className="button-row">
                <button type="button" onClick={() => actOnCorrection(request, "approved")}>Mark applied + update case</button>
                <button type="button" className="button secondary" onClick={() => actOnCorrection(request, "needs_more_info")}>Needs more info</button>
                <button type="button" className="button danger" onClick={() => actOnCorrection(request, "rejected")}>Reject</button>
                <button type="button" className="button danger" onClick={() => actOnCorrection(request, "hidden")}>Mark hidden/reviewed</button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
