import Image from "next/image";
import Link from "next/link";
import { mmipsSiteMode } from "@/lib/site-mode";
import { FamilyRecordPrintActions } from "./FamilyRecordPrintActions";

type FieldProps = {
  id: string;
  label: string;
  help?: string;
  multiline?: boolean;
  privateField?: boolean;
};

function RecordField({ id, label, help, multiline = false, privateField = false }: FieldProps) {
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div className={`family-record-field${privateField ? " private-record-field" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {multiline
        ? <textarea id={id} aria-describedby={helpId} autoComplete="off" rows={3} />
        : <input id={id} aria-describedby={helpId} autoComplete="off" />}
      {help ? <p className="field-help" id={helpId}>{help}</p> : null}
    </div>
  );
}

function ContactLog() {
  return (
    <div className="family-record-log" role="group" aria-label="Calls and updates log">
      {[1, 2, 3, 4].map((row) => (
        <div className="family-record-log-row" key={row}>
          <RecordField id={`contact-${row}-date`} label={`Contact ${row}: date and time`} />
          <RecordField id={`contact-${row}-person`} label="Person, agency, and contact" />
          <RecordField id={`contact-${row}-notes`} label="What happened and next step" multiline />
        </div>
      ))}
    </div>
  );
}

export default function FamilyRecordPage() {
  const isCanada = mmipsSiteMode() === "ca";
  const countryLabel = isCanada ? "Canada" : "United States";
  const pdfHref = isCanada ? "/forms/mmips-canada-family-record.pdf" : "/forms/mmips-us-family-record.pdf";

  return (
    <main className="family-record-page">
      <div className="container family-record-actions no-print">
        <Link className="button secondary" href="/resources">Back to Family Resources</Link>
        <FamilyRecordPrintActions />
        <a className="button secondary" href={pdfHref} download>Download fillable PDF</a>
      </div>

      <article className="family-record-sheet" aria-labelledby="family-record-title">
        <header className="family-record-header">
          <Image src="/mmips-hand-transparent.png" alt="" aria-hidden="true" width={96} height={96} priority />
          <div>
            <p className="family-record-eyebrow">MMIPS {countryLabel}</p>
            <h1 id="family-record-title">Family record</h1>
            <p>Use only what helps. Leave anything blank. You can pause and return when you are ready.</p>
          </div>
        </header>

        <section className="family-record-privacy" aria-labelledby="family-record-privacy-heading">
          <h2 id="family-record-privacy-heading">This copy stays with you</h2>
          <p>Nothing you type on this page is sent to MMIPS or saved by this page. Printing or saving as a PDF uses your browser. Keep the completed record somewhere private and share it only with people or services you trust.</p>
          <p><strong>Immediate danger:</strong> Call 911. You do not need to finish this record first.</p>
        </section>

        <div className="family-record-form" role="form" aria-label={`MMIPS ${countryLabel} family record`}>
          <section className="family-record-section" aria-labelledby="person-section-heading">
            <h2 id="person-section-heading">1. Person and report</h2>
            <div className="family-record-grid two-column">
              <RecordField id="person-name" label="Person's full name" />
              <RecordField id="person-used-name" label="Name they use and pronouns (optional)" />
              <RecordField id="concern-date" label="Date and time the concern began" />
              <RecordField id="report-date" label="Date and time first reported" />
              <RecordField id="agency" label={isCanada ? "Police service" : "Tribal, local, state, or federal agency"} />
              <RecordField id="file-number" label={isCanada ? "Police file number" : "Agency case or file number"} />
              <RecordField id="investigator" label="Investigator or family liaison" />
              <RecordField id="investigator-contact" label="Official phone or email" />
              <RecordField id="tribal-contact" label={isCanada ? "First Nation, Inuit, Métis, or victim-services contact (optional)" : "Tribal or victim-services contact (optional)"} />
              <RecordField id="other-reference" label={isCanada ? "Other official reference number or link" : "NCIC confirmation, NamUs number, or other official reference"} />
            </div>
          </section>

          <section className="family-record-section" aria-labelledby="location-section-heading">
            <h2 id="location-section-heading">2. Location and basic information</h2>
            <p className="family-record-guidance">Keep exact or sensitive details in the private box. Use only a broad area in public posts.</p>
            <RecordField id="public-area" label="Broad last-known area that may be safe to share publicly" help="Example: community, municipality, reservation, reserve, First Nation, or region - not a private street address." multiline />
            <RecordField id="private-location" label="Exact or sensitive location for your private record" help="Keep this off public posts. Share it only with the investigating agency or another trusted service when appropriate." multiline privateField />
            <div className="family-record-grid two-column">
              <RecordField id="description" label="Basic identifying information requested by the agency" multiline />
              <RecordField id="clothing-vehicle" label="Clothing, vehicle, travel, or mobility details" multiline />
            </div>
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="contact-section-heading">
            <h2 id="contact-section-heading">3. Calls and updates</h2>
            <p className="family-record-guidance">Short notes are enough. Write the next step so you do not have to hold it in memory.</p>
            <ContactLog />
          </section>

          <section className="family-record-section" aria-labelledby="sharing-section-heading">
            <h2 id="sharing-section-heading">4. Information approved for public sharing</h2>
            <div className="family-record-grid two-column">
              <RecordField id="photos" label="Recent photos approved for public use" help="Record filenames or where the approved copies are kept. Do not place original evidence here." multiline />
              <RecordField id="tip-contact" label="Official public tip contact" help="Use only the contact confirmed by the investigating agency." multiline />
              <RecordField id="safe-public-facts" label="Facts the family and agency say are safe to publish" multiline />
              <RecordField id="keep-private" label="Information that must stay private" help="Examples may include private addresses, shelters, witnesses, health details, or exact sensitive locations." multiline privateField />
            </div>
          </section>

          <section className="family-record-section" aria-labelledby="next-section-heading">
            <h2 id="next-section-heading">5. Questions and next steps</h2>
            <RecordField id="next-steps" label="What needs to happen next, who will do it, and when to check again" multiline />
            <RecordField id="support" label="Trusted support person or service (optional)" help="Someone who can sit with you, make calls with permission, take notes, or help you rest." multiline />
          </section>
        </div>

        <footer className="family-record-footer">
          <p><strong>MMIPS {countryLabel}</strong> - Family Resources</p>
          <p>MMIPS is not law enforcement or an emergency service. Do not send investigative tips to MMIPS.</p>
          <p>{isCanada ? "ca.mmips.com/resources" : "us.mmips.com/resources"}</p>
        </footer>
      </article>
    </main>
  );
}
