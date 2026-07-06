import { SafetyNotice } from "../../components/SafetyNotice";
import { TurnstileWidget } from "../../components/TurnstileWidget";

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
      <form className="card form" action="/api/submissions" method="post" encType="multipart/form-data">
        <h2>Person and public-awareness information</h2>
        <div className="check-grid">
          <label>Person's full name<input name="full_name" required /></label>
          <label>Age<input name="age" type="number" min="0" /></label>
          <label>Status<select name="status" required><option value="missing">Missing</option><option value="murdered_unsolved">Murdered / Unsolved</option><option value="unidentified">Unidentified</option><option value="unknown">Unknown</option></select></label>
          <label>Tribal affiliation, if family approves<input name="tribal_affiliation" /></label>
          <label>Last seen date<input name="last_seen_date" type="date" /></label>
          <label>Last seen city/county/state<input name="last_seen_location" required /></label>
          <label>Lead agency<input name="lead_agency" placeholder="Police, sheriff, tribal police, FBI, BIA MMU..." /></label>
          <label>Agency report/case number<input name="agency_case_number" /></label>
          <label>NamUs number or link<input name="namus_number" /></label>
          <label>Official tip phone / link<input name="tip_contact" /></label>
        </div>
        <label>Summary of verified public facts<textarea name="summary" required placeholder="Use facts only. No suspect accusations, rumors, or private addresses."></textarea></label>

        <h2>Photo or flyer, optional</h2>
        <section className="upload-panel">
          <p className="muted">Upload one family-approved photo, public flyer, or awareness image. Images stay private until an admin reviews and approves the submission.</p>
          <label>Photo or flyer
            <input name="case_photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
          </label>
          <label>Image description / alt text
            <input name="photo_alt_text" placeholder="Example: family-approved photo of the missing person, or official public flyer" />
          </label>
          <label className="checkbox"><input type="checkbox" name="confirm_photo_permission" /> If I uploaded an image, I have permission to share it with MMIPS for review and possible public posting after approval.</label>
          <p className="small-text muted">Allowed image types: JPG, PNG, WebP, or GIF. Maximum size: 5 MB. Do not upload graphic images, private addresses, or images that could endanger the person/family/investigation.</p>
        </section>

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
