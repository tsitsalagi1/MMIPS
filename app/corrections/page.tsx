import { SafetyNotice } from "../../components/SafetyNotice";
import { TurnstileWidget } from "../../components/TurnstileWidget";

export default async function CorrectionRequestPage({
  searchParams
}: {
  searchParams?: Promise<{ case?: string; error?: string }>;
}) {
  const params = await searchParams;
  const caseSlug = params?.case || "";
  const error = params?.error;

  return (
    <main className="container section">
      <h1>Request a correction or removal</h1>
      <p className="lead">Families, authorized advocates, tribal representatives, and official contacts can ask MMIPS to correct, hide, or remove a public case page.</p>
      <SafetyNotice />
      <section className="notice">
        <strong>Safety rule:</strong> use this form for corrections, removal requests, consent questions, unsafe-location concerns, or updated official contact information. Do not submit public suspect accusations or rumors.
      </section>
      {error ? <div className="notice warning"><strong>Request error:</strong> {error}</div> : null}

      <form className="card form" action="/api/corrections" method="post">
        <h2>Case information</h2>
        <div className="check-grid">
          <label>Case page URL or slug<input name="case_reference" defaultValue={caseSlug} placeholder="/cases/example-slug or case name" /></label>
          <label>Request type
            <select name="request_type" required>
              <option value="correction">Correction</option>
              <option value="removal">Removal / hide request</option>
              <option value="unsafe_location">Unsafe location concern</option>
              <option value="consent_question">Consent / authorization concern</option>
              <option value="updated_tip_contact">Updated official tip contact</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <label>What needs to be changed, removed, or reviewed?<textarea name="request_details" required placeholder="Give the correction/removal request. Include only facts needed for review. Do not include private addresses or public accusations."></textarea></label>

        <h2>Your information</h2>
        <div className="check-grid">
          <label>Your name<input name="requester_name" required /></label>
          <label>Your email<input name="requester_email" type="email" required /></label>
          <label>Your relationship to the case
            <select name="relationship" required>
              <option value="family">Family member</option>
              <option value="authorized_advocate">Authorized advocate</option>
              <option value="tribal_representative">Tribal representative</option>
              <option value="law_enforcement">Law enforcement / agency</option>
              <option value="official_contact">Official case contact</option>
              <option value="other">Other / needs review</option>
            </select>
          </label>
          <label>Phone, optional<input name="requester_phone" /></label>
        </div>

        <h2>Required confirmations</h2>
        <label className="checkbox"><input type="checkbox" required name="confirm_good_faith" /> I am submitting this request in good faith for safety, privacy, accuracy, consent, or official-contact reasons.</label>
        <label className="checkbox"><input type="checkbox" required name="confirm_no_rumors" /> I have not included public suspect accusations, rumors, private addresses, graphic details, or information that could endanger the person/family/investigation.</label>
        <label className="checkbox"><input type="checkbox" required name="confirm_review" /> I understand MMIPS may contact me for verification and may delay, reject, or partially apply requests for safety, privacy, accuracy, or legal reasons.</label>
        <TurnstileWidget />
        <button type="submit">Send correction/removal request</button>
      </form>
    </main>
  );
}
