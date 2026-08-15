"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Counts = { total: number; staged: number; published: number };
type Source = "us" | "ca";
type Benchmark = {
  label: string;
  targetProfiles: number;
  missingProfiles: number;
  murderedUnsolvedProfiles: number;
  alaskaProfiles: number;
  territoryProfiles: number;
  territoryLabels: readonly string[];
  benchmarkLabel: string;
  currentReference: string;
  geographyReference: string;
  limitations: string;
};

type ActionResponse = {
  ok?: boolean;
  message?: string;
  inserted?: number;
  processed?: number;
  nextOffset?: number;
  done?: boolean;
  counts?: Counts;
  benchmark?: Benchmark;
};

const phrases = {
  stage: "STAGE NATIONAL SYNTHETIC TEST",
  publish: "PUBLISH NATIONAL SYNTHETIC TEST",
  remove: "REMOVE NATIONAL SYNTHETIC TEST"
} as const;

export default function AdminSyntheticScale({ source }: { source: Source }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts>({ total: 0, staged: 0, published: 0 });
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);

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

  async function request(body?: Record<string, unknown>) {
    if (!sessionToken) throw new Error("Sign in to MMIPS admin first.");
    const response = await fetch("/api/admin/synthetic-scale", {
      method: body ? "POST" : "GET",
      headers: body ? { Authorization: `Bearer ${sessionToken}`, "Content-Type": "application/json" } : { Authorization: `Bearer ${sessionToken}` },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({})) as ActionResponse;
    if (!response.ok || data.ok === false) throw new Error(data.message || "Synthetic scale-test action failed.");
    if (data.counts) setCounts(data.counts);
    if (data.benchmark) setBenchmark(data.benchmark);
    return data;
  }

  async function refresh() {
    try { await request(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load scale-test status."); }
  }

  useEffect(() => {
    if (sessionToken) void refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  async function stage() {
    if (confirmation !== phrases.stage) {
      setMessage(`Type ${phrases.stage} exactly before staging records.`);
      return;
    }
    setBusy(true);
    setMessage(`Staging the ${source === "us" ? "U.S., including Alaska and the five populated territories" : "Canada"} synthetic capacity benchmark…`);
    try {
      let offset = 0;
      let inserted = 0;
      for (let page = 0; page < 50; page += 1) {
        const data = await request({ action: "stage", source, offset, confirmation });
        inserted += Number(data.inserted || 0);
        setMessage(`Staged ${inserted} new fictional records from official broad ${source === "us" ? "U.S. Census Indigenous and territory" : "Indigenous Services Canada"} geographies. Nothing is public yet.`);
        if (data.done) break;
        offset = Number(data.nextOffset || offset + 150);
        if (page === 49) throw new Error("Staging stopped at the safety page limit. Review counts before continuing.");
      }
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not stage the synthetic geography set.");
    } finally {
      setBusy(false);
    }
  }

  async function processAll(action: "publish" | "remove") {
    if (confirmation !== phrases[action]) {
      setMessage(`Type ${phrases[action]} exactly before continuing.`);
      return;
    }
    setBusy(true);
    let processed = 0;
    try {
      for (let batch = 0; batch < 100; batch += 1) {
        const data = await request({ action, confirmation });
        processed += Number(data.processed || 0);
        setMessage(action === "publish"
          ? `Published ${processed} fictional national load-test profiles so far.`
          : `Removed ${processed} fictional national load-test profiles so far.`);
        if (data.done) break;
        if (batch === 99) throw new Error("Action stopped at the safety batch limit. Review counts before continuing.");
      }
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not complete the synthetic scale-test action.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card stack" aria-labelledby="synthetic-scale-heading">
      <div>
        <p className="eyebrow">Launch rehearsal only</p>
        <h2 id="synthetic-scale-heading">National synthetic scale test</h2>
        <p>Use official aggregate benchmarks and broad government Indigenous geography to create unmistakably fictional MMIPS profiles for performance, map, filter, accessibility, and pagination testing. Real people and real case locations are never imported.</p>
      </div>

      {benchmark ? (
        <div className="notice">
          <strong>{benchmark.label}: {benchmark.targetProfiles.toLocaleString()}-profile capacity target</strong>
          <p>{benchmark.missingProfiles.toLocaleString()} synthetic missing profiles and {benchmark.murderedUnsolvedProfiles.toLocaleString()} synthetic murdered/unsolved profiles. {source === "us" ? `${benchmark.alaskaProfiles.toLocaleString()} profiles explicitly exercise Alaska Native village coverage; ${benchmark.territoryProfiles.toLocaleString()} evenly exercise ${benchmark.territoryLabels.join(", ")}. ` : ""}{benchmark.benchmarkLabel}.</p>
          <p>{benchmark.currentReference}</p>
          <p>{benchmark.geographyReference}</p>
          <p><strong>Interpretation limit:</strong> {benchmark.limitations}</p>
        </div>
      ) : null}

      <div className="notice warning">
        <strong>Safe sequence:</strong>
        <p><strong>Stage</strong> first. Staged records stay pending and unpublished. Publish only after the country-scale code is live in Production. Remove deletes only this site&apos;s <code>mmips-test-scale-{source}-</code> records.</p>
      </div>

      <div className="feature-grid">
        <div className="card"><strong>{counts.total}</strong><p>Total national synthetic records</p></div>
        <div className="card"><strong>{counts.staged}</strong><p>Staged and unpublished</p></div>
        <div className="card"><strong>{counts.published}</strong><p>Published synthetic records</p></div>
      </div>

      <label>Typed confirmation phrase
        <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Use the exact phrase shown on the button group" autoComplete="off" />
      </label>

      <div className="stack">
        <p><strong>To stage:</strong> type <code>{phrases.stage}</code></p>
        <button type="button" disabled={busy || !sessionToken} onClick={stage}>Stage {source === "us" ? "U.S., Alaska, and territories" : "Canada"} capacity test set</button>
        <p><strong>To publish:</strong> type <code>{phrases.publish}</code></p>
        <button type="button" disabled={busy || !sessionToken} onClick={() => processAll("publish")}>Publish staged national synthetic test</button>
        <p><strong>To remove:</strong> type <code>{phrases.remove}</code></p>
        <button type="button" className="secondary" disabled={busy || !sessionToken} onClick={() => processAll("remove")}>Remove national synthetic test records</button>
      </div>

      <p className="status-message" role="status" aria-live="polite">{busy ? "Working in small audited batches… " : ""}{message}</p>
    </section>
  );
}
