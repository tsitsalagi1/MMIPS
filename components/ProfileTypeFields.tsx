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
    if (isUrgent) return "Choose this when a person is missing now and approved public awareness may need to move quickly. MMIPS still reviews the information before anything becomes public.";
    if (isMurdered) return "Choose this to remember a loved one and share approved information when the public may be able to help the official investigating agency.";
    if (profileType === "unidentified") return "Choose this for an unidentified person. Share only non-graphic information that is safe for the public.";
    return "Choose this for a missing-person public profile when the case is not using the urgent alert path.";
  }, [isUrgent, isMurdered, profileType]);

  return (
    <section className="profile-type-panel">
      <h2>What kind of public profile do you need?</h2>
      <p className="muted reading-measure">Choose the option that best fits the situation. This helps MMIPS use the right wording and safety review.</p>
      <div className="check-grid">
        <label>
          Profile type
          <select
            name="profile_type"
            required
            value={profileType}
            onChange={(event) => setProfileType(event.currentTarget.value as ProfileType)}
          >
            <option value="urgent_missing">Missing now — urgent public awareness</option>
            <option value="missing">Missing person — public profile</option>
            <option value="murdered_info_needed">Murdered loved one — information needed</option>
            <option value="unidentified">Unidentified person — public profile</option>
          </select>
        </label>
        <input type="hidden" name="status" value={statusFor(profileType)} />
        <input type="hidden" name="urgency_level" value={isUrgent ? "urgent_public_awareness" : isMurdered ? "renewed_visibility" : "standard"} />
        <label>
          Public label
          <input value={isUrgent ? "Urgent public awareness" : isMurdered ? "Remembering / information needed" : profileType === "missing" ? "Missing" : "Unidentified"} readOnly aria-readonly="true" />
        </label>
      </div>
      <div className={isUrgent ? "notice urgent-soft" : "notice soft"}>
        <strong>{isUrgent ? "Urgent missing-person profile" : isMurdered ? "Remembering / information-needed profile" : "Public-awareness profile"}</strong>
        <p>{helpText}</p>
      </div>

      {isUrgent ? (
        <div className="urgent-fields card inset-card">
          <h3>Helpful details for an urgent alert</h3>
          <p className="muted reading-measure">These details help MMIPS decide what broad area may need public awareness after review. They are not a search plan or a place to send tips.</p>
          <div className="check-grid">
            <label>Last known date and time<input name="last_known_datetime" type="datetime-local" /></label>
            <label>Time zone<input name="last_known_time_zone" placeholder="Example: Central time" defaultValue="America/Chicago" /></label>
            <label>How the person may be traveling<select name="likely_travel_mode" defaultValue="unknown"><option value="unknown">Unknown</option><option value="walking">Walking</option><option value="vehicle">Vehicle</option><option value="public_transit">Public transit</option><option value="bicycle">Bicycle</option><option value="other">Other</option></select></label>
            <label>Possible direction, if known<input name="possible_direction" placeholder="Example: possibly toward Hulbert, or unknown" /></label>
            <label>Vehicle description, if safe to share<input name="vehicle_description" placeholder="Include only information approved for public review" /></label>
            <label>Broad area that may need the alert<textarea name="notification_area_requested" placeholder="Example: Tahlequah, Park Hill, Hulbert, and nearby Cherokee County areas"></textarea></label>
          </div>
          <label>Private last-known details, optional<textarea name="last_known_location_private" placeholder="Only include exact/private details if MMIPS needs them for review and it is safe and authorized to share them privately."></textarea></label>
          <p className="field-help">Private last-known details are for MMIPS review only and must never be copied into a public profile unless they are separately approved as safe public information.</p>
          <label className="checkbox urgent-checkbox"><input type="checkbox" required name="confirm_report_first" /> I have contacted an official agency, or I understand I must do that immediately.</label>
          <label className="checkbox urgent-checkbox"><input type="checkbox" required name="confirm_mmips_no_tips" /> I understand MMIPS is not a tip line. Tips go to 911 or the official contact.</label>
          <label className="checkbox urgent-checkbox"><input type="checkbox" name="official_info_pending" /> Some official case information may be added later.</label>
        </div>
      ) : null}

      {isMurdered ? (
        <div className="murdered-fields card inset-card">
          <h3>Remembering and information needed</h3>
          <p className="muted reading-measure">This profile is for respectful public awareness and official information sharing. It does not use urgent missing-person alert language.</p>
          <label>Broad public area<textarea name="notification_area_requested" placeholder="Example: city, county, Tribal Nation area, or highway corridor"></textarea></label>
          <label className="checkbox"><input type="checkbox" name="official_info_pending" /> Some official public information may be added later.</label>
        </div>
      ) : null}
    </section>
  );
}
