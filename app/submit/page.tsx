import { CanadaSubmitStatus } from "../../components/CanadaSubmitStatus";
import { SafetyNotice } from "../../components/SafetyNotice";
import { TurnstileWidget } from "../../components/TurnstileWidget";
import { PhotoPermissionUpload } from "../../components/PhotoPermissionUpload";
import { ProfileTypeFields } from "../../components/ProfileTypeFields";
import { SubmissionReviewGate } from "../../components/SubmissionReviewGate";
import { submissionIntakeModeFromEnv } from "../../lib/release-controls";
import { mmipsSiteMode } from "../../lib/site-mode";

export default async function SubmitPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;
  if (mmipsSiteMode() === "ca") return <CanadaSubmitStatus error={error} />;

  const intakeMode = submissionIntakeModeFromEnv();

  return (
    <main className="container section plain-language-page">
      <h1>Submit information for review</h1>
      <p className="lead">Use this form to ask MMIPS to review information for public awareness. Nothing becomes public automatically.</p>
      <SafetyNotice />
      {error ? <div className="notice warning"><strong>We could not process the submission.</strong><p>{error}</p></div> : null}
      {intakeMode === "locked" ? (
        <div className="card notice warning" role="status" aria-live="polite">
          <h2>New submissions are temporarily paused</h2>
          <p>MMIPS is completing its launch safety and privacy checks before accepting real family or case information.</p>
          <p>Please do not send private case details by email while intake is paused. For emergencies or immediate danger, call 911. Continue using Tribal, local, state, or federal law-enforcement reporting channels and NamUs as appropriate.</p>
        </div>
      ) : (
        <>
          {intakeMode === "synthetic" ? (
            <div className="card notice warning" role="alert">
              <h2>Synthetic rehearsal only</h2>
              <p>This protected test environment accepts fictional MMIPS rehearsal data only. Do not enter any real person, family, case, witness, subscriber, requester, or investigative information.</p>
            </div>
          ) : null}
          <form className="card form" data-submit-info-form="true" action="/api/submissions" method="post" encType="multipart/form-data">
            {intakeMode === "synthetic" ? <input type="hidden" name="synthetic_rehearsal" value="true" /> : null}
            <ProfileTypeFields />

            <h2>Information about the person</h2>
            <p className="field-help">Enter only information that is safe and authorized for MMIPS to review. You can leave optional fields blank.</p>
            <div className="check-grid">
              <label>Person's full name<input name="full_name" required /></label>
              <label>Age, if known<input name="age" type="number" min="0" /></label>
              <label>Tribal affiliation, if approved to share<input name="tribal_affiliation" /></label>
              <label>Last seen date, if known<input name="last_seen_date" type="date" /></label>
              <label>Safe public location description<input name="last_seen_location" required placeholder="Example: Tahlequah area, Cherokee County, or location withheld for safety" /></label>
              <label>Lead investigating agency, if known<input name="lead_agency" placeholder="Example: Tribal police, sheriff, police department, FBI, or BIA MMU" /></label>
              <label>Agency case number, if known<input name="agency_case_number" /></label>
              <label>NamUs number or link, if known<input name="namus_number" /></label>
              <label>Official tip phone or link, if public<input name="tip_contact" placeholder="Use the official agency contact, not MMIPS" /></label>
            </div>
            <label>Public facts MMIPS should review<textarea name="summary" required placeholder="Use facts only. Do not include rumors, public accusations, private addresses, or sensitive locations."></textarea></label>

            <h2>Photos</h2>
            <p className="field-help">Upload only photos you have permission to share with MMIPS for review.</p>
            <PhotoPermissionUpload />

            <h2>Your contact information</h2>
            <p className="field-help">MMIPS uses this information to review the submission and contact you if clarification is needed. It is not published on the public profile.</p>
            <div className="check-grid">
              <label>Your name<input name="submitter_name" required /></label>
              <label>Your email<input name="submitter_email" type="email" required /></label>
              <label>Your relationship to the person or case<select name="relationship" required><option value="family">Family member</option><option value="authorized_advocate">Authorized advocate</option><option value="tribal_representative">Tribal representative</option><option value="law_enforcement">Law enforcement / agency</option><option value="other">Other / needs review</option></select></label>
              <label>Phone, optional<input name="submitter_phone" /></label>
            </div>

            <h2>Before you send</h2>
            <p className="field-help">Please confirm each statement. These checks help protect the person, family, and investigation.</p>
            <label className="checkbox"><input type="checkbox" required name="confirm_not_law_enforcement" /> I understand MMIPS is not law enforcement and does not replace 911, an official report, or NamUs.</label>
            <label className="checkbox"><input type="checkbox" required name="confirm_authorized" /> I am authorized to send this information for public-awareness review, or I am asking MMIPS to verify my authority before anything becomes public.</label>
            <label className="checkbox"><input type="checkbox" required name="confirm_no_rumors" /> I did not include rumors, public accusations, private addresses, graphic details, or information that could put someone at risk.</label>
            <label className="checkbox"><input type="checkbox" required name="confirm_review" /> I understand MMIPS may edit, delay, reject, hide, or remove information for safety, privacy, accuracy, or legal reasons.</label>
            <TurnstileWidget action="submission_intake" />
            <SubmissionReviewGate />
          </form>
        </>
      )}
    </main>
  );
}
