"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type MapPoint = {
  id: string;
  public_label: string;
  public_latitude: number | string;
  public_longitude: number | string;
  precision: string;
  region_type: string;
  moderator_approved: boolean;
  safety_reviewed_at: string | null;
  hidden_at: string | null;
  updated_at: string;
};

type MapProfile = {
  id: string;
  slug: string;
  status: string;
  profile_type: string | null;
  last_seen_area_public: string | null;
  persons?: { full_name?: string | null; tribal_affiliation?: string | null } | { full_name?: string | null; tribal_affiliation?: string | null }[] | null;
  public_case_map_points?: MapPoint[] | MapPoint | null;
};

type EditState = {
  public_label: string;
  public_latitude: string;
  public_longitude: string;
  precision: string;
  region_type: string;
  moderator_notes: string;
  safety_confirmed: boolean;
};

function personFor(profile: MapProfile) {
  return Array.isArray(profile.persons) ? profile.persons[0] : profile.persons;
}

function activePoint(profile: MapProfile) {
  const raw = profile.public_case_map_points;
  const points = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return points.find((point) => !point.hidden_at) || null;
}

function editFor(profile: MapProfile): EditState {
  const point = activePoint(profile);
  return {
    public_label: point?.public_label || profile.last_seen_area_public || "",
    public_latitude: point ? String(point.public_latitude) : "",
    public_longitude: point ? String(point.public_longitude) : "",
    precision: point?.precision || "city_centroid",
    region_type: point?.region_type || "city",
    moderator_notes: "",
    safety_confirmed: false
  };
}

export default function AdminMapPoints() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<MapProfile[]>([]);
  const [selected, setSelected] = useState<MapProfile | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSessionToken(data.session?.access_token ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSessionToken(session?.access_token ?? null));
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function searchProfiles(event?: React.FormEvent) {
    event?.preventDefault();
    if (!sessionToken || query.trim().length < 2) return;
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ q: query.trim() });
      const response = await fetch(`/api/admin/map-points?${params.toString()}`, { headers: { Authorization: `Bearer ${sessionToken}` } });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.message || "Could not search published profiles.");
      setProfiles(json.profiles || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not search published profiles.");
    } finally {
      setLoading(false);
    }
  }

  function choose(profile: MapProfile) {
    setSelected(profile);
    setEdit(editFor(profile));
    setMessage("");
  }

  function update<K extends keyof EditState>(key: K, value: EditState[K]) {
    if (!edit) return;
    setEdit({ ...edit, [key]: value });
  }

  async function save() {
    if (!sessionToken || !selected || !edit) return;
    const confirmed = window.confirm("Publish this approximate public-awareness map point? Confirm that it is a broad reviewed area and not a home, shelter, incident/recovery site, witness/family location, or investigative location.");
    if (!confirmed) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/map-points/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ action: "save", ...edit })
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.message || "Could not save the public map point.");
      setMessage(json.message);
      setSelected(null);
      setEdit(null);
      await searchProfiles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the public map point.");
    } finally {
      setLoading(false);
    }
  }

  async function hide() {
    if (!sessionToken || !selected || !edit || !activePoint(selected)) return;
    if (edit.moderator_notes.trim().length < 10) {
      setMessage("Document the reason for hiding the point in moderator notes first.");
      return;
    }
    const confirmed = window.confirm("Hide this public map point immediately? The public profile itself will remain published.");
    if (!confirmed) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/map-points/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ action: "hide", moderator_notes: edit.moderator_notes })
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.message || "Could not hide the public map point.");
      setMessage(json.message);
      setSelected(null);
      setEdit(null);
      await searchProfiles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not hide the public map point.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionToken) return null;

  return (
    <section className="container section correction-admin-section" aria-labelledby="map-point-admin-heading">
      <h2 id="map-point-admin-heading">Public map point safety review</h2>
      <p className="lead">Create only deliberately approximate public-awareness areas for already approved profiles. The server rounds coordinates before publication and records moderator approval without putting coordinates into the audit log.</p>
      <section className="notice warning">
        <strong>Never copy a private/exact location here.</strong>
        <p>Do not use a home, shelter, street address, incident or recovery site, witness/family location, device/GPS coordinate, or investigative location. Use a reviewed city centroid, county/Tribal region, broad region, or state-level point.</p>
      </section>

      <form className="card admin-controls" onSubmit={searchProfiles}>
        <label>Find a published profile
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, slug, Tribal affiliation, or public area" minLength={2} />
        </label>
        <button type="submit" disabled={loading || query.trim().length < 2}>{loading ? "Searching..." : "Search profiles"}</button>
      </form>

      {message ? <p className="notice small-notice" role="status">{message}</p> : null}

      {profiles.length ? (
        <div className="admin-list">
          {profiles.map((profile) => {
            const person = personFor(profile);
            const point = activePoint(profile);
            return (
              <article className="card" key={profile.id}>
                <div className="case-header-line">
                  <div>
                    <h3>{person?.full_name || profile.slug}</h3>
                    <p className="muted">/{profile.slug} · {profile.profile_type || profile.status}</p>
                    <p><strong>Public area:</strong> {profile.last_seen_area_public || "Not set"}</p>
                    <p><strong>Map point:</strong> {point ? `${point.public_label} · ${point.precision}` : "None approved"}</p>
                  </div>
                  <button type="button" className="button secondary" onClick={() => choose(profile)}>Review map point</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : query.trim().length >= 2 && !loading ? <p className="card">No published profiles found for that search.</p> : null}

      {selected && edit ? (
        <section className="card" aria-labelledby="map-point-editor-heading">
          <h3 id="map-point-editor-heading">Review approximate map point for {personFor(selected)?.full_name || selected.slug}</h3>
          <div className="admin-detail-grid edit-grid">
            <label>Public area label
              <input value={edit.public_label} onChange={(event) => update("public_label", event.target.value)} placeholder="Tahlequah area" maxLength={120} />
            </label>
            <label>Precision
              <select value={edit.precision} onChange={(event) => update("precision", event.target.value)}>
                <option value="city_centroid">City centroid</option>
                <option value="county">County</option>
                <option value="tribal_region">Tribal region</option>
                <option value="broad_region">Broad region</option>
                <option value="state">State</option>
              </select>
            </label>
            <label>Region type
              <select value={edit.region_type} onChange={(event) => update("region_type", event.target.value)}>
                <option value="city">City</option>
                <option value="county">County</option>
                <option value="tribal_region">Tribal region</option>
                <option value="broad_region">Broad region</option>
                <option value="state">State</option>
              </select>
            </label>
            <label>Approximate latitude
              <input type="number" inputMode="decimal" step="0.01" min="-90" max="90" value={edit.public_latitude} onChange={(event) => update("public_latitude", event.target.value)} />
            </label>
            <label>Approximate longitude
              <input type="number" inputMode="decimal" step="0.01" min="-180" max="180" value={edit.public_longitude} onChange={(event) => update("public_longitude", event.target.value)} />
            </label>
          </div>
          <p className="muted small-text">Server-side safety rounding: state/broad-region points are rounded to 1 decimal; city/county/Tribal-region points are rounded to 2 decimals.</p>
          <label>Moderator safety/review notes
            <textarea value={edit.moderator_notes} onChange={(event) => update("moderator_notes", event.target.value)} placeholder="Source of public centroid/region, why this area is safe to publish, family/authorization notes if relevant." />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={edit.safety_confirmed} onChange={(event) => update("safety_confirmed", event.target.checked)} />
            <span>I confirm these coordinates represent a deliberately approximate public-awareness area and are not copied from an exact/private location.</span>
          </label>
          <div className="button-row">
            <button type="button" onClick={save} disabled={loading || !edit.safety_confirmed}>Save reviewed public map point</button>
            {activePoint(selected) ? <button type="button" className="button danger" onClick={hide} disabled={loading}>Hide current map point</button> : null}
            <button type="button" className="button secondary" onClick={() => { setSelected(null); setEdit(null); }}>Cancel</button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
