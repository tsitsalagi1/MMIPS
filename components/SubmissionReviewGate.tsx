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
  ["agency_case_number", "Agency case number"],
  ["namus_number", "NamUs"],
  ["tip_contact", "Official tip contact"],
  ["height_description", "Height"],
  ["weight_description", "Weight"],
  ["build_description", "Build"],
  ["hair_description", "Hair"],
  ["eye_description", "Eyes"],
  ["skin_complexion", "Skin tone / complexion"],
  ["facial_hair", "Facial hair"],
  ["glasses_contacts", "Glasses or contacts"],
  ["tattoos_description", "Tattoos"],
  ["scars_marks_description", "Scars, marks, and distinctive features"],
  ["mobility_description", "Mobility or recognizable movement"],
  ["clothing_description", "Last-seen clothing"],
  ["outerwear_description", "Outerwear and weather gear"],
  ["footwear_description", "Footwear"],
  ["carried_items_description", "Carried items"],
  ["vehicle_transportation_description", "Vehicle or transportation"],
  ["summary", "Public facts"],
  ["public_summary_proposed", "Public facts"],
  ["last_seen_locality", "Last-seen locality"],
  ["last_seen_province_territory", "Province or territory"],
  ["lead_police_service", "Lead police service"],
  ["police_file_number", "Police file number"],
  ["official_tip_contact", "Official tip contact"],
  ["submitter_name", "Your name"],
  ["submitter_email", "Your email"],
  ["relationship", "Your relationship"]
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
          <p>Nothing has been sent yet. Review the information so you can catch spelling, location, contact, photo, or permission mistakes first.</p>
          <button type="button" onClick={review}>Review what I entered</button>
        </div>
      ) : (
        <section className="card" aria-labelledby="submission-review-heading">
          <p className="eyebrow">Final review</p>
          <h2 id="submission-review-heading">Check the information before you send it</h2>
          <p className="muted reading-measure">Private review-only details are not repeated here. If anything is wrong, choose “Go back and edit.” Any change will require another review before sending.</p>
          <dl className="review-list">
            {items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            <div><dt>Photos selected</dt><dd>{photoNames.length ? photoNames.join(", ") : "None"}</dd></div>
          </dl>
          <div className="notice warning">
            <strong>One last safety check</strong>
            <p>Do not send rumors, public accusations, exact private addresses, shelter or family locations, graphic details, or anything that could put a person, family, witness, or investigation at risk.</p>
          </div>
          <div className="button-row">
            <button type="submit">Send to MMIPS for review</button>
            <button type="button" className="button secondary" onClick={() => setReviewed(false)}>Go back and edit</button>
          </div>
        </section>
      )}
    </div>
  );
}
