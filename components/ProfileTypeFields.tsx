"use client";

import { useMemo, useState } from "react";

type ProfileType = "urgent_missing" | "missing" | "murdered_info_needed" | "unidentified";

function statusFor(type: ProfileType) {
  if (type === "murdered_info_needed") return "murdered_unsolved";
  if (type === "unidentified") return "unidentified";
  return "missing";
}

export function ProfileTypeFields() {
  const [profileType, setProfileType] = useState<ProfileType>("urgent_missing");
  const isUrgent = profileType === "urgent_missing";
  const isMurdered = profileType === "murdered_info_needed";

  const helpText = useMemo(() => {
    if (isUrgent) return "Use this when time matters and public awareness may need to move before every official number is available. MMIPS still requires official-contact routing and admin review.";
    if (isMurdered) return "Use this for remembrance and renewed visibility when the public can share official information to help generate new information for the listed official contact.";
    if (profileType === "unidentified") return "Use broad, non-graphic public information only. Do not upload graphic images or sensitive location details.";
    return "Use this for a missing-person public profile when more official information is already available.";
  }, [isUrgent, isMurdered, profileType]);

  return (
    <section className="profile-type-panel">
      <h2>Profile type</h2>
      <p className="muted">Choose the path that best fits the situation. The public profile and flyer will change tone based on this choice.</p>
      <div className="check-grid">
        <label>
          What are you submitting?
          <select
            name="profile_type"
            required
            value={profileType}
            onChange={(event) => setProfileType(event.currentTarget.value as ProfileType)}
          >
            <option value="urgent_missing">Urgent missing-person public awareness</option>
            <option value="missing">Missing-person public profile</option>
            <option value="murdered_info_needed">Murdered loved one / information needed</option>
            <option value="unidentified">Unidentified person public profile</option>
          </select>
        </label>
        <input type="hidden" name="status" value={statusFor(profileType)} />
        <input type="hidden" name="urgency_level" value={isUrgent ? "urgent_public_awareness" : isMurdered ? "renewed_visibility" : "standard"} />
        <label>
          Public status label
          <input value={isUrgent ? "Urgent public awareness" : isMurdered ? "Remembering / information needed" : profileType === "missing" ? "Missing" : "Unidentified"} readOnly aria-readonly="true" />
        </label>
      </div>
      <div className={isUrgent ? "notice urgent-soft" : "notice soft"}>
        <strong>{isUrgent ? "Urgent path" : isMurdered ? "Information-needed path" : "Public-awareness path"}</strong>
        <p>{helpText}</p>
      </div>

      {isUrgent ? (
        <div className="urgent-fields card inset-card">
          <h3>Urgent public-awareness planning</h3>
          <p className="muted">This helps MMIPS decide what broad area may need public awareness after admin review. It is not a prediction, a search plan, or a place to send tips.</p>
          <div className="check-grid">
            <label>Last known date and time<input name="last_known_datetime" type="datetime-local" /></label>
            <label>Time zone<input name="last_known_time_zone" placeholder="Example: America/Chicago or Central time" defaultValue="America/Chicago" /></label>
            <label>Likely travel mode<select name="likely_travel_mode" defaultValue="unknown"><option value="unknown">Unknown</option><option value="walking">Walking</option><option value="vehicle">Vehicle</option><option value="public_transit">Public transit</option><option value="bicycle">Bicycle</option><option value="other">Other</option></select></label>
            <label>Possible direction of travel<input name="possible_direction" placeholder="Example: possibly toward Hulbert / unknown" /></label>
            <label>Vehicle description, if already public/authorized<input name="vehicle_description" placeholder="Only if safe and authorized to publish or review" /></label>
            <label>Requested notification area<textarea name="notification_area_requested" placeholder="Example: Tahlequah, Park Hill, Hulbert, Cherokee County, bordering counties if no contact within 6 hours"></textarea></label>
          </div>
          <label>Private last-known details, admin-only optional<textarea name="last_known_location_private" placeholder="Exact/private details for admin review only. Do not include if unsafe or not authorized."></textarea></label>
          <label className="checkbox urgent-checkbox"><input type="checkbox" required name="confirm_report_first" /> I have contacted 911, Tribal law enforcement, local law enforcement, or another official agency, or I understand I must do so immediately.</label>
          <label className="checkbox urgent-checkbox"><input type="checkbox" required name="confirm_mmips_no_tips" /> I understand MMIPS does not collect or investigate tips. Any information should go to 911 or the listed official contact.</label>
          <label className="checkbox urgent-checkbox"><input type="checkbox" name="official_info_pending" /> Official report/NamUs/NCIC information may be added later.</label>
        </div>
      ) : null}

      {isMurdered ? (
        <div className="murdered-fields card inset-card">
          <h3>Remembering / information-needed profile</h3>
          <p className="muted">This profile type is for respectful visibility, official contact information, and public map trend awareness. It should not use urgent missing-person alert language.</p>
          <label>Public map area<textarea name="notification_area_requested" placeholder="Example: county, city, Tribal Nation area, or highway corridor for broad map/trend display"></textarea></label>
          <label className="checkbox"><input type="checkbox" name="official_info_pending" /> Official public information may be added later.</label>
        </div>
      ) : null}
    </section>
  );
}
