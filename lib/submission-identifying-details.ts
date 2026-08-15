export type SubmissionIdentifyingField = {
  name: string;
  label: string;
  multiline?: boolean;
  maxLength: number;
};

export const SUBMISSION_IDENTIFYING_FIELDS: readonly SubmissionIdentifyingField[] = [
  { name: "height_description", label: "Height (feet and inches or centimetres)", maxLength: 120 },
  { name: "weight_description", label: "Weight (pounds or kilograms)", maxLength: 120 },
  { name: "build_description", label: "Build", maxLength: 200 },
  { name: "hair_description", label: "Hair colour, length, and style", maxLength: 300 },
  { name: "eye_description", label: "Eye colour or eye description", maxLength: 300 },
  { name: "skin_complexion", label: "Skin tone or complexion", maxLength: 300 },
  { name: "facial_hair", label: "Facial hair", maxLength: 300 },
  { name: "glasses_contacts", label: "Glasses or contacts", maxLength: 300 },
  { name: "tattoos_description", label: "Tattoos - design, words, colour, and body location", multiline: true, maxLength: 1200 },
  { name: "scars_marks_description", label: "Scars, birthmarks, surgical marks, piercings, or other distinctive features", multiline: true, maxLength: 1200 },
  { name: "mobility_description", label: "Mobility aid, prosthetic, gait, posture, or recognizable movement", multiline: true, maxLength: 800 },
  { name: "clothing_description", label: "Last-seen clothing", multiline: true, maxLength: 1200 },
  { name: "outerwear_description", label: "Coat, hat, head covering, gloves, or weather gear", multiline: true, maxLength: 800 },
  { name: "footwear_description", label: "Footwear - type, brand, colour, and size if known", multiline: true, maxLength: 800 },
  { name: "carried_items_description", label: "Jewellery, watch, bag, wallet, phone, mobility aid, or other carried items", multiline: true, maxLength: 1200 },
  { name: "vehicle_transportation_description", label: "Vehicle or transportation details", multiline: true, maxLength: 1200 },
] as const;

function formText(form: FormData, field: SubmissionIdentifyingField) {
  const entry = form.get(field.name);
  if (typeof entry !== "string") return "";
  return entry.trim().replace(/\s+/g, " ").slice(0, field.maxLength);
}

export function appendIdentifyingDetailsToSummary(form: FormData, summary: string) {
  const cleanSummary = summary.trim().slice(0, 8000);
  const details = SUBMISSION_IDENTIFYING_FIELDS.flatMap((field) => {
    const value = formText(form, field);
    return value ? [`${field.label}: ${value}`] : [];
  });
  if (!details.length) return cleanSummary;
  return `${cleanSummary}\n\nIdentifying details supplied for MMIPS review (not published automatically): ${details.join("; ")}`.slice(0, 24000);
}
