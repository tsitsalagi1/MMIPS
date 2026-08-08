"use client";

import { useEffect, useRef, useState } from "react";

type ReviewItem = { label: string; value: string };

const fields: Array<[string, string]> = [
  ["full_name", "Person"],
  ["profile_type", "Profile type"],
  ["tribal_affiliation", "Tribal affiliation"],
  ["last_seen_date", "Public date"],
  ["last_seen_location", "Public location"],
  ["lead_agency", "Lead agency"],
  ["agency_case_number", "Agency report/case #"],
  ["namus_number", "NamUs"],
  ["tip_contact", "Official tip contact"],
  ["summary", "Verified public summary"],
  ["submitter_name", "Submitter"],
  ["submitter_email", "Submitter email"],
  ["relationship", "Relationship"]
];

function textValue(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function SubmissionReviewGate() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reviewed, setReviewed] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [photoNames, setPhotoNames] = useState<string[]>([]);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const invalidate = () => setReviewed(false);
    form.addEventListener("input", invalidate);
    form.addEventListener("change", invalidate);
    return () => {
      form.removeEventListener("input", invalidate);
      form.removeEventListener("change", invalidate);
    };
  }, []);

  function review() {
    const form = rootRef.current?.closest("form") as HTMLFormElement | null;
    if (!form || !form.reportValidity()) return;
    const data = new FormData(form);
    setItems(fields.flatMap(([name, label]) => {
      const value = textValue(data, name);
      return value ? [{ label, value }] : [];
    }));
    setPhotoNames(data.getAll("profile_photos").flatMap((value) => value instanceof File && value.size ? [value.name] : []));
    setReviewed(true);
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div ref={rootRef} className="submission-review-gate">
      {!reviewed ? (
        <div className="notice">
          <strong>Review before sending.</strong>
          <p>Nothing is submitted yet. Use the review step to catch spelling, public-location, agency-contact, photo, or consent mistakes before MMIPS receives the information.</p>
          <button type="button" onClick={review}>Review submission</button>
        </div>
      ) : (
        <section className="card" aria-labelledby="submission-review-heading">
          <p className="eyebrow">Final review</p>
          <h2 id="submission-review-heading">Check what you are about to send</h2>
          <p className="muted">Private moderator-only fields are not repeated in this summary. You can still scroll up and edit anything. Any edit will require a fresh review.</p>
          <dl className="review-list">
            {items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            <div><dt>Photos selected</dt><dd>{photoNames.length ? photoNames.join(", ") : "None"}</dd></div>
          </dl>
          <div className="notice warning">
            <strong>One last safety check:</strong> do not submit suspect accusations, rumors, exact private addresses, shelter/family locations, graphic details, or information that could endanger a person, family, witness, or investigation.
          </div>
          <div className="button-row">
            <button type="submit">Confirm and submit for review</button>
            <button type="button" className="button secondary" onClick={() => setReviewed(false)}>Go back and edit</button>
          </div>
        </section>
      )}
    </div>
  );
}
