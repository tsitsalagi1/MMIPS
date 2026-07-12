import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStatusBadge, ProfileTypeBadge, VerificationBadge } from "../../../components/StatusBadge";
import { ShareButtons } from "../../../components/ShareButtons";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { getCaseBySlug } from "../../../lib/cases";
import { flyerTitleForProfile, profileIntroForType } from "../../../lib/status";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) notFound();

  const title = flyerTitleForProfile(item.profileType, item.status);
  const isMurdered = item.profileType === "murdered_info_needed";
  const isUrgent = item.profileType === "urgent_missing";

  return (
    <main className="container section">
      <div className={`profile-hero profile-hero-${item.profileType}`}>
        <div>
          <p className="muted">MMIPS public profile</p>
          <h1>{item.fullName}</h1>
          <p>{profileIntroForType(item.profileType)}</p>
        </div>
        <div className="badge-stack"><ProfileTypeBadge profileType={item.profileType} /><CaseStatusBadge status={item.status} /></div>
      </div>
      <SafetyNotice />

      {isUrgent ? (
        <section className="notice urgent-soft">
          <strong>Urgent public awareness</strong>
          <p>Information may still be updated as official details become available. MMIPS does not collect tips or direct searches. Use the listed official contact or call 911 in an emergency.</p>
        </section>
      ) : null}

      {isMurdered ? (
        <section className="notice soft">
          <strong>Remembering / information needed</strong>
          <p>This profile is shared for dignity, visibility, and official information routing. It does not use urgent missing-person alert tools.</p>
        </section>
      ) : null}

      <section className="card public-photo-card">
        <div className="public-photo-wrap">
          <img src={item.photoUrl || "/placeholder-person.svg"} alt={item.photoAltText || `${item.fullName} public profile image`} />
        </div>
        <p className="muted small-text">Images are shown only after approval for public display. Request removal if an image should not be public.</p>
      </section>

      {item.photos && item.photos.length > 1 ? (
        <section className="card public-gallery-card">
          <h2>Additional approved photos</h2>
          <p className="muted">These images were approved for public display to help with recognition. Do not repost with rumors, accusations, or unsafe private-location details.</p>
          <div className="public-photo-gallery">
            {item.photos.filter((photo) => !photo.isMain).map((photo) => (
              <figure key={photo.id || photo.url}>
                <img src={photo.url} alt={photo.altText || photo.caption || `${item.fullName} additional approved image`} />
                {photo.caption || photo.photoType ? <figcaption>{photo.caption || String(photo.photoType).replaceAll("_", " ")}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="feature-grid">
        <div className="card"><h3>{isMurdered ? "Public area" : "Last seen / location"}</h3><p>{item.lastSeenLocation}</p><p className="muted">{item.publicLocationNote}</p></div>
        <div className="card"><h3>Official contact</h3><p>{item.leadAgency ?? "Unknown"}</p><p className="muted">Agency report/case #: {item.agencyCaseNumber ?? "Unknown"}</p></div>
        <div className="card"><h3>Have information?</h3><p>{item.tipPhone ?? "Use the listed official contact or call 911 in an emergency."}</p><p className="muted">Do not send tips to MMIPS. Never post public rumors or accusations.</p></div>
      </section>

      {(isUrgent || item.notificationAreaRequested || item.likelyTravelMode) ? (
        <section className="card alert-planning-public">
          <h2>{isMurdered ? "Map / visibility area" : "Public-awareness area"}</h2>
          <p>{item.notificationAreaRequested || "Broad awareness area not publicly listed."}</p>
          {item.lastKnownDatetime ? <p><strong>Last known date/time:</strong> {item.lastKnownDatetime}{item.lastKnownTimeZone ? ` (${item.lastKnownTimeZone})` : ""}</p> : null}
          {item.likelyTravelMode ? <p><strong>Likely travel mode:</strong> {item.likelyTravelMode}</p> : null}
          {item.possibleDirection ? <p><strong>Possible direction:</strong> {item.possibleDirection}</p> : null}
          <p className="muted">This is for broad public-awareness routing only. It is not a prediction, a search plan, or an official investigative finding.</p>
        </section>
      ) : null}

      <section className="card">
        <h2>Public summary</h2>
        <p>{item.summary}</p>
        {item.officialInfoPending ? <p className="notice small-notice">Official numbers or public agency details may be updated later.</p> : null}
        <div className="badge-row">
          {item.verification.filter((status) => status !== "mmips_reviewed").map((status) => <VerificationBadge key={status} status={status} />)}
        </div>
      </section>

      <section className="section check-grid">
        <div className="card">
          <h2>Official information checklist</h2>
          <table className="table"><tbody>
            <tr><th>Agency report/case number</th><td>{item.agencyCaseNumber ?? "Unknown"}</td></tr>
            <tr><th>NamUs number</th><td>{item.namusNumber ?? "Unknown"}</td></tr>
            <tr><th>NCIC status</th><td>{item.ncicStatus ?? "Unknown"}</td></tr>
            <tr><th>Tribe notified</th><td>{item.tribeNotified ?? "Unknown"}</td></tr>
            <tr><th>Family liaison</th><td>{item.familyLiaison ?? "Unknown"}</td></tr>
            <tr><th>Last public update</th><td>{item.lastPublicUpdate ?? "Unknown"}</td></tr>
          </tbody></table>
        </div>
        <div className="card">
          <h2>Map safety</h2>
          <p>Public location precision: <strong>{item.locationPrecision}</strong></p>
          <p className="muted">Exact private addresses, shelter locations, domestic violence locations, and sensitive minor locations should not be public.</p>
        </div>
      </section>

      <section className="card correction-cta">
        <h2>Need to correct or remove this public profile?</h2>
        <p>Family members, authorized advocates, tribal representatives, and official contacts can request corrections, safety edits, updated official contacts, status changes, or removal review.</p>
        <Link className="button secondary" href={`/corrections?profile=${encodeURIComponent(item.slug)}`}>Request correction/removal review</Link>
      </section>

      <section className="card flyer-cta">
        <h2>Print a flyer</h2>
        <p>Use a printer-friendly version for community sharing. It includes only the approved public information and the official contact information shown on this page.</p>
        <Link className="button secondary" href={`/profiles/${item.slug}/flyer`}>Open printable flyer</Link>
      </section>

      <ShareButtons
        title={item.fullName}
        path={`/profiles/${item.slug}`}
        imageUrl={item.photoUrl}
        statusLabel={title}
        lastSeenLocation={item.lastSeenLocation}
        lastSeenDate={item.lastSeenDate}
        age={item.age}
        tribalAffiliation={item.tribalAffiliation}
        leadAgency={item.leadAgency}
        agencyCaseNumber={item.agencyCaseNumber}
        namusNumber={item.namusNumber}
        tipPhone={item.tipPhone}
        summary={item.summary}
      />
    </main>
  );
}
