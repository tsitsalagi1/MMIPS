"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicMapPoint } from "../../lib/public-map";
import type { MmipsCase } from "../../lib/types";
import styles from "./PublicMapExperience.module.css";

const MapLibreRenderer = dynamic(() => import("./MapLibreRenderer"), { ssr: false, loading: () => <p role="status">Loading optional visual map…</p> });

export function PublicMapExperience({ points, profiles }: { points: PublicMapPoint[]; profiles: MmipsCase[] }) {
  const [selectedId, setSelectedId] = useState<string>();
  const selected = useMemo(() => points.find((point) => point.publicId === selectedId), [points, selectedId]);
  return <>
    <p>All displayed locations are approximate, approved public-awareness areas—not exact homes, shelters, incident or recovery sites, witness or family locations, or investigative locations. The visual map is optional; the list is complete. MMIPS does not verify or investigate cases through this map.</p>
    <a className={styles.skipLink} href="#public-map-list">Skip visual map and go to complete list</a>
    <MapLibreRenderer points={points} onSelect={setSelectedId} />
    <div className={styles.announcement} aria-live="polite">
      {selected ? <p>Selected profile: <Link href={`/profiles/${selected.slug}`}>{selected.publicName}</Link>. {selected.mapLabel}. {selected.status.replaceAll("_", " ")}.</p> : <p>No map profile selected.</p>}
    </div>
    <section id="public-map-list" tabIndex={-1} aria-labelledby="map-list-heading">
      <h2 id="map-list-heading">Complete public map list</h2>
      <p aria-live="polite">{profiles.length} approved public profile{profiles.length === 1 ? "" : "s"} listed.</p>
      {profiles.length ? <div className={styles.list}>{profiles.map((profile) => <article className="card" key={profile.id}><h3>{profile.fullName}</h3><p>{profile.publicLocationNote} · {profile.status.replaceAll("_", " ")}</p><Link className="button secondary" href={`/profiles/${profile.slug}`}>Open profile</Link></article>)}</div> : <p>No approved public profiles are available.</p>}
    </section>
  </>;
}
