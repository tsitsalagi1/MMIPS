"use client";

import { FormEvent, useState } from "react";
import { CaseCard } from "./CaseCard";
import type { MmipsCase } from "@/lib/types";

export default function ProfilesSearch({ initialProfiles }: { initialProfiles: MmipsCase[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("50");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      if (state.trim()) params.set("state", state.trim());
      if (zip.trim()) {
        params.set("zip", zip.trim());
        params.set("radiusMiles", radiusMiles);
      }
      const response = await fetch(`/api/profiles/search?${params.toString()}`, { headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(typeof data.message === "string" ? data.message : "Search is temporarily unavailable.");
        return;
      }
      setProfiles(Array.isArray(data.profiles) ? data.profiles : []);
      setMessage(`${Number(data.count || 0)} public profile${Number(data.count || 0) === 1 ? "" : "s"} found.`);
    } catch {
      setMessage("Search is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQ("");
    setStatus("all");
    setState("");
    setZip("");
    setRadiusMiles("50");
    setProfiles(initialProfiles);
    setMessage("");
  }

  return (
    <>
      <div className="card" style={{ margin: "20px 0" }}>
        <form className="form" onSubmit={search}>
          <label>Search by name, city, Tribe, agency, or NamUs number
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search MMIPS public profiles" />
          </label>
          <div className="check-grid">
            <label>Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="missing">Missing</option>
                <option value="murdered_unsolved">Murdered / Unsolved</option>
                <option value="unidentified">Unidentified</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label>State
              <input value={state} onChange={(event) => setState(event.target.value)} placeholder="Oklahoma, Arizona, Montana..." />
            </label>
          </div>
          <fieldset className="field-group">
            <legend>Search near a ZIP code</legend>
            <p className="field-help">Optional. ZIP-distance search compares a U.S. Census ZIP-area reference point with each case&apos;s moderator-approved approximate public map point. It never uses a private incident or home coordinate.</p>
            <div className="check-grid">
              <label>ZIP code
                <input inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} value={zip} onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="74464" />
              </label>
              <label>Distance
                <select value={radiusMiles} onChange={(event) => setRadiusMiles(event.target.value)} disabled={!zip}>
                  <option value="10">Within 10 miles</option>
                  <option value="25">Within 25 miles</option>
                  <option value="50">Within 50 miles</option>
                  <option value="100">Within 100 miles</option>
                  <option value="250">Within 250 miles</option>
                </select>
              </label>
            </div>
          </fieldset>
          <div className="button-row">
            <button type="submit" disabled={loading}>{loading ? "Searching…" : "Search profiles"}</button>
            <button type="button" className="secondary" onClick={reset}>Reset search</button>
          </div>
          {message ? <p className="status-message" role="status" aria-live="polite">{message}</p> : null}
        </form>
      </div>

      {profiles.length ? profiles.map((item) => <CaseCard key={item.id} item={item} />) : (
        <div className="card calm-panel" style={{ marginTop: "22px" }}>
          <h2>No matching public profiles.</h2>
          <p className="text-measure">Try a broader search or a larger ZIP-code distance. A profile without an approved public map point will not appear in ZIP-distance results.</p>
        </div>
      )}
    </>
  );
}
