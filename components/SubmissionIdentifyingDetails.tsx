import { SUBMISSION_IDENTIFYING_FIELDS } from "@/lib/submission-identifying-details";

export function SubmissionIdentifyingDetails() {
  return (
    <section className="submission-identifying-details" aria-labelledby="submission-identifying-details-heading">
      <h2 id="submission-identifying-details-heading">Physical description and last-seen appearance</h2>
      <div className="notice soft">
        <strong>This section is part of the information you submit to MMIPS.</strong>
        <p>Nothing is sent while you are typing. When you choose Send, these optional details are stored privately with the submission for moderator review. They do not become public automatically. Leave anything unknown or unsafe to share blank.</p>
      </div>
      <div className="check-grid">
        {SUBMISSION_IDENTIFYING_FIELDS.map((field) => (
          <label key={field.name}>
            {field.label}
            {field.multiline
              ? <textarea name={field.name} maxLength={field.maxLength} rows={3} />
              : <input name={field.name} maxLength={field.maxLength} />}
          </label>
        ))}
      </div>
    </section>
  );
}
