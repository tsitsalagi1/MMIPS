import { SafetyNotice } from "../../components/SafetyNotice";
import { TurnstileWidget } from "../../components/TurnstileWidget";
import { PhotoPermissionUpload } from "../../components/PhotoPermissionUpload";
import { ProfileTypeFields } from "../../components/ProfileTypeFields";

export default async function SubmitPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="container section">
      <h1>Submit information for review</h1>
      <p className="lead">Submissions are reviewed before anything is published. This form is for public awareness only and does not replace emergency reporting or official missing-person systems.</p>
      <SafetyNotice />
      {error ? <div className="notice warning"><strong>Submission error:</strong> {error}</div> : null}
      <form className="card form" data-submit-info-form="true" action="/api/submissions" method="post" encType="multipart/form-data">
        <ProfileTypeFields />

        <h2>Person and public-awareness information</h2>
        <div className="check-grid">
          <label>Person's full name<input name="full_name" required /></label>
          <label>Age<input name="age" type="number" min="0" /></label>
          <label>Tribal affiliation, if family approves<input name="tribal_affiliation" /></label>
          <label>Last seen / public location date<input name="last_seen_date" type="date" /></label>
          <label>Public location text<input name="last_seen_location" required placeholder="Example: Tahlequah area, Cherokee County, or location withheld for safety" /></label>
          <label>Lead agency<input name="lead_agency" placeholder="Police, sheriff, tribal police, FBI, BIA MMU..." /></label>
          <label>Agency report/case number<input name="agency_case_number" /></label>
          <label>NamUs number or link<input name="namus_number" /></label>
          <label>Official tip phone / link<input name="tip_contact" placeholder="Send public information to this official contact, not MMIPS" /></label>
        </div>
        <label>Summary of verified public facts<textarea name="summary" required placeholder="Use facts only. No suspect accusations, rumors, private addresses, or sensitive location details."></textarea></label>

        <h2>Photos, flyer preview, and image permissions</h2>
        <PhotoPermissionUpload />

        <h2>Submitter information</h2>
        <div className="check-grid">
          <label>Your name<input name="submitter_name" required /></label>
          <label>Your email<input name="submitter_email" type="email" required /></label>
          <label>Your relationship<select name="relationship" required><option value="family">Family member</option><option value="authorized_advocate">Authorized advocate</option><option value="tribal_representative">Tribal representative</option><option value="law_enforcement">Law enforcement / agency</option><option value="other">Other / needs review</option></select></label>
          <label>Phone, optional<input name="submitter_phone" /></label>
        </div>

        <h2>Required safety confirmations</h2>
        <label className="checkbox"><input type="checkbox" required name="confirm_not_law_enforcement" /> I understand MMIPS is not law enforcement and this does not replace calling 911, filing a police report, contacting tribal/local/federal authorities, or submitting to NamUs.</label>
        <label className="checkbox"><input type="checkbox" required name="confirm_authorized" /> I am a family member, authorized advocate, legal representative, tribal representative, law-enforcement representative, or I have permission to submit this information for public awareness.</label>
        <label className="checkbox"><input type="checkbox" required name="confirm_no_rumors" /> I have not included suspect accusations, rumors, exact private addresses, graphic details, or information that could endanger the person/family/investigation.</label>
        <label className="checkbox"><input type="checkbox" required name="confirm_review" /> I understand MMIPS may edit, delay, reject, hide, or remove submissions for safety, privacy, accuracy, or legal reasons.</label>
        <TurnstileWidget />
        <button type="submit">Submit for review</button>
      </form>
    </main>
  );
}
