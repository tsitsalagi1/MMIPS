import { TurnstileWidget } from "@/components/TurnstileWidget";
import { CanadaProvinceTerritoryOptions } from "@/components/CanadaProfilesSearch";
import type { SubmissionIntakeMode } from "@/lib/release-controls";

export function CanadaSubmissionForm({ mode }: { mode: SubmissionIntakeMode }) {
  return (
    <form className="card form" action="/api/submissions" method="post" encType="multipart/form-data" data-canada-submit-form="true">
      {mode === "synthetic" ? <input type="hidden" name="synthetic_rehearsal" value="true" /> : null}
      {mode === "synthetic" ? <div className="notice warning"><strong>Synthetic rehearsal only.</strong><p>Use fictional information only. Do not enter a real person, real family contact, real police file, real photograph, private address, or investigative information.</p></div> : null}

      <h2>Information about the person</h2>
      <div className="check-grid">
        <label>Person&apos;s full name<input name="full_name" required maxLength={200} /></label>
        <label>Age, if known<input name="age" type="number" min="0" max="130" /></label>
        <label>Case status<select name="status" defaultValue="missing" required><option value="missing">Missing</option><option value="homicide_unsolved">Homicide / information needed</option><option value="unidentified">Unidentified person</option><option value="resolved">Resolved / located</option><option value="unknown">Other / needs review</option></select></label>
        <label>Last seen date, if known<input name="last_seen_date" type="date" /></label>
        <label>Last-seen locality<input name="last_seen_locality" required placeholder="City, community, reserve, settlement, or broad locality" maxLength={300} /></label>
        <label>Province or territory<select name="last_seen_province_territory" required defaultValue=""><option value="" disabled>Choose one</option><CanadaProvinceTerritoryOptions /></select></label>
        <label>Canadian postal code, optional<input name="last_seen_postal_code" autoComplete="postal-code" placeholder="K1A 0B1" maxLength={7} /></label>
        <label>Safe public area wording, optional<input name="last_seen_area_public_proposed" placeholder="Example: Saskatoon area, SK" maxLength={500} /></label>
      </div>
      <label>Public facts for MMIPS to review<textarea name="public_summary_proposed" required maxLength={8000} placeholder="Facts only. Do not include public suspect accusations, private addresses, graphic details, or information that could put someone at risk." /></label>

      <h2>Police / official information</h2>
      <p className="field-help">MMIPS Canada does not replace a police report and does not collect investigative tips for police.</p>
      <div className="check-grid">
        <label>Lead police service, if known<input name="lead_police_service" maxLength={300} /></label>
        <label>Police file number, if appropriate to share for review<input name="police_file_number" maxLength={200} /></label>
        <label>Official public tip contact, if available<input name="official_tip_contact" maxLength={500} placeholder="Police phone number or official public link" /></label>
      </div>

      <h2>First Nations, Inuit or Métis affiliation</h2>
      <p className="field-help">This information can be sensitive. Leave it blank if it should not be collected or shown.</p>
      <div className="check-grid">
        <label>Affiliation type<select name="affiliation_type" defaultValue=""><option value="">Not provided</option><option value="first_nation">First Nation</option><option value="inuit">Inuit</option><option value="metis">Métis</option><option value="multiple">Multiple</option><option value="self_described">Self-described</option><option value="not_disclosed">Not disclosed</option></select></label>
        <label>Nation / people name, if appropriate<input name="preferred_people_or_nation_name" maxLength={300} /></label>
        <label>Community name, if appropriate<input name="preferred_community_name" maxLength={300} /></label>
        <label>Inuit region, if appropriate<input name="inuit_region" maxLength={300} /></label>
        <label>Métis government or community, if appropriate<input name="metis_government_or_community" maxLength={300} /></label>
      </div>
      <label className="checkbox"><input type="checkbox" name="permission_to_publish_affiliation" /> I confirm this affiliation information may be considered for public display. MMIPS must still review it before publication.</label>

      <h2>Photos, optional</h2>
      <p className="field-help">Photos are stored privately for review and are not public automatically. Upload JPEG, PNG, or WebP only.</p>
      <label>Photos<input name="profile_photos" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
      <label>Photo description / alt text<input name="photo_alt_text" maxLength={500} /></label>
      <label className="checkbox"><input type="checkbox" name="confirm_photo_permission" /> If I upload photos, I have permission to share them with MMIPS Canada for review.</label>

      <h2>Your contact information</h2>
      <p className="field-help">This is private review information. It is not placed on a public profile.</p>
      <div className="check-grid">
        <label>Your name<input name="submitter_name" required maxLength={200} /></label>
        <label>Your email<input name="submitter_email" type="email" required maxLength={320} /></label>
        <label>Your phone, optional<input name="submitter_phone" maxLength={100} /></label>
        <label>Your relationship<select name="relationship" required defaultValue="family"><option value="family">Family member</option><option value="authorized_advocate">Authorized advocate</option><option value="first_nation_inuit_metis_representative">First Nation / Inuit / Métis representative</option><option value="police_or_official">Police / official agency contact</option><option value="other">Other / needs review</option></select></label>
      </div>
      <label>Why are you authorized to submit this information?<textarea name="authority_basis" required maxLength={1000} placeholder="Example: immediate family member; authorized family advocate; community representative acting with family permission; investigating agency contact." /></label>
      <label>Consent language<select name="consent_language" defaultValue="en"><option value="en">English</option><option value="fr">Français</option></select></label>

      <h2>Before you send</h2>
      <label className="checkbox"><input type="checkbox" name="confirm_official_reporting" required /> I understand MMIPS is not police or an emergency service. If the person is missing, official reporting should begin as soon as there is concern for their safety.</label>
      <label className="checkbox"><input type="checkbox" name="confirm_authority" required /> I am authorized to provide this information, or I am asking MMIPS to verify my authority before anything becomes public.</label>
      <label className="checkbox"><input type="checkbox" name="confirm_public_review" required /> I understand nothing is published automatically. Public profile, affiliation, photo, and map release are separate moderator decisions.</label>
      <label className="checkbox"><input type="checkbox" name="confirm_privacy" required /> I understand I can later ask MMIPS to review a correction, suppression, withdrawal of consent, or deletion/de-identification request when appropriate.</label>
      <label className="checkbox"><input type="checkbox" name="map_requested" defaultChecked /> If the case is approved, I am asking MMIPS to consider an approximate public-awareness map area. The moderator may keep the map off.</label>

      <TurnstileWidget action="canada_submission_intake" />
      <button type="submit">Send information for private review</button>
    </form>
  );
}
