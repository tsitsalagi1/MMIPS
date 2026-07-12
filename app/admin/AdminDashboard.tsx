"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type SubmissionPhoto = {
  id: string;
  submission_id: string;
  signed_url?: string | null;
  storage_path: string;
  original_name: string | null;
  content_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  caption: string | null;
  photo_type: string | null;
  use_on_profile: boolean | null;
  use_on_flyer: boolean | null;
  is_main: boolean | null;
  sort_order: number | null;
};

type Submission = {
  id: string;
  created_at: string;
  review_status: string;
  full_name: string;
  age: number | null;
  status: string;
  profile_type: string | null;
  urgency_level: string | null;
  tribal_affiliation: string | null;
  last_seen_date: string | null;
  last_seen_location: string;
  last_known_datetime: string | null;
  last_known_time_zone: string | null;
  notification_area_requested: string | null;
  likely_travel_mode: string | null;
  possible_direction: string | null;
  vehicle_description: string | null;
  official_info_pending: boolean | null;
  official_report_contacted: boolean | null;
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
  photo_storage_path: string | null;
  photo_original_name: string | null;
  photo_content_type: string | null;
  photo_size: number | null;
  photo_alt_text: string | null;
  photo_signed_url?: string | null;
  photos?: SubmissionPhoto[];
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



type PublicProfile = {
  id: string;
  slug: string;
  status: string;
  profile_type: string | null;
  urgency_level: string | null;
  review_status: string;
  public_summary: string;
  last_seen_area_public: string | null;
  notification_area_requested: string | null;
  likely_travel_mode: string | null;
  possible_direction: string | null;
  vehicle_description: string | null;
  official_info_pending: boolean | null;
  location_precision: string | null;
  lead_agency: string | null;
  agency_case_number: string | null;
  namus_number: string | null;
  official_tip_contact: string | null;
  ncic_status: string | null;
  tribe_notified: string | null;
  family_liaison: string | null;
  last_public_update: string | null;
  published_at: string | null;
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

type PublicProfileEditState = {
  full_name: string;
  age: string;
  tribal_affiliation: string;
  status: string;
  profile_type: string;
  urgency_level: string;
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
  notification_area_requested: string;
  likely_travel_mode: string;
  possible_direction: string;
  vehicle_description: string;
  official_info_pending: boolean;
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

const profileTypeLabels: Record<string, string> = {
  urgent_missing: "Urgent public awareness",
  missing: "Missing public profile",
  murdered_info_needed: "Remembering / information needed",
  unidentified: "Unidentified public profile"
};

function linkedPerson(request: CorrectionRequest) {
  const persons = request.cases?.persons;
  return Array.isArray(persons) ? persons[0] : persons;
}

function profilePerson(profile: PublicProfile) {
  const persons = profile.persons;
  return Array.isArray(persons) ? persons[0] : persons;
}

function caseNameForCorrection(request: CorrectionRequest) {
  const person = linkedPerson(request);
  return person?.full_name || request.cases?.slug || "Profile reference not matched";
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

function defaultPublicProfileEdits(profile: PublicProfile): PublicProfileEditState {
  const person = profilePerson(profile);
  return {
    full_name: blankIfNull(person?.full_name),
    age: blankIfNull(person?.age),
    tribal_affiliation: blankIfNull(person?.tribal_affiliation),
    status: profile.status || "missing",
    profile_type: profile.profile_type || (profile.status === "murdered_unsolved" ? "murdered_info_needed" : profile.status === "unidentified" ? "unidentified" : profile.status === "resolved" ? "located" : "missing"),
    urgency_level: profile.urgency_level || "standard",
    public_summary: blankIfNull(profile.public_summary),
    last_seen_area_public: blankIfNull(profile.last_seen_area_public),
    location_precision: profile.location_precision || "city",
    lead_agency: blankIfNull(profile.lead_agency),
    agency_case_number: blankIfNull(profile.agency_case_number),
    namus_number: blankIfNull(profile.namus_number),
    official_tip_contact: blankIfNull(profile.official_tip_contact),
    ncic_status: blankIfNull(profile.ncic_status),
    tribe_notified: blankIfNull(profile.tribe_notified),
    family_liaison: blankIfNull(profile.family_liaison),
    notification_area_requested: blankIfNull(profile.notification_area_requested),
    likely_travel_mode: blankIfNull(profile.likely_travel_mode),
    possible_direction: blankIfNull(profile.possible_direction),
    vehicle_description: blankIfNull(profile.vehicle_description),
    official_info_pending: profile.official_info_pending === true
  };
}

function transitionEdits(current: PublicProfileEditState, transition: "urgent_to_missing" | "missing_to_murdered" | "located") {
  if (transition === "urgent_to_missing") {
    return { ...current, status: "missing", profile_type: "missing", urgency_level: "standard", official_info_pending: current.official_info_pending };
  }
  if (transition === "missing_to_murdered") {
    return { ...current, status: "murdered_unsolved", profile_type: "murdered_info_needed", urgency_level: "renewed_visibility", official_info_pending: current.official_info_pending };
  }
  return { ...current, status: "resolved", profile_type: "located", urgency_level: "status_update", official_info_pending: false };
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<PublicProfile[]>([]);
  const [filter, setFilter] = useState("pending_review");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [correctionFilter, setCorrectionFilter] = useState("pending_review");
  const [correctionSearch, setCorrectionSearch] = useState("");
  const [profileVisibilityFilter, setProfileVisibilityFilter] = useState("published");
  const [profileSearch, setProfileSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [correctionNotes, setCorrectionNotes] = useState<Record<string, string>>({});
  const [correctionEdits, setCorrectionEdits] = useState<Record<string, CorrectionEditState>>({});
  const [profileNotes, setProfileNotes] = useState<Record<string, string>>({});
  const [profileEdits, setProfileEdits] = useState<Record<string, PublicProfileEditState>>({});

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
      const params = new URLSearchParams({ status: filter });
      if (submissionSearch.trim()) params.set("q", submissionSearch.trim());
      const res = await fetch(`/api/admin/submissions?${params.toString()}`, {
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
      const params = new URLSearchParams({ status: correctionFilter });
      if (correctionSearch.trim()) params.set("q", correctionSearch.trim());
      const res = await fetch(`/api/admin/corrections?${params.toString()}`, {
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

  async function loadPublicProfiles(token = sessionToken) {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ visibility: profileVisibilityFilter });
      if (profileSearch.trim()) params.set("q", profileSearch.trim());
      const res = await fetch(`/api/admin/profiles?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Could not load public profiles.");
      setPublicProfiles(json.profiles || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load public profiles.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAll(token = sessionToken) {
    await Promise.all([loadSubmissions(token), loadCorrectionRequests(token), loadPublicProfiles(token)]);
  }

  useEffect(() => {
    if (sessionToken) loadSubmissions(sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, filter, submissionSearch]);

  useEffect(() => {
    if (sessionToken) loadCorrectionRequests(sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, correctionFilter, correctionSearch]);


  useEffect(() => {
    if (sessionToken) loadPublicProfiles(sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, profileVisibilityFilter, profileSearch]);

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
    setPublicProfiles([]);
  }

  async function act(submission: Submission, action: "approve" | "needs_more_info" | "rejected") {
    if (!sessionToken) return;
    if (action === "approve") {
      const confirmed = window.confirm("Approve this submission and create a public profile? Only do this after consent, safety, and verification checks are complete.");
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
      setMessage(json.slug ? `${json.message} /profiles/${json.slug}` : json.message);
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


  function updateProfileEdit(id: string, key: keyof PublicProfileEditState, value: string | boolean) {
    const profile = publicProfiles.find((item) => item.id === id);
    if (!profile) return;
    const current = profileEdits[id] || defaultPublicProfileEdits(profile);
    setProfileEdits({ ...profileEdits, [id]: { ...current, [key]: value } });
  }

  function applyQuickTransition(profile: PublicProfile, transition: "urgent_to_missing" | "missing_to_murdered" | "located") {
    const current = profileEdits[profile.id] || defaultPublicProfileEdits(profile);
    setProfileEdits({ ...profileEdits, [profile.id]: transitionEdits(current, transition) });
  }

  async function savePublicProfile(profile: PublicProfile) {
    if (!sessionToken) return;
    const edit = profileEdits[profile.id] || defaultPublicProfileEdits(profile);
    const confirmed = window.confirm("Update this public profile status/type? This will change the live profile, flyer, JPEG export, map category, and QR-linked page. Document the reason in moderator notes.");
    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          moderator_notes: profileNotes[profile.id] || "",
          case_updates: {
            status: edit.status,
            profile_type: edit.profile_type,
            urgency_level: edit.urgency_level,
            public_summary: edit.public_summary,
            last_seen_area_public: edit.last_seen_area_public,
            location_precision: edit.location_precision,
            lead_agency: edit.lead_agency,
            agency_case_number: edit.agency_case_number,
            namus_number: edit.namus_number,
            official_tip_contact: edit.official_tip_contact,
            ncic_status: edit.ncic_status,
            tribe_notified: edit.tribe_notified,
            family_liaison: edit.family_liaison,
            notification_area_requested: edit.notification_area_requested,
            likely_travel_mode: edit.likely_travel_mode,
            possible_direction: edit.possible_direction,
            vehicle_description: edit.vehicle_description,
            official_info_pending: edit.official_info_pending
          },
          person_updates: {
            full_name: edit.full_name,
            age: edit.age,
            tribal_affiliation: edit.tribal_affiliation
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Profile update failed.");
      setMessage(json.slug ? `${json.message} /profiles/${json.slug}` : json.message);
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setLoading(false);
    }
  }

  async function actOnCorrection(request: CorrectionRequest, action: "approved" | "needs_more_info" | "rejected" | "hidden" | "remove_public_profile") {
    if (!sessionToken) return;
    const edit = correctionEdits[request.id] || defaultCorrectionEdits(request);

    if (action === "approved") {
      const confirmed = window.confirm("Mark this request applied and update the linked public profile with the values shown in the Public profile updates panel? Confirm consent/safety review before applying.");
      if (!confirmed) return;
    }

    if (action === "remove_public_profile") {
      const confirmed = window.confirm("Remove the linked public profile from public view? Use this only after confirming the requester is authorized and documenting the reason in moderator notes.");
      if (!confirmed) return;
    }

    if (action === "hidden") {
      const confirmed = window.confirm("Close this correction/removal request without changing the public profile? Document the reason in moderator notes.");
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
          <p className="lead">Review submitted information and correction/removal requests before anything changes publicly.</p>
          <p className="muted">Signed in as {userEmail}</p>
        </div>
        <button className="button secondary" onClick={signOut}>Sign out</button>
      </div>

      <section className="notice">
        <strong>Publishing rule:</strong> approve only after family/authorized submitter consent, no suspect accusations, no exact unsafe location, and an official/family-approved tip contact.
      </section>

      <section className="card admin-controls admin-search-controls">
        <label>Submission queue filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="pending_review">Pending review</option>
            <option value="needs_more_info">Needs more info</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </label>
        <label>Search submissions
          <input
            type="search"
            value={submissionSearch}
            onChange={(e) => setSubmissionSearch(e.target.value)}
            placeholder="Name, submitter, location, agency, NamUs..."
          />
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
        <label>Search correction/removal
          <input
            type="search"
            value={correctionSearch}
            onChange={(e) => setCorrectionSearch(e.target.value)}
            placeholder="Requester, email, request details..."
          />
        </label>
        <label>Public profile editor
          <select value={profileVisibilityFilter} onChange={(e) => setProfileVisibilityFilter(e.target.value)}>
            <option value="published">Published profiles</option>
            <option value="hidden">Hidden profiles</option>
            <option value="all">All profiles</option>
          </select>
        </label>
        <label>Quick lookup public profiles
          <input
            type="search"
            value={profileSearch}
            onChange={(e) => setProfileSearch(e.target.value)}
            placeholder="Name, slug, city, Tribe, agency, report #, NamUs..."
          />
        </label>
        <button onClick={() => loadAll()} disabled={loading}>{loading ? "Loading..." : "Refresh all"}</button>
      </section>

      {message && <p className="notice small-notice">{message}</p>}

      <section className="admin-list">
        <h2>Submissions for review</h2>
        <p className="muted small-text">Showing {submissions.length} submission{submissions.length === 1 ? "" : "s"}{submissionSearch.trim() ? ` matching “${submissionSearch.trim()}”` : ""}.</p>
        {submissions.length === 0 ? (
          <div className="card"><p>No submissions found for {statusLabels[filter] || filter}.</p></div>
        ) : submissions.map((submission) => (
          <article className="card admin-submission" key={submission.id}>
            <div className="case-header-line">
              <div>
                <h2>{submission.full_name}</h2>
                <p className="muted">{statusLabels[submission.review_status] || submission.review_status} · submitted {new Date(submission.created_at).toLocaleString()}</p>
              </div>
              <div className="badge-stack"><span className={`badge badge-profile-${submission.profile_type || "missing"}`}>{profileTypeLabels[submission.profile_type || "missing"] || submission.status}</span><span className="badge badge-neutral">{submission.status}</span></div>
            </div>

            <div className="admin-detail-grid">
              <p><strong>Age:</strong> {submission.age ?? "Unknown"}</p>
              <p><strong>Tribe:</strong> {submission.tribal_affiliation || "Not provided"}</p>
              <p><strong>Last seen/public date:</strong> {submission.last_seen_date || "Not provided"}</p>
              <p><strong>Public location:</strong> {submission.last_seen_location}</p>
              <p><strong>Urgency level:</strong> {submission.urgency_level || "standard"}</p>
              <p><strong>Official info pending:</strong> {submission.official_info_pending ? "Yes" : "No"}</p>
              <p><strong>Lead agency:</strong> {submission.lead_agency || "Not provided"}</p>
              <p><strong>Agency report/case #:</strong> {submission.agency_case_number || "Not provided"}</p>
              <p><strong>NamUs #:</strong> {submission.namus_number || "Not provided"}</p>
              <p><strong>Tip contact:</strong> {submission.tip_contact || "Not provided"}</p>
            </div>

            {(submission.profile_type === "urgent_missing" || submission.profile_type === "murdered_info_needed" || submission.notification_area_requested) ? (
              <div className="admin-summary alert-planning-summary">
                <h3>{submission.profile_type === "murdered_info_needed" ? "Map / renewed visibility notes" : "Urgent public-awareness planning"}</h3>
                <div className="admin-detail-grid">
                  <p><strong>Last known date/time:</strong> {submission.last_known_datetime || "Not provided"}</p>
                  <p><strong>Time zone:</strong> {submission.last_known_time_zone || "Not provided"}</p>
                  <p><strong>Likely travel mode:</strong> {submission.likely_travel_mode || "Unknown"}</p>
                  <p><strong>Possible direction:</strong> {submission.possible_direction || "Not provided"}</p>
                  <p><strong>Vehicle/public detail:</strong> {submission.vehicle_description || "Not provided"}</p>
                  <p><strong>Official reporting started:</strong> {submission.official_report_contacted ? "Confirmed by submitter" : "Not confirmed"}</p>
                </div>
                {submission.notification_area_requested ? <p><strong>Requested notification/map area:</strong> {submission.notification_area_requested}</p> : null}
                <p className="muted">Use this only to choose broad public-awareness areas after review. MMIPS does not collect tips, direct searches, or replace official response.</p>
              </div>
            ) : null}

            <div className="admin-summary">
              <h3>Public summary draft</h3>
              <p>{submission.summary}</p>
            </div>


            {(submission.photos?.length || submission.photo_signed_url) ? (
              <div className="admin-summary">
                <h3>Submitted photos / flyers</h3>
                {submission.photos?.length ? (
                  <div className="admin-photo-gallery-review">
                    {submission.photos.map((photo) => (
                      <article className={photo.is_main ? "admin-photo-review-card main" : "admin-photo-review-card"} key={photo.id || photo.storage_path}>
                        {photo.signed_url ? <img src={photo.signed_url} alt={photo.alt_text || photo.caption || `${submission.full_name} submitted image`} /> : null}
                        <div>
                          <p><strong>{photo.is_main ? "Main photo" : "Submitted image"}</strong></p>
                          <p><strong>File:</strong> {photo.original_name || "Unknown"}</p>
                          <p><strong>Type:</strong> {photo.photo_type ? photo.photo_type.replaceAll("_", " ") : "Not labeled"}</p>
                          <p><strong>Use:</strong> {[photo.use_on_profile ? "profile" : null, photo.use_on_flyer ? "flyer" : null].filter(Boolean).join(" + ") || "admin review only"}</p>
                          <p><strong>Caption:</strong> {photo.caption || photo.alt_text || "Not provided"}</p>
                          <p><strong>Size:</strong> {photo.size_bytes ? `${Math.round(photo.size_bytes / 1024)} KB` : "Unknown"}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="admin-photo-review">
                    <img src={submission.photo_signed_url || ""} alt={submission.photo_alt_text || `${submission.full_name} submitted image`} />
                    <div>
                      <p><strong>Original file:</strong> {submission.photo_original_name || "Unknown"}</p>
                      <p><strong>Type:</strong> {submission.photo_content_type || "Unknown"}</p>
                      <p><strong>Size:</strong> {submission.photo_size ? `${Math.round(submission.photo_size / 1024)} KB` : "Unknown"}</p>
                      <p><strong>Description:</strong> {submission.photo_alt_text || "Not provided"}</p>
                    </div>
                  </div>
                )}
                <p className="muted small-text">Only approve images that are family/authorized, non-graphic, and safe to publish. Use the submitter’s main/profile/flyer choices unless a safety reason requires edits.</p>
              </div>
            ) : null}

            <div className="admin-summary">
              <h3>Submitter</h3>
              <p>{submission.submitter_name} · {submission.relationship} · {submission.submitter_email}{submission.submitter_phone ? ` · ${submission.submitter_phone}` : ""}</p>
            </div>

            <label>Moderator notes
              <textarea value={notes[submission.id] ?? submission.moderator_notes ?? ""} onChange={(e) => setNotes({ ...notes, [submission.id]: e.target.value })} placeholder="Verification steps, family consent status, safety edits, reason for rejection, etc." />
            </label>

            <div className="button-row">
              <button type="button" onClick={() => act(submission, "approve")}>Approve + publish profile</button>
              <button type="button" className="button secondary" onClick={() => act(submission, "needs_more_info")}>Needs more info</button>
              <button type="button" className="button danger" onClick={() => act(submission, "rejected")}>Reject</button>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-list public-profile-admin-section">
        <h2>Published profile status/type editor</h2>
        <p className="muted">Use this when a profile changes stages, for example urgent missing → standard missing, missing → remembering/information needed, or located/resolved. This updates the live profile, flyer, JPEG export, map category, and QR-linked page.</p>
        <p className="muted small-text">Showing {publicProfiles.length} profile{publicProfiles.length === 1 ? "" : "s"}{profileSearch.trim() ? ` matching “${profileSearch.trim()}”` : ""}. Use the quick lookup box above to jump to a name, slug, city, agency, report number, or NamUs number.</p>
        {publicProfiles.length === 0 ? (
          <div className="card"><p>No public profiles found for this filter.</p></div>
        ) : publicProfiles.map((profile) => {
          const edit = profileEdits[profile.id] || defaultPublicProfileEdits(profile);
          return (
            <article className="card admin-submission" key={profile.id}>
              <div className="case-header-line">
                <div>
                  <h2>{edit.full_name || profile.slug}</h2>
                  <p className="muted">/{profile.slug} · last public update {profile.last_public_update || "not listed"}</p>
                </div>
                <div className="badge-stack"><span className={`badge badge-profile-${edit.profile_type}`}>{profileTypeLabels[edit.profile_type] || edit.profile_type}</span><span className="badge badge-neutral">{edit.status}</span></div>
              </div>

              <div className="button-row small-button-row">
                <button type="button" className="button secondary" onClick={() => applyQuickTransition(profile, "urgent_to_missing")}>Urgent → standard missing</button>
                <button type="button" className="button secondary" onClick={() => applyQuickTransition(profile, "missing_to_murdered")}>Missing → information needed</button>
                <button type="button" className="button secondary" onClick={() => applyQuickTransition(profile, "located")}>Mark located/resolved</button>
                <a className="button secondary" href={`/profiles/${profile.slug}`} target="_blank" rel="noreferrer">View live profile</a>
              </div>

              <section className="card nested-admin-card">
                <h3>Status and public wording</h3>
                <div className="admin-detail-grid edit-grid">
                  <label>Public profile title / person name
                    <input value={edit.full_name} onChange={(e) => updateProfileEdit(profile.id, "full_name", e.target.value)} />
                  </label>
                  <label>Age
                    <input value={edit.age} onChange={(e) => updateProfileEdit(profile.id, "age", e.target.value)} />
                  </label>
                  <label>Tribal affiliation
                    <input value={edit.tribal_affiliation} onChange={(e) => updateProfileEdit(profile.id, "tribal_affiliation", e.target.value)} />
                  </label>
                  <label>Profile type
                    <select value={edit.profile_type} onChange={(e) => updateProfileEdit(profile.id, "profile_type", e.target.value)}>
                      <option value="urgent_missing">Urgent public awareness</option>
                      <option value="missing">Missing public profile</option>
                      <option value="murdered_info_needed">Remembering / information needed</option>
                      <option value="unidentified">Unidentified public profile</option>
                      <option value="located">Located / status update</option>
                    </select>
                  </label>
                  <label>Status
                    <select value={edit.status} onChange={(e) => updateProfileEdit(profile.id, "status", e.target.value)}>
                      <option value="missing">Missing</option>
                      <option value="murdered_unsolved">Information needed</option>
                      <option value="unidentified">Unidentified</option>
                      <option value="resolved">Located / resolved</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </label>
                  <label>Urgency level
                    <select value={edit.urgency_level} onChange={(e) => updateProfileEdit(profile.id, "urgency_level", e.target.value)}>
                      <option value="standard">Standard</option>
                      <option value="urgent_public_awareness">Urgent public awareness</option>
                      <option value="renewed_visibility">Renewed visibility</option>
                      <option value="status_update">Status update</option>
                    </select>
                  </label>
                  <label>Public last-seen/location text
                    <input value={edit.last_seen_area_public} onChange={(e) => updateProfileEdit(profile.id, "last_seen_area_public", e.target.value)} />
                  </label>
                  <label>Location precision
                    <select value={edit.location_precision} onChange={(e) => updateProfileEdit(profile.id, "location_precision", e.target.value)}>
                      <option value="city">City</option>
                      <option value="county">County</option>
                      <option value="approximate">Approximate</option>
                      <option value="hidden">Hidden</option>
                      <option value="exact_private">Exact/private - do not display exact public address</option>
                    </select>
                  </label>
                </div>
                <label>Public summary
                  <textarea value={edit.public_summary} onChange={(e) => updateProfileEdit(profile.id, "public_summary", e.target.value)} />
                </label>
              </section>

              <section className="card nested-admin-card">
                <h3>Official information and notification planning</h3>
                <div className="admin-detail-grid edit-grid">
                  <label>Lead agency
                    <input value={edit.lead_agency} onChange={(e) => updateProfileEdit(profile.id, "lead_agency", e.target.value)} />
                  </label>
                  <label>Agency report/case #
                    <input value={edit.agency_case_number} onChange={(e) => updateProfileEdit(profile.id, "agency_case_number", e.target.value)} />
                  </label>
                  <label>NamUs #
                    <input value={edit.namus_number} onChange={(e) => updateProfileEdit(profile.id, "namus_number", e.target.value)} />
                  </label>
                  <label>Official tip contact
                    <input value={edit.official_tip_contact} onChange={(e) => updateProfileEdit(profile.id, "official_tip_contact", e.target.value)} />
                  </label>
                  <label>NCIC status
                    <input value={edit.ncic_status} onChange={(e) => updateProfileEdit(profile.id, "ncic_status", e.target.value)} />
                  </label>
                  <label>Tribe notified
                    <input value={edit.tribe_notified} onChange={(e) => updateProfileEdit(profile.id, "tribe_notified", e.target.value)} />
                  </label>
                  <label>Family liaison
                    <input value={edit.family_liaison} onChange={(e) => updateProfileEdit(profile.id, "family_liaison", e.target.value)} />
                  </label>
                  <label>Requested notification/map area
                    <input value={edit.notification_area_requested} onChange={(e) => updateProfileEdit(profile.id, "notification_area_requested", e.target.value)} />
                  </label>
                  <label>Likely travel mode
                    <input value={edit.likely_travel_mode} onChange={(e) => updateProfileEdit(profile.id, "likely_travel_mode", e.target.value)} />
                  </label>
                  <label>Possible direction
                    <input value={edit.possible_direction} onChange={(e) => updateProfileEdit(profile.id, "possible_direction", e.target.value)} />
                  </label>
                  <label>Vehicle description
                    <input value={edit.vehicle_description} onChange={(e) => updateProfileEdit(profile.id, "vehicle_description", e.target.value)} />
                  </label>
                  <label className="checkbox-label compact-checkbox">
                    <input type="checkbox" checked={edit.official_info_pending} onChange={(e) => updateProfileEdit(profile.id, "official_info_pending", e.target.checked)} />
                    Official information still pending
                  </label>
                </div>
              </section>

              <label>Moderator note / reason for profile status change
                <textarea value={profileNotes[profile.id] ?? ""} onChange={(e) => setProfileNotes({ ...profileNotes, [profile.id]: e.target.value })} placeholder="Example: Family confirmed located update; official agency public flyer updated; urgent period changed to standard missing profile; etc." />
              </label>

              <div className="button-row">
                <button type="button" onClick={() => savePublicProfile(profile)}>Save profile status/type update</button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="admin-list correction-admin-section">
        <h2>Correction/removal requests</h2>
        <p className="muted small-text">Showing {correctionRequests.length} request{correctionRequests.length === 1 ? "" : "s"}{correctionSearch.trim() ? ` matching “${correctionSearch.trim()}”` : ""}.</p>
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
                <p><strong>Profile:</strong> {caseNameForCorrection(request)}</p>
                <p><strong>Profile slug:</strong> {request.cases?.slug || "Not matched"}</p>
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
                <h3>Public profile updates to apply</h3>
                <p className="muted">Edit only the fields that should change. “Mark applied” will update the linked public profile and then mark this correction/removal request approved/applied.</p>
                {!hasLinkedCase && <p className="notice small-notice">This request is not linked to a public profile slug yet. Marking applied will only change the request status until it is matched to a public profile.</p>}

                <div className="admin-detail-grid edit-grid">
                  <label>Public profile title / person name
                    <input value={edit.full_name} onChange={(e) => updateCorrectionEdit(request.id, "full_name", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Age
                    <input value={edit.age} onChange={(e) => updateCorrectionEdit(request.id, "age", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Tribal affiliation
                    <input value={edit.tribal_affiliation} onChange={(e) => updateCorrectionEdit(request.id, "tribal_affiliation", e.target.value)} disabled={!hasLinkedCase} />
                  </label>
                  <label>Status
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
                  <label>Agency report/case #
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
                <button type="button" onClick={() => actOnCorrection(request, "approved")}>Mark applied + update profile</button>
                {hasLinkedCase ? <button type="button" className="button danger" onClick={() => actOnCorrection(request, "remove_public_profile")}>Remove public profile</button> : null}
                <button type="button" className="button secondary" onClick={() => actOnCorrection(request, "needs_more_info")}>Needs more info</button>
                <button type="button" className="button danger" onClick={() => actOnCorrection(request, "rejected")}>Reject</button>
                <button type="button" className="button secondary" onClick={() => actOnCorrection(request, "hidden")}>Close request / no public change</button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
