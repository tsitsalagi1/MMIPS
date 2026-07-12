import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStatusBadge, VerificationBadge } from "../../../../components/StatusBadge";
import { FlyerActions } from "../../../../components/FlyerActions";
import { getCaseBySlug } from "../../../../lib/cases";
import { flyerTitleForProfile } from "../../../../lib/status";

export const dynamic = "force-dynamic";

export default async function ProfileFlyerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mmips.com";
  const profileUrl = `${siteUrl}/profiles/${item.slug}`;
  const flyerTitle = flyerTitleForProfile(item.profileType, item.status);
  const isUrgent = item.profileType === "urgent_missing";
  const isMurdered = item.profileType === "murdered_info_needed";

  return (
    <main className="flyer-page">
      <div className="flyer-shell">
        <div className="flyer-top no-print">
          <Link className="button secondary" href={`/profiles/${item.slug}`}>Back to public profile</Link>
          <FlyerActions
            title={item.fullName}
            statusLabel={flyerTitle}
            profileUrl={profileUrl}
            imageUrl={item.photoUrl}
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
        </div>

        <article className={`flyer-sheet flyer-${item.profileType}`} aria-label={`${item.fullName} printable flyer`}>
          <header className="flyer-header">
            <img src="/mmips-hand-transparent.png" alt="" aria-hidden="true" />
            <div>
              <p className="flyer-eyebrow">MMIPS public awareness flyer</p>
              <h1>{flyerTitle}</h1>
            </div>
          </header>

          {isUrgent ? <p className="flyer-urgent-note">Public awareness may be time-sensitive. Contact the official agency/tip line below or call 911 in an emergency. MMIPS does not collect tips.</p> : null}
          {isMurdered ? <p className="flyer-urgent-note soft-note">Shared for remembrance, visibility, and official information routing. Send information to the listed official contact.</p> : null}

          <section className="flyer-main-grid">
            <div className="flyer-photo-box">
              <img src={item.photoUrl || "/mmips-hand-white-bg.png"} alt={item.photoAltText || `${item.fullName} public profile image`} />
            </div>
            <div className="flyer-case-summary">
              <div className="case-header-line">
                <h2>{item.fullName}</h2>
                <CaseStatusBadge status={item.status} />
              </div>
              <p><strong>{isMurdered ? "Public area" : "Last seen / location"}:</strong> {item.lastSeenLocation}</p>
              {item.lastSeenDate ? <p><strong>Date:</strong> {item.lastSeenDate}</p> : null}
              {item.lastKnownDatetime ? <p><strong>Last known time:</strong> {item.lastKnownDatetime}{item.lastKnownTimeZone ? ` (${item.lastKnownTimeZone})` : ""}</p> : null}
              <p><strong>Age:</strong> {item.age ?? "Unknown"}</p>
              <p><strong>Tribal affiliation:</strong> {item.tribalAffiliation || "Not publicly listed"}</p>
              <p><strong>Lead agency:</strong> {item.leadAgency || "Unknown"}</p>
              <p><strong>Agency report/case #:</strong> {item.agencyCaseNumber || "Unknown"}</p>
              <p><strong>NamUs #:</strong> {item.namusNumber || "Unknown"}</p>
            </div>
          </section>

          {(isUrgent || item.notificationAreaRequested) ? (
            <section className="flyer-notice-box">
              <h3>{isMurdered ? "Map / visibility area" : "Public-awareness area"}</h3>
              <p>{item.notificationAreaRequested || item.lastSeenLocation}</p>
              {item.likelyTravelMode ? <p><strong>Likely travel mode:</strong> {item.likelyTravelMode}</p> : null}
              {item.possibleDirection ? <p><strong>Possible direction:</strong> {item.possibleDirection}</p> : null}
              <p className="muted">This is a broad awareness area only. It is not a search plan or prediction.</p>
            </section>
          ) : null}

          <section className="flyer-notice-box">
            <h3>Official contact / emergency information</h3>
            <p>{item.tipPhone || "Call 911 for emergencies. Use only the official tip line listed by the agency."}</p>
            <p className="muted">MMIPS does not collect tips. Do not post rumors, suspect accusations, or unsafe private-location details publicly.</p>
          </section>

          <section className="flyer-notice-box">
            <h3>Public summary</h3>
            <p>{item.summary}</p>
          </section>

          {item.verification.filter((status) => status !== "mmips_reviewed").length ? (
            <section className="flyer-verification-row" aria-label="Public source notes">
              {item.verification.filter((status) => status !== "mmips_reviewed").map((status) => <VerificationBadge key={status} status={status} />)}
            </section>
          ) : null}

          <section className="flyer-case-link-box" aria-label="Online public profile link">
            <p className="flyer-link-label">View the live MMIPS public profile</p>
            <a className="flyer-case-link" href={profileUrl}>{profileUrl}</a>
            <p className="muted small-text">Check this live profile before sharing an older flyer. Status and official-contact information may change.</p>
          </section>

          <footer className="flyer-footer">
            <p><strong>MMIPS is not law enforcement.</strong> This flyer does not replace 911, a police report, NamUs, Tribal law enforcement, BIA MMU, FBI, or local authorities.</p>
            <p>Correction/removal requests: corrections@mmips.com · General contact: contact@mmips.com</p>
          </footer>
        </article>
      </div>
    </main>
  );
}
