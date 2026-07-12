import { SafetyNotice } from "../../components/SafetyNotice";

const officialLinks = [
  {
    title: "Emergency",
    body: "If someone is in immediate danger or needs urgent medical help, call 911 now.",
    href: "tel:911",
    linkText: "Call 911"
  },
  {
    title: "NamUs",
    body: "National missing, unidentified, and unclaimed-person resource. Ask law enforcement whether a NamUs entry exists and write down the NamUs number.",
    href: "https://namus.nij.ojp.gov/",
    linkText: "Open NamUs"
  },
  {
    title: "BIA Missing and Murdered Unit",
    body: "For missing or murdered Indigenous people, the BIA Office of Justice Services Missing and Murdered Unit lists resources, contacts, and public profiles.",
    href: "https://www.bia.gov/service/mmu",
    linkText: "Open BIA MMU"
  },
  {
    title: "FBI tips",
    body: "Use the FBI tip portal only when appropriate or when an official profile/flyer directs tips to the FBI.",
    href: "https://tips.fbi.gov/home",
    linkText: "Open FBI tips"
  },
  {
    title: "National Center for Missing & Exploited Children",
    body: "For missing children, call NCMEC after reporting to local law enforcement: 1-800-THE-LOST / 1-800-843-5678.",
    href: "https://www.missingkids.org/gethelpnow/isyourchildmissing",
    linkText: "Open NCMEC"
  },
  {
    title: "StrongHearts Native Helpline",
    body: "Confidential domestic, dating, and sexual violence support for Native people and loved ones. If the person is in immediate danger, call 911 first.",
    href: "https://strongheartshelpline.org/",
    linkText: "Open StrongHearts"
  }
];

const immediateSteps = [
  "Call 911 if there is immediate danger.",
  "Contact local law enforcement and tribal law enforcement as soon as possible. Do not wait 24 hours.",
  "Ask for the agency report/case number and the name/contact of the lead investigator or family liaison.",
  "Ask whether the person has been entered into NCIC. Families may not get direct NCIC access, but they can ask the agency to confirm entry.",
  "Ask whether NamUs has been created or requested. Write down the NamUs number/link.",
  "Ask whether the relevant Tribe, tribal police, victim-services program, BIA MMU, or FBI should be notified.",
  "Gather recent photos, identifying marks, clothing, vehicle details, last-known time/location, and safe public contact information.",
  "Do not post rumors, suspect accusations, exact private addresses, shelter locations, or unsafe details publicly. Send information to the official contact."
];

const askFor = [
  "Agency report/case number",
  "Lead investigator or family liaison contact",
  "NCIC entry confirmation",
  "NamUs number or link",
  "Official tip line or public information officer contact",
  "Whether a tribal agency or BIA MMU has been notified",
  "Official flyer, if one exists",
  "What information is safe to share publicly"
];

export default function ResourcesPage() {
  return (
    <main className="container section resources-page">
      <h1>Family resources</h1>
      <p className="lead">This page helps families and authorized advocates move quickly, contact the right official channels, and share public information safely. MMIPS does not collect investigative tips.</p>
      <SafetyNotice />

      <section className="card resource-priority-card">
        <h2>If someone is missing now</h2>
        <p className="lead compact-lead">Start with official reporting first. Then use MMIPS for public awareness, flyers, profile updates, and safe sharing.</p>
        <ol className="resource-checklist">
          {immediateSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>

      <section className="feature-grid resource-link-grid">
        {officialLinks.map((resource) => (
          <div className="card" key={resource.title}>
            <h3>{resource.title}</h3>
            <p>{resource.body}</p>
            <a className="button secondary" href={resource.href} target={resource.href.startsWith("http") ? "_blank" : undefined} rel={resource.href.startsWith("http") ? "noreferrer" : undefined}>{resource.linkText}</a>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>What to ask for when you talk to an agency</h2>
        <p>Keep a written note of who you spoke with, the date/time, and what they said. These fields also help MMIPS publish accurate public-awareness information after review.</p>
        <div className="resource-chip-list">
          {askFor.map((item) => <span className="resource-chip" key={item}>{item}</span>)}
        </div>
      </section>

      <section className="card">
        <h2>Before sharing online</h2>
        <div className="feature-grid compact-grid">
          <div>
            <h3>Share</h3>
            <p>Recent approved photos, official contact information, broad last-known area, NamUs/agency numbers, MMIPS profile link, and the current flyer.</p>
          </div>
          <div>
            <h3>Do not share</h3>
            <p>Rumors, suspect names, private addresses, shelter/domestic-violence locations, graphic images, exact minor-sensitive locations, or screenshots that could endanger someone.</p>
          </div>
          <div>
            <h3>Where tips go</h3>
            <p>Send tips to the official agency, official tip line, NamUs, BIA MMU, FBI, tribal police, or 911 in an emergency. Do not send investigative tips to MMIPS.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>MMIPS contact</h2>
        <p>Use these for site questions, corrections, removals, privacy, or updated public information. Do not use MMIPS email for emergency tips.</p>
        <p className="contact-line">
          General: <a href="mailto:contact@mmips.com">contact@mmips.com</a><br />
          Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />
          Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a>
        </p>
      </section>
    </main>
  );
}
