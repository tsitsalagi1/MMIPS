import { SafetyNotice } from "../../components/SafetyNotice";
import { TurnstileWidget } from "../../components/TurnstileWidget";

export default async function CorrectionRequestPage({
  searchParams
}: {
  searchParams?: Promise<{ case?: string; profile?: string; error?: string }>;
}) {
  const params = await searchParams;
  const profileSlug = params?.profile || params?.case || "";
  const error = params?.error;

  return (
    <main className="container section plain-language-page">
      <h1>Request a correction or removal</h1>
      <p className="lead">If a public MMIPS profile is wrong, unsafe, outdated, or should not be public, you can ask us to review it.</p>
      <SafetyNotice />
      <section className="notice">
        <strong>Use this form for profile changes.</strong>
        <p>You can ask for a correction, removal, safer location wording, a consent review, or an updated official contact.</p>
        <p>Do not use this form for public accusations, rumors, or investigative tips.</p>
      </section>
      {error ? <div className="notice warning"><strong>We could not send the request.</strong><p>{error}</p></div> : null}

      <form className="card form" action="/api/corrections" method="post">
        <h2>Which profile needs review?</h2>
        <div className="check-grid">
          <label>Profile link or person's name<input name="case_reference" defaultValue={profileSlug} placeholder="Paste the profile link or enter the person's name" /></label>
          <label>What do you need?
            <select name="request_type" required>
              <option value="correction">Correct information</option>
              <option value="removal">Remove or hide the profile</option>
              <option value="unsafe_location">Fix an unsafe location</option>
              <option value="consent_question">Review consent or permission</option>
              <option value="updated_tip_contact">Update the official tip contact</option>
              <option value="other">Something else</option>
            </select>
          </label>
        </div>

        <label>Tell us what needs to change<textarea name="request_details" required placeholder="Tell us what is wrong, unsafe, outdated, or should be removed. Include only the facts we need to review the request. Do not include private addresses or public accusations."></textarea></label>

        <h2>How can we contact you?</h2>
        <div className="check-grid">
          <label>Your name<input name="requester_name" required /></label>
          <label>Your email<input name="requester_email" type="email" required /></label>
          <label>Your relationship to this profile
            <select name="relationship" required>
              <option value="family">Family member</option>
              <option value="authorized_advocate">Authorized advocate</option>
              <option value="tribal_representative">Tribal representative</option>
              <option value="law_enforcement">Law enforcement / agency</option>
              <option value="official_contact">Official information contact</option>
              <option value="other">Other / needs review</option>
            </select>
          </label>
          <label>Phone, optional<input name="requester_phone" /></label>
        </div>

        <h2>Before you send this request</h2>
        <label className="checkbox"><input type="checkbox" required name="confirm_good_faith" /> I am making this request in good faith to protect safety, privacy, accuracy, consent, or official contact information.</label>
        <label className="checkbox"><input type="checkbox" required name="confirm_no_rumors" /> I did not include public accusations, rumors, private addresses, graphic details, or information that could put someone at risk.</label>
        <label className="checkbox"><input type="checkbox" required name="confirm_review" /> I understand MMIPS may contact me to verify the request before making a public change.</label>
        <TurnstileWidget action="correction_request" />
        <button type="submit">Send correction or removal request</button>
      </form>
    </main>
  );
}
