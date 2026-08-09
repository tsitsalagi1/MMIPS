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
  const isSynthetic = item.slug.startsWith("mmips-test-");

  return (
    <main className="container section public-profile-page">
      {isSynthetic ? <p className="synthetic-test-banner"><strong>SYNTHETIC TEST DATA</strong> — This is a fictional rehearsal profile, not a real person or real case. Do not send real tips.</p> : null}
      <div className={`profile-hero profile-hero-${item.profileType}`}>
        <div>
          <p className="muted">MMIPS public profile</p>
          <h1>{item.fullName}</h1>
          <p className="reading-measure">{profileIntroForType(item.profileType)}</p>
        </div>
        <div className="badge-stack"><ProfileTypeBadge profileType={item.profileType} /><CaseStatusBadge status={item.status} /></div>
      </div>
      <SafetyNotice />

      {isUrgent ? (
        <section className="notice urgent-soft">
          <strong>Urgent public awareness</strong>
          <p>Official details may still change. MMIPS does not collect tips or direct searches. Send information to the official contact below, or call 911 for immediate danger.</p>
        </section>
      ) : null}

      {isMurdered ? (
        <section className="notice soft">
          <strong>Remembering / information needed</strong>
          <p>This profile supports remembrance, public awareness, and official information sharing. It does not use urgent missing-person alerts.</p>
        </section>
      ) : null}

      <section className="card public-photo-card">
        <div className="public-photo-wrap">
          <img src={item.photoUrl || "/placeholder-person.svg"} alt={item.photoAltText || `${item.fullName} public profile image`} />
        </div>
        <p className="muted small-text">Images appear only after approval for public display. Family members and authorized contacts can request removal or changes.</p>
      </section>

      {item.photos && item.photos.length > 1 ? (
        <section className="card public-gallery-card">
          <h2>Additional approved photos</h2>
          <p className="muted reading-measure">These photos were approved for public display to help with recognition. Please share the approved profile or flyer without adding rumors, accusations, or private-location details.</p>
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

      <section className="feature-grid profile-primary-facts" aria-label="Key public information">
        <div className="card"><h3>{isMurdered ? "Public area" : "Last seen / public area"}</h3><p>{item.lastSeenLocation}</p><p className="muted">{item.publicLocationNote}</p></div>
        <div className="card"><h3>Official contact</h3><p><strong>Agency:</strong> {item.leadAgency ?? "Not listed yet"}</p><p><strong>Case number:</strong> {item.agencyCaseNumber ?? "Not listed yet"}</p></div>
        <div className="card"><h3>If you have information</h3><p>{item.tipPhone ?? "Use the listed official agency contact, or call 911 for immediate danger."}</p><p className="muted">Do not send investigative tips to MMIPS or post public accusations.</p></div>
      </section>

      {(isUrgent || item.notificationAreaRequested || item.likelyTravelMode) ? (
        <section className="card alert-planning-public">
          <h2>{isMurdered ? "Public map / visibility area" : "Public awareness area"}</h2>
          <p>{item.notificationAreaRequested || "A broad awareness area is not publicly listed yet."}</p>
          {item.lastKnownDatetime ? <p><strong>Last known date/time:</strong> {item.lastKnownDatetime}{item.lastKnownTimeZone ? ` (${item.lastKnownTimeZone})` : ""}</p> : null}
          {item.likelyTravelMode ? <p><strong>Possible travel:</strong> {item.likelyTravelMode}</p> : null}
          {item.possibleDirection ? <p><strong>Possible direction:</strong> {item.possibleDirection}</p> : null}
          <p className="muted reading-measure">This area is only for broad public awareness. It is not an exact location, prediction, search plan, or official investigative finding.</p>
        </section>
      ) : null}

      <section className="card">
        <h2>What is publicly known</h2>
        <p className="reading-measure">{item.summary}</p>
        {item.officialInfoPending ? <p className="notice small-notice">Some official case numbers or agency details may be added later.</p> : null}
        <div className="badge-row">
          {item.verification.filter((status) => status !== "mmips_reviewed").map((status) => <VerificationBadge key={status} status={status} />)}
        </div>
      </section>

      {item.officialSources?.length ? (
        <section className="card official-source-card">
          <h2>Official source</h2>
          <p className="reading-measure">MMIPS reviewed this profile against the public source below. The official agency remains the source for case updates and investigative tips.</p>
          <ul>
            {item.officialSources.map((source) => (
              <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer noopener">{source.label}</a></li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="section check-grid profile-reference-grid">
        <div className="card">
          <h2>Official case details</h2>
          <dl className="profile-facts">
            <div><dt>Agency case number</dt><dd>{item.agencyCaseNumber ?? "Not listed yet"}</dd></div>
            <div><dt>NamUs number</dt><dd>{item.namusNumber ?? "Not listed yet"}</dd></div>
            <div><dt>NCIC status</dt><dd>{item.ncicStatus ?? "Not listed yet"}</dd></div>
            <div><dt>Tribe notified</dt><dd>{item.tribeNotified ?? "Not listed yet"}</dd></div>
            <div><dt>Family liaison</dt><dd>{item.familyLiaison ?? "Not listed yet"}</dd></div>
            <div><dt>Last public update</dt><dd>{item.lastPublicUpdate ?? "Not listed yet"}</dd></div>
          </dl>
        </div>
        <div className="card">
          <h2>Location privacy</h2>
          <p><strong>Public location detail:</strong> {item.locationPrecision}</p>
          <p className="muted reading-measure">MMIPS should not publish exact private addresses, shelter locations, domestic-violence locations, or other sensitive locations that could put someone at risk.</p>
        </div>
      </section>

      <section className="card correction-cta">
        <h2>Need to correct or remove this profile?</h2>
        <p className="reading-measure">Family members, authorized advocates, Tribal representatives, and official contacts can ask MMIPS to correct information, hide unsafe details, update official contacts, change status, or review removal.</p>
        <Link className="button secondary" href={`/corrections?profile=${encodeURIComponent(item.slug)}`}>Request a correction or removal</Link>
      </section>

      <section className="card flyer-cta">
        <h2>Print or share a flyer</h2>
        <p className="reading-measure">The printable flyer uses only the approved public information and official contact details shown on this profile.</p>
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
