import Image from "next/image";
import Link from "next/link";
import { mmipsSiteMode } from "@/lib/site-mode";
import { FamilyRecordPrintActions } from "./FamilyRecordPrintActions";

type FieldProps = {
  id: string;
  label: string;
  help?: string;
  multiline?: boolean;
  rows?: number;
  privateField?: boolean;
};

type ChecklistProps = {
  idPrefix: string;
  items: readonly string[];
  privateList?: boolean;
};

const immediateSteps = [
  "Call 911 if there is immediate danger or urgent risk.",
  "Report the person missing as soon as you are concerned. Do not wait to complete this record.",
  "Ask for the case or file number and the lead investigator or family liaison.",
  "Tell the investigator about urgent health, medication, disability, weather, terrain, violence, or exploitation risks.",
  "Ask what information and which photograph are safe to release publicly.",
] as const;

const photoChecklist = [
  "Recent clear face photograph showing their current hairstyle and appearance",
  "Recent full-body photograph",
  "Side or profile photograph, if available",
  "Photographs that clearly show tattoos, scars, birthmarks, piercings, or other identifying features",
  "Photograph of usual glasses, jewellery, mobility aid, or other recognizable item",
  "Photograph of their vehicle, bicycle, or other regular transportation",
  "Original or highest-resolution digital files, not screenshots when originals are available",
  "A family-approved photograph that respects how the person would want to be represented publicly",
] as const;

const recordsChecklist = [
  "Government identification and correct legal name, birth date, and aliases",
  "Dentist name and contact information; ask the investigator about dental records or X-rays",
  "Doctor, clinic, pharmacy, important medical needs, and current medications",
  "Possible fingerprint source, such as prior employment, military service, immigration, or licensing",
  "Phone numbers, device type, service provider, email addresses, and social-media usernames",
  "Vehicle registration, licence plate, make, model, year, colour, and identifying damage or stickers",
  "Work, school, travel, transportation, and regular-location information",
  "Existing police reports, official reference numbers, approved posters, and public tip contacts",
] as const;

const sensitiveTopics = [
  "Urgent medical, medication, mental-health, disability, cognitive, or mobility needs",
  "Recent trauma, unusual behaviour, distress, or reason the disappearance is out of character",
  "Relationship violence, stalking, coercion, trafficking, exploitation, or another safety threat",
  "Housing instability, remote terrain, severe weather, inadequate clothing, or transportation risk",
  "Substance-use information that may help assess immediate safety or likely locations",
  "Access to weapons or another immediate danger",
  "Prior disappearances and where the person was previously located",
  "Other private information that may help investigators assess risk and locate the person",
] as const;

function RecordField({ id, label, help, multiline = false, rows = 3, privateField = false }: FieldProps) {
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div className={`family-record-field${privateField ? " private-record-field" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {multiline
        ? <textarea id={id} aria-describedby={helpId} autoComplete="off" rows={rows} />
        : <input id={id} aria-describedby={helpId} autoComplete="off" />}
      {help ? <p className="field-help" id={helpId}>{help}</p> : null}
    </div>
  );
}

function Checklist({ idPrefix, items, privateList = false }: ChecklistProps) {
  return (
    <div className={`family-record-checklist${privateList ? " private-record-checklist" : ""}`}>
      {items.map((item, index) => {
        const id = `${idPrefix}-${index + 1}`;
        return (
          <label className="family-record-check-item" htmlFor={id} key={item}>
            <input id={id} type="checkbox" />
            <span>{item}</span>
          </label>
        );
      })}
    </div>
  );
}

function TimelineLog() {
  return (
    <div className="family-record-table" role="group" aria-label="Timeline and sightings">
      {[1, 2, 3, 4, 5].map((row) => (
        <div className="family-record-table-row timeline-row" key={row}>
          <RecordField id={`timeline-${row}-date`} label={`${row}. Date and time`} />
          <RecordField id={`timeline-${row}-event`} label="Place, contact, sighting, or event" multiline rows={2} />
          <RecordField id={`timeline-${row}-source`} label="Who knows this and contact information" multiline rows={2} />
        </div>
      ))}
    </div>
  );
}

function AgencyRows() {
  return (
    <div className="family-record-table" role="group" aria-label="Agency call log">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
        <div className="family-record-table-row agency-log-row" key={row}>
          <RecordField id={`agency-log-${row}-agency`} label={`${row}. Agency or service`} />
          <RecordField id={`agency-log-${row}-number`} label="Phone or email used" />
          <RecordField id={`agency-log-${row}-person`} label="Person spoken with" />
          <RecordField id={`agency-log-${row}-time`} label="Date and time" />
          <RecordField id={`agency-log-${row}-reference`} label="File or reference number" />
          <RecordField id={`agency-log-${row}-next`} label="What they said and the next follow-up" multiline rows={3} />
        </div>
      ))}
    </div>
  );
}

export default function FamilyRecordPage() {
  const isCanada = mmipsSiteMode() === "ca";
  const countryLabel = isCanada ? "Canada" : "United States";
  const pdfHref = isCanada ? "/forms/mmips-canada-family-record.pdf" : "/forms/mmips-us-family-record.pdf";
  const agencyChecklist = isCanada
    ? [
        "911 or local emergency number, when there is immediate danger",
        "Police service of jurisdiction or local RCMP detachment",
        "First Nation, Inuit, or Indigenous police service, when applicable",
        "Lead investigator or designated family liaison officer",
        "Provincial or territorial missing-persons unit / NCMPUR contact through police",
        "Victim services or Indigenous relations / liaison officer",
        "Family Information Liaison Unit for a missing or murdered Indigenous loved one",
        "Coroner or medical examiner contact, when applicable",
      ]
    : [
        "911, when there is immediate danger",
        "Local, Tribal, or territorial law-enforcement agency",
        "Lead investigator or family liaison",
        "BIA Missing and Murdered Unit, when the case or jurisdiction may apply",
        "FBI or another federal agency, when directed or jurisdiction may apply",
        "State or territory missing-person clearinghouse",
        "NamUs after a police report is filed; ask the investigator about agency entry or family entry",
        "National Center for Missing & Exploited Children, after law enforcement, if the missing person is under 18",
        "Victim services, Tribal family support, coroner, or medical examiner, when applicable",
      ];

  return (
    <main className="family-record-page">
      <div className="container family-record-actions no-print">
        <Link className="button secondary" href="/resources">Back to Family Resources</Link>
        <FamilyRecordPrintActions />
        <a className="button secondary" href={pdfHref} download>Download fillable investigator-preparation PDF</a>
      </div>

      <article className="family-record-sheet" aria-labelledby="family-record-title">
        <header className="family-record-header">
          <Image src="/mmips-hand-transparent.png" alt="" aria-hidden="true" width={96} height={96} priority />
          <div>
            <p className="family-record-eyebrow">MMIPS {countryLabel}</p>
            <h1 id="family-record-title">Family investigator-preparation record</h1>
            <p>A private workbook for details, questions, calls, and follow-up during a stressful time.</p>
          </div>
        </header>

        <section className="family-record-privacy" aria-labelledby="family-record-privacy-heading">
          <h2 id="family-record-privacy-heading">Start with safety - this record can wait</h2>
          <p>Nothing you type on this page is sent to MMIPS or saved by this page. Printing or saving as a PDF uses your browser. Keep the completed record private and do not post it online.</p>
          <p><strong>Immediate danger:</strong> Call 911. Report the person missing as soon as you are concerned. You do not need to complete this record first, and you can leave any question blank.</p>
        </section>

        <div className="family-record-form" role="form" aria-label={`MMIPS ${countryLabel} family investigator-preparation record`}>
          <section className="family-record-section" aria-labelledby="start-section-heading">
            <h2 id="start-section-heading">1. First steps and primary case contact</h2>
            <Checklist idPrefix="first-step" items={immediateSteps} />
            <div className="family-record-grid two-column">
              <RecordField id="person-name" label="Full legal name" />
              <RecordField id="person-used-name" label="Chosen name, nickname, aliases, and pronouns" />
              <RecordField id="birth-date" label="Birth date and current age" />
              <RecordField id="community" label={isCanada ? "First Nation, Inuit, Métis, or community affiliation (optional)" : "Tribal Nation, Alaska Native, Native Hawaiian, or community affiliation (optional)"} />
              <RecordField id="reporter" label="Person making this record and relationship" />
              <RecordField id="reporter-contact" label="Private callback number and email" privateField />
              <RecordField id="report-date" label="Date and time first reported" />
              <RecordField id="agency" label={isCanada ? "Police service receiving the report" : "Tribal, local, state, territorial, or federal agency receiving the report"} />
              <RecordField id="file-number" label="Case or file number" />
              <RecordField id="investigator" label="Lead investigator or family liaison" />
              <RecordField id="investigator-contact" label="Direct official phone and email" />
              <RecordField id="next-update" label="Agreed date and time for the next update" />
            </div>
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="description-section-heading">
            <h2 id="description-section-heading">2. Complete physical description</h2>
            <p className="family-record-guidance">Use the person&apos;s current appearance. If you do not know, leave it blank. Investigators can help fill gaps.</p>
            <div className="family-record-grid three-column">
              <RecordField id="height" label="Height" />
              <RecordField id="weight" label="Weight" />
              <RecordField id="build" label="Build" />
              <RecordField id="hair" label="Hair colour, length, and style" />
              <RecordField id="eyes" label="Eye colour" />
              <RecordField id="skin" label="Skin tone / complexion" />
              <RecordField id="facial-hair" label="Facial hair" />
              <RecordField id="glasses" label="Glasses or contacts" />
              <RecordField id="languages" label="Languages and interpreter needs" />
              <RecordField id="assigned-sex" label="Assigned sex at birth, if requested for identification" privateField />
              <RecordField id="gender" label="Gender identity or expression" privateField />
              <RecordField id="appearance" label="How the person describes their race, ethnicity, or appearance (optional)" privateField />
            </div>
            <RecordField id="tattoos" label="Tattoos - design, words, colour, body location, and whether new or changed" multiline rows={5} />
            <div className="family-record-grid two-column">
              <RecordField id="scars-marks" label="Scars, birthmarks, skin marks, or surgical marks - describe and give body location" multiline rows={4} />
              <RecordField id="piercings-jewellery" label="Piercings, jewellery, dental work, braces, or other identifying features" multiline rows={4} />
              <RecordField id="mobility" label="Mobility aid, prosthetic, disability, dominant hand, posture, gait, or other recognizable movement" multiline rows={4} privateField />
              <RecordField id="other-description" label="Other identifying details investigators may need" multiline rows={4} />
            </div>
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="last-seen-section-heading">
            <h2 id="last-seen-section-heading">3. Last seen, clothing, and transportation</h2>
            <div className="family-record-grid two-column">
              <RecordField id="last-seen-date" label="Date and time last seen in person" />
              <RecordField id="last-contact-date" label="Date and time of last phone, text, email, or online contact" />
              <RecordField id="last-seen-by" label="Last person known to see or contact them" />
              <RecordField id="last-seen-by-contact" label="That person's contact information" privateField />
            </div>
            <RecordField id="private-location" label="Exact last-seen or last-contact location for investigators" help="Keep this private. Include address, unit, landmark, coordinates, route, or other exact details only when useful to investigators." multiline rows={4} privateField />
            <RecordField id="public-area" label="Broad area that the investigating agency says may be safe to share publicly" help="Example: community, municipality, reservation, reserve, First Nation, or region - not a private address." multiline rows={3} />
            <div className="family-record-grid two-column">
              <RecordField id="plans" label="Plans, destination, who they expected to meet, and expected return time" multiline rows={4} />
              <RecordField id="unusual" label="What made you concerned; anything unusual or out of character" multiline rows={4} privateField />
              <RecordField id="clothing" label="Top, bottom, dress, uniform, or other clothing" multiline rows={4} />
              <RecordField id="outerwear" label="Coat, sweater, hat, head covering, gloves, or weather gear" multiline rows={4} />
              <RecordField id="footwear" label="Shoes or boots - type, brand, colour, and size if known" multiline rows={3} />
              <RecordField id="carried-items" label="Jewellery, watch, bag, wallet, phone, mobility aid, or items carried" multiline rows={3} />
            </div>
            <RecordField id="vehicle" label="Vehicle or transportation - year, make, model, colour, licence plate, jurisdiction, damage, stickers, bicycle, transit, taxi, rideshare, or walking route" multiline rows={5} />
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="timeline-section-heading">
            <h2 id="timeline-section-heading">4. Timeline, people, places, and routines</h2>
            <p className="family-record-guidance">Start with confirmed information. Mark estimates clearly. Give investigators the source for each detail.</p>
            <TimelineLog />
            <div className="family-record-grid two-column">
              <RecordField id="work-school" label="Work, school, supervisor, teacher, attendance, and travel routine" multiline rows={5} privateField />
              <RecordField id="regular-places" label="Usual routes, stores, appointments, cultural or spiritual places, and other regular locations" multiline rows={5} privateField />
              <RecordField id="important-people" label="Family, friends, partners, co-workers, neighbours, Elders, service providers, and their contacts" multiline rows={6} privateField />
              <RecordField id="devices-accounts" label="Phone numbers, devices, carriers, email addresses, usernames, games, and social-media handles" help="Do not write passwords, passcodes, PINs, or full financial-account numbers here. Ask investigators how to provide account access safely." multiline rows={6} privateField />
            </div>
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="risk-section-heading">
            <h2 id="risk-section-heading">5. Private safety and risk information</h2>
            <p className="family-record-guidance"><strong>Investigators may ask personal questions to assess risk, not to judge the person or family.</strong> Share these details privately with the investigating agency. Do not put them in public posts.</p>
            <Checklist idPrefix="sensitive-topic" items={sensitiveTopics} privateList />
            <RecordField id="health-medication" label="Health, disability, medication, treatment, or urgent care details" multiline rows={6} privateField />
            <RecordField id="risk-context" label="Other private risk information, recent events, relationships, or likely locations investigators should know" multiline rows={7} privateField />
            <RecordField id="missing-items" label="Personal items missing or left behind - phone, wallet, keys, identification, medication, clothing, cash, passport, vehicle, treasured item, or other belongings" multiline rows={5} privateField />
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="gather-section-heading">
            <h2 id="gather-section-heading">6. Gather photographs, records, and possible identification sources</h2>
            <p className="family-record-guidance"><strong>Do not attach photographs to this workbook.</strong> Gather copies for investigators and keep the originals safe. Ask before publicly sharing any image.</p>
            <h3>Photographs to locate</h3>
            <Checklist idPrefix="photo-gather" items={photoChecklist} />
            <RecordField id="photo-location" label="Where the photo files or originals are safely kept; filenames supplied to investigators" multiline rows={4} />
            <h3>Records and contacts to locate</h3>
            <Checklist idPrefix="record-gather" items={recordsChecklist} />
            <div className="family-record-grid two-column">
              <RecordField id="dentist" label="Dentist / orthodontist name, office, phone, and dates treated" multiline rows={4} privateField />
              <RecordField id="medical" label="Doctor, clinic, hospital, pharmacy, and phone" multiline rows={4} privateField />
              <RecordField id="fingerprints" label="Where fingerprints may exist" multiline rows={3} privateField />
              <RecordField id="records-status" label="Who requested each record, date requested, and status" multiline rows={3} privateField />
            </div>
            <div className="family-record-privacy compact-privacy">
              <h3>Preserve before handling</h3>
              <p>Ask the investigator before cleaning or disturbing the person&apos;s room, vehicle, clothing, toothbrush, hairbrush, razor, devices, or other belongings. Do not collect DNA yourself. Ask before accessing accounts or organizing a search that could create safety or evidence concerns.</p>
            </div>
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="agency-section-heading">
            <h2 id="agency-section-heading">7. Agency and support checklist</h2>
            <p className="family-record-guidance">Not every service fits every case. Start with emergency help and the police service taking the report. Ask the lead investigator which additional services should be contacted so reports are coordinated.</p>
            <div className="agency-checklist-grid">
              {agencyChecklist.map((agency, index) => (
                <div className="agency-checklist-item" key={agency}>
                  <p><strong>{agency}</strong></p>
                  <label htmlFor={`agency-${index}-need`}><input id={`agency-${index}-need`} type="checkbox" /> Need to contact</label>
                  <label htmlFor={`agency-${index}-called`}><input id={`agency-${index}-called`} type="checkbox" /> Contacted</label>
                </div>
              ))}
            </div>
            {isCanada ? (
              <p className="family-record-guidance">Canada: any police station can take a report; the police service where the person was last seen generally conducts the investigation. Family Information Liaison Units are available in every province and territory for families of missing or murdered Indigenous loved ones.</p>
            ) : (
              <p className="family-record-guidance">United States: BIA MMU - 1-833-560-2065 and OJS_MMU@bia.gov. If the missing person is under 18, call NCMEC at 1-800-THE-LOST after reporting to law enforcement.</p>
            )}
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="agency-log-heading">
            <h2 id="agency-log-heading">8. Detailed agency call log</h2>
            <p className="family-record-guidance">Use one row for each call, visit, email, transfer, or promised follow-up. Write down names and times while the conversation is fresh.</p>
            <AgencyRows />
          </section>

          <section className="family-record-section family-record-page-break" aria-labelledby="follow-up-heading">
            <h2 id="follow-up-heading">9. Questions, follow-up, and safe public information</h2>
            <div className="family-record-grid two-column">
              <RecordField id="investigator-questions" label={isCanada ? "Questions: CPIC entry, lead agency, risk assessment, search plan, family liaison, NCMPUR / DNA program, and next update" : "Questions: NCIC entry, lead agency, search plan, family liaison, NamUs, BIA MMU, NCMEC if applicable, DNA / dental / fingerprint needs, and next update"} multiline rows={7} />
              <RecordField id="next-steps" label="Next steps - what will happen, who is responsible, and the date and time to follow up" multiline rows={7} />
              <RecordField id="approved-public" label="Exact information and photo filenames approved by the family and investigating agency for public use" multiline rows={6} />
              <RecordField id="official-tip-contact" label="Official public tip phone, email, website, and case number" multiline rows={6} />
              <RecordField id="keep-private" label="Information that must stay private or must not be published" multiline rows={6} privateField />
              <RecordField id="support-plan" label="Trusted support person, victim service, Elder, cultural support, interpreter, rest plan, or help with calls" multiline rows={6} />
            </div>
          </section>
        </div>

        <footer className="family-record-footer">
          <p><strong>MMIPS {countryLabel}</strong> - Family Resources</p>
          <p>MMIPS is not law enforcement or an emergency service. This workbook does not replace a missing-person report. Do not send investigative tips or this completed private record to MMIPS.</p>
          <p>{isCanada ? "ca.mmips.com/resources" : "us.mmips.com/resources"}</p>
        </footer>
      </article>
    </main>
  );
}
