"use client";

import { FormEvent, useMemo, useState } from "react";
import { CaseCard } from "./CaseCard";
import type { MmipsCase } from "@/lib/types";

const RESULTS_PER_PAGE = 20;

export default function ProfilesSearch({ initialProfiles }: { initialProfiles: MmipsCase[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("50");
  const [message, setMessage] = useState(initialProfiles.length ? `Showing the ${initialProfiles.length} most recently published profiles. Use search to narrow the list.` : "");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(profiles.length / RESULTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleProfiles = useMemo(() => profiles.slice((safePage - 1) * RESULTS_PER_PAGE, safePage * RESULTS_PER_PAGE), [profiles, safePage]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setPage(1);
    try {
      const response = await fetch("/api/profiles/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          q: q.trim(),
          status,
          state: state.trim(),
          zip: zip.trim() || undefined,
          radiusMiles: zip.trim() ? Number(radiusMiles) : undefined
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(typeof data.message === "string" ? data.message : "Search is temporarily unavailable.");
        return;
      }
      setProfiles(Array.isArray(data.profiles) ? data.profiles : []);
      setMessage(`${Number(data.count || 0)} public profile${Number(data.count || 0) === 1 ? "" : "s"} found. Results are shown 20 at a time.`);
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
    setPage(1);
    setMessage(initialProfiles.length ? `Showing the ${initialProfiles.length} most recently published profiles. Use search to narrow the list.` : "");
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
            <label>State or province
              <input value={state} onChange={(event) => setState(event.target.value)} placeholder="Oklahoma, Arizona, Alberta..." />
            </label>
          </div>
          <fieldset className="field-group">
            <legend>Search near a U.S. ZIP code</legend>
            <p className="field-help">Optional. Enter a U.S. ZIP code to find public profiles with an approved awareness area nearby. MMIPS does not use private home, family, shelter, or incident locations for this search.</p>
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

      {visibleProfiles.length ? <>
        {visibleProfiles.map((item) => <CaseCard key={item.id} item={item} />)}
        {totalPages > 1 ? <nav className="profile-pagination" aria-label="Public profile result pages">
          <button type="button" className="secondary" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous 20</button>
          <span>Page {safePage} of {totalPages}</span>
          <button type="button" className="secondary" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next 20</button>
        </nav> : null}
      </> : (
        <div className="card calm-panel" style={{ marginTop: "22px" }}>
          <h2>No matching public profiles.</h2>
          <p className="text-measure">Try fewer search words, a larger distance, or clear one of the filters. ZIP-distance results include only profiles that have an approved public awareness area.</p>
        </div>
      )}
    </>
  );
}
